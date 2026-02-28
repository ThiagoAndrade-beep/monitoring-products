const { getBrowser } = require("./services/browser")

async function takingData(url) {
    const browser = getBrowser()
    const page = await browser.newPage()
    
    try {
        await page.setUserAgent( 
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        await page.goto(url, { waitUntil: "domcontentloaded"})

        const nameSelector = "#productTitle"
        await page.waitForSelector(nameSelector, { timeout: 60000 })
        const name = await page.$eval(nameSelector, (el) => el.innerHTML.trim())

        const priceSelector = "span.a-price > span.a-offscreen"
        await page.waitForSelector(priceSelector)
        const price = await page.$eval(priceSelector, (el) => el.innerHTML.trim())


        await page.close()

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