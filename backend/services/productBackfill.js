// Preenche o campo asin dos produtos cadastrados antes da separação do scraper,
// para que eles entrem na fila do worker.

const User = require("../models/Register.js")
const { parseAmazonUrl } = require("../utils/amazonUrl.js")

async function backfillProductAsins() {
    const users = await User.find({ products: { $elemMatch: { asin: { $exists: false } } } })
    let filled = 0
    let invalid = 0

    for (const user of users) {
        for (const product of user.products) {
            if (product.asin) continue

            const parsed = parseAmazonUrl(product.link)
            if (parsed) {
                product.asin = parsed.asin
                filled++
            } else if (product.status !== "error") {
                product.status = "error"
                product.lastError = "Link fora da amazon.com.br ou sem ASIN"
                invalid++
            }
        }
        await user.save()
    }

    if (filled || invalid) {
        console.log(`Backfill de ASIN: ${filled} preenchido(s), ${invalid} link(s) inválido(s).`)
    }
}

module.exports = { backfillProductAsins }
