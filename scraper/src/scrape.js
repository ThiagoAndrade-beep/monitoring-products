const { getBrowser } = require("./browser")
const scraperGuard = require("./guard")
// Reaproveita o validador do backend (mesmo repositório) para não duplicar as regras de URL.
const { isAllowedAmazonHost } = require("../../backend/utils/amazonUrl")
const { BlockedError, ProductUnavailableError } = require("./errors")

const BLOCK_STATUSES = [403, 429, 503]

// Contêineres do preço principal (bloco de compra), do mais específico ao mais genérico.
// O fallback fica restrito à área do produto (#ppd): um "span.a-price" solto na página
// pode ser de outro produto (carrosséis, patrocinados) e gerar uma queda de preço falsa.
const PRICE_CONTAINERS = [
    "#corePrice_feature_div span.a-price:not(.a-text-price)",
    "#corePriceDisplay_desktop_feature_div span.a-price:not(.a-text-price)",
    "#corePrice_desktop span.a-price:not(.a-text-price)",
    "#apex_desktop span.a-price:not(.a-text-price)",
    "#ppd span.a-price:not(.a-text-price)"
]

// Sinais de produto esgotado/indisponível no bloco de compra.
const OUT_OF_STOCK_SELECTORS = "#outOfStock, #outOfStockBuyBox_feature_div"

async function detectBlock(page, response) {
    const httpStatus = response?.status()
    const finalUrl = page.url()

    if (BLOCK_STATUSES.includes(httpStatus) || /\/errors\/validateCaptcha/i.test(finalUrl)) {
        return { httpStatus, finalUrl }
    }

    const captchaForm = await page.$('form[action*="validateCaptcha"], #captchacharacters')
    if (captchaForm) {
        return { httpStatus, finalUrl, captcha: true }
    }

    return null
}

async function takingData(url) {
    // Com o circuito aberto não fazemos nenhuma requisição à Amazon.
    if (scraperGuard.isOpen()) {
        throw new BlockedError("Scraper pausado após bloqueio recente da Amazon", {
            pausedUntil: scraperGuard.getBlockedUntil()?.toISOString()
        })
    }

    const browser = await getBrowser()
    const page = await browser.newPage()
    let response

    try {
        await page.setRequestInterception(true)
        page.on('request', (req) => {
            // Defesa extra contra SSRF: a aba nunca navega para fora da amazon.com.br,
            // mesmo que haja um redirecionamento.
            if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
                let hostname = ""
                try {
                    hostname = new URL(req.url()).hostname
                } catch { /* URL inválida -> bloqueia */ }
                if (!isAllowedAmazonHost(hostname)) {
                    req.abort()
                    return
                }
            }

            const blocked = ['image', 'stylesheet', 'font', 'media']
            if (blocked.includes(req.resourceType())) {
                req.abort()
            } else {
                req.continue()
            }
        })

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        await page.setViewport({ width: 1366, height: 768 })
        await page.setExtraHTTPHeaders({
            "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
        })
        response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })

        // Detecta bloqueio logo após a navegação, sem esperar por seletores que não existirão.
        const block = await detectBlock(page, response)
        if (block) {
            scraperGuard.trip(block)
            throw new BlockedError("A Amazon bloqueou ou pediu verificação", block)
        }

        if (response?.status() === 404) {
            throw new ProductUnavailableError("Produto não encontrado (404)", { httpStatus: 404 })
        }

        const nameSelector = "#productTitle"
        await page.waitForSelector(nameSelector, { timeout: 20000, visible: true })
        const name = await page.$eval(nameSelector, (el) => el.textContent.trim())

        // Produto esgotado: não procuramos preço (qualquer valor encontrado seria de outro item).
        if (await page.$(OUT_OF_STOCK_SELECTORS)) {
            const availability = await page
                .$eval("#availability", (el) => el.innerText.trim().slice(0, 200))
                .catch(() => null)
            throw new ProductUnavailableError("Produto indisponível no momento", { availability })
        }

        // O preço vem no HTML inicial; a espera curta cobre layouts mais lentos.
        await page.waitForSelector(PRICE_CONTAINERS.join(", "), { timeout: 10000 }).catch(() => null)
        const price = await page.evaluate((containers) => {
            for (const selector of containers) {
                const el = document.querySelector(selector)
                if (!el) continue

                const offscreen = el.querySelector(".a-offscreen")?.textContent.trim()
                if (offscreen) return offscreen

                const whole = el.querySelector(".a-price-whole")?.textContent.replace(/[^\d.]/g, "")
                const fraction = el.querySelector(".a-price-fraction")?.textContent.replace(/\D/g, "")
                if (whole) return `R$${whole},${fraction || "00"}`
            }
            return null
        }, PRICE_CONTAINERS)

        if (!price) {
            const availability = await page
                .$eval("#availability", (el) => el.innerText.trim().slice(0, 200))
                .catch(() => null)
            throw new ProductUnavailableError("Preço não encontrado na página", { availability })
        }

        scraperGuard.recordSuccess()

        return [
            {
                url,
                name,
                price,
                timeStamp: new Date().toISOString()
            }
        ]
    } catch (error) {
        let pageDetails = {}
        try {
            pageDetails = await page.evaluate(() => ({
                title: document.title,
                text: (document.body?.innerText || "").slice(0, 700)
            }))
        } catch (diagnosticError) {
            pageDetails.diagnosticError = diagnosticError.message
        }

        console.error("Erro no Puppeteer ao ler a página:", {
            type: error.name,
            message: error.message,
            requestedUrl: url,
            finalUrl: page.url(),
            httpStatus: response?.status(),
            ...error.details,
            ...pageDetails
        })
        throw error
    } finally {
        try {
            if (!page.isClosed()) {
                await page.close()
            }
        } catch (closeError) {
            // O browser pode ter caído; não deixamos isso mascarar o erro original.
            console.warn("Não foi possível fechar a aba:", closeError.message)
        }
    }

}
module.exports = takingData
