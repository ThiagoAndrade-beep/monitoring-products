const { getBrowser } = require("./services/browser")

async function takingData(url) {
    const browser = await getBrowser()
    const page = await browser.newPage()
    let response

    try {
        await page.setRequestInterception(true)
        page.on('request', (req) => {
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

        const nameSelector = "#productTitle"
        await page.waitForSelector(nameSelector, { timeout: 60000, visible: true })
        const name = await page.$eval(nameSelector, (el) => el.innerHTML.trim())

        const priceSelector = "span.a-price > span.a-offscreen"
        await page.waitForSelector(priceSelector)
        const price = await page.$eval(priceSelector, (el) => el.innerHTML.trim())


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
            message: error.message,
            requestedUrl: url,
            finalUrl: page.url(),
            httpStatus: response?.status(),
            ...pageDetails
        })
        throw error
    } finally {
        if (!page.isClosed()) {
            await page.close()
        }
    }

}
module.exports = takingData 
