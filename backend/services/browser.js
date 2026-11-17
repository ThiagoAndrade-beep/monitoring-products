const puppeteer = require('puppeteer')

// Guardamos a *promise* do launch (e não a instância) para que chamadas
// simultâneas reutilizem o mesmo processo em vez de abrir vários Chromium.
let browserPromise = null

async function launchBrowser() {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote'
        ]
    })

    // Se o Chromium cair, a próxima chamada abre um novo em vez de usar um processo morto.
    browser.on('disconnected', () => {
        console.warn('browser desconectado; será reiniciado na próxima consulta')
        browserPromise = null
    })

    console.log('browser iniciado')
    return browser
}

async function getBrowser() {
    if (browserPromise) {
        const browser = await browserPromise.catch(() => null)
        if (browser && browser.connected) {
            return browser
        }
        browserPromise = null
    }

    browserPromise = launchBrowser().catch((error) => {
        browserPromise = null
        throw error
    })
    return browserPromise
}

module.exports = { getBrowser }
