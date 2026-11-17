const cron = require('node-cron');
const takingData = require('../index.js');
const User = require('../models/Register.js');
const { sendPriceDropEmail } = require("../services/email.services.js")
const { normalizePrice } = require('../utils/price.js')
const { parseAmazonUrl } = require('../utils/amazonUrl.js')
const { BlockedError } = require('../errors/scraper.errors.js')

// Consulta um ASIN uma única vez. Retorna { ok: true, price } ou { ok: false, error }.
// BlockedError é relançado para interromper o ciclo inteiro.
async function fetchPrice(canonicalUrl) {
    try {
        const [data] = await takingData(canonicalUrl)
        const price = normalizePrice(data.price)
        if (!Number.isFinite(price)) {
            return { ok: false, error: new Error(`Preço inválido: "${data.price}"`) }
        }
        return { ok: true, price }
    } catch (error) {
        if (error instanceof BlockedError) throw error
        return { ok: false, error }
    }
}

async function runPriceMonitor() {
    console.log('⏱ Rodando monitoramento de preços...');

    const stats = { checked: 0, unchanged: 0, changed: 0, failed: 0, skipped: 0, reused: 0 }
    // ASIN -> resultado: o mesmo produto monitorado por vários usuários é consultado uma vez por ciclo.
    const resultsByAsin = new Map()

    const users = await User.find({
        products: { $exists: true, $not: { $size: 0 } }
    })

    try {
        for (const user of users) {
            for (const product of user.products) {
                const parsed = parseAmazonUrl(product.link)
                if (!parsed) {
                    stats.skipped++
                    console.warn(`Link fora da amazon.com.br ou sem ASIN, ignorado: "${product.link}"`)
                    continue
                }

                let result = resultsByAsin.get(parsed.asin)
                if (result) {
                    stats.reused++
                } else {
                    result = await fetchPrice(parsed.canonicalUrl)
                    resultsByAsin.set(parsed.asin, result)
                    stats.checked++
                }

                if (!result.ok) {
                    stats.failed++
                    console.error(`Falha ao consultar "${product.name}" (${parsed.asin}):`, result.error.message)
                    continue
                }

                const currentPrice = result.price
                const previousPrice = product.lastPrice

                if (currentPrice === previousPrice) {
                    stats.unchanged++
                    console.log(`O preço do produto "${product.name}" não mudou.`);
                    continue
                }

                stats.changed++
                product.history.push({
                    price: currentPrice,
                    date: new Date()
                });
                product.lastPrice = currentPrice;

                // Salva antes de notificar: se o save falhar, o e-mail não sai
                // e a mudança é detectada de novo no próximo ciclo.
                try {
                    await user.save()
                } catch (error) {
                    console.error(`Erro ao salvar o produto "${product.name}" do usuário ${user._id}:`, error.message)
                    continue
                }

                if (Number.isFinite(previousPrice) && currentPrice < previousPrice) {
                    try {
                        await sendPriceDropEmail({
                            to: user.email,
                            productName: product.name,
                            oldPrice: previousPrice,
                            newPrice: currentPrice,
                            link: product.link
                        })
                        console.log(`Email de queda de preço enviado para ${user.email} sobre o produto "${product.name}".`);
                    } catch (error) {
                        console.error("Erro ao enviar email:", error);
                    }
                } else {
                    console.log("o preço subiu.")
                }
            }
        }
    } catch (error) {
        if (!(error instanceof BlockedError)) throw error
        console.warn('Ciclo interrompido: a Amazon sinalizou bloqueio. Nenhuma nova tentativa será feita até o fim da pausa.', error.details)
    }

    console.log('Monitoramento finalizado:', stats)
}

function startPriceMonitorJob() {
    // noOverlap: se um ciclo ainda estiver rodando, o próximo disparo é ignorado.
    cron.schedule('0 */6 * * *', async () => {
        try {
            await runPriceMonitor()
        } catch (error) {
            console.error('Erro inesperado no monitoramento de preços:', error)
        }
    }, { noOverlap: true, name: 'price-monitor' });
}

module.exports = startPriceMonitorJob;
