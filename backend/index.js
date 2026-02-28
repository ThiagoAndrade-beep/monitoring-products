const puppeteer = require("puppeteer")

async function takingData(url) {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote'
            ]
        })
        const newPage = await browser.newPage()
        await newPage.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        await newPage.goto(url, { waitUntil: "domcontentloaded"})

        const nameSelector = "#productTitle"
        await newPage.waitForSelector(nameSelector, { timeout: 60000 })
        const name = await newPage.$eval(nameSelector, (el) => el.innerHTML.trim())

        const priceSelector = "span.a-price > span.a-offscreen"
        await newPage.waitForSelector(priceSelector)
        const price = await newPage.$eval(priceSelector, (el) => el.innerHTML.trim())


        await browser.close()

        return [
            {
                url,
                name,
                price,
                timeStamp: new Date().toISOString()
            }
        ]
    } catch (error) {
        console.log('erro no puppeteer', error)
        throw error
    }

}
module.exports = takingData 