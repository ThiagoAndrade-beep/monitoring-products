const puppeteer = require('puppeteer')

let browserInstance = null

async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote'
            ]
        })
        console.log('browser iniciado')
    }
    return browserInstance
}

module.exports = {getBrowser}