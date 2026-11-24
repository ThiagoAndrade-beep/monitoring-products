const puppeteer = require('puppeteer')

// Guardamos a *promise* do launch (e não a instância) para que chamadas
// simultâneas reutilizem o mesmo processo em vez de abrir vários Chromium.
let browserPromise = null

async function launchBrowser() {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath()
    })

    // Se o Chromium cair, a próxima chamada abre um novo em vez de usar um processo morto.
    browser.on('disconnected', () => {
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

// Fecha o Chromium entre as rodadas para não deixar memória ocupada na máquina.
async function closeBrowser() {
    if (!browserPromise) return
    const browser = await browserPromise.catch(() => null)
    browserPromise = null
    if (browser && browser.connected) {
        await browser.close().catch(() => null)
    }
}

module.exports = { getBrowser, closeBrowser }
