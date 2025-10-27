const puppeteer = require("puppeteer")

async function takingData(url) {
    const browser = await puppeteer.launch({ headless: false })
    const newPage = await browser.newPage()

    await newPage.goto(url, { waitUntil: "load" })

    const nameSelector = "#productTitle"
    await newPage.waitForSelector(nameSelector)
    const name = await newPage.$eval(nameSelector, (el) => el.innerHTML.trim())

    const priceSelector = "span.a-price > span.a-offscreen"
    await newPage.waitForSelector(priceSelector)
    const price = await newPage.$eval(priceSelector, (el) => el.innerHTML.trim())

    // fs.writeFileSync("productData.json", JSON.stringify(productData, null, 2))
    await browser.close()

    return [
        {
            url,
            name,
            price,
            timeStamp: new Date().toISOString()
        }
    ]

}
module.exports = takingData 