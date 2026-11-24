// Aplica no banco o resultado de uma verificação feita pelo worker:
// atualiza todos os usuários que monitoram o ASIN, grava o histórico
// e envia o e-mail de queda de preço.
// (Lógica que antes ficava no jobs/priceMonitor.job.js.)

const User = require("../models/Register.js")
const WorkerStatus = require("../models/WorkerStatus.js")
const { sendPriceDropEmail } = require("./email.services.js")

const ASIN_REGEX = /^[A-Z0-9]{10}$/
const RESULT_STATUSES = ["ok", "unavailable", "error"]
const MAX_PRICE = 10_000_000

// Valida e normaliza um resultado vindo do worker. Retorna null se for inválido.
function sanitizeResult(raw) {
    if (!raw || typeof raw !== "object") return null

    const asin = String(raw.asin || "").toUpperCase()
    if (!ASIN_REGEX.test(asin)) return null
    if (!RESULT_STATUSES.includes(raw.status)) return null

    if (raw.status === "ok") {
        const price = Number(raw.price)
        const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 500) : ""
        if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE || !name) return null
        return { asin, status: "ok", price: Math.round(price * 100) / 100, name }
    }

    return {
        asin,
        status: raw.status,
        error: typeof raw.error === "string" ? raw.error.slice(0, 300) : undefined
    }
}

async function notifyPriceDrop(user, product, oldPrice, newPrice) {
    try {
        await sendPriceDropEmail({
            to: user.email,
            productName: product.name,
            oldPrice,
            newPrice,
            link: product.link
        })
        console.log(`Email de queda de preço enviado para ${user.email} sobre o produto "${product.name}".`)
    } catch (error) {
        console.error("Erro ao enviar email:", error)
    }
}

async function applyResult(result) {
    const checkedAt = new Date()
    const users = await User.find({ "products.asin": result.asin })
    let updatedProducts = 0

    for (const user of users) {
        const drops = []

        for (const product of user.products) {
            if (product.asin !== result.asin) continue
            updatedProducts++
            product.lastCheckedAt = checkedAt

            if (result.status !== "ok") {
                product.status = result.status
                product.lastError = result.error
                continue
            }

            const previousPrice = product.lastPrice
            product.status = "ok"
            product.lastError = undefined
            if (!product.name) product.name = result.name

            if (result.price !== previousPrice) {
                product.history.push({ price: result.price, date: checkedAt })
                product.lastPrice = result.price

                if (Number.isFinite(previousPrice) && result.price < previousPrice) {
                    drops.push({ product, oldPrice: previousPrice, newPrice: result.price })
                }
            }
        }

        // Salva antes de notificar: se o save falhar, o e-mail não sai
        // e a mudança é detectada de novo na próxima verificação.
        try {
            await user.save()
        } catch (error) {
            console.error(`Erro ao salvar os produtos do usuário ${user._id}:`, error.message)
            continue
        }

        for (const drop of drops) {
            await notifyPriceDrop(user, drop.product, drop.oldPrice, drop.newPrice)
        }
    }

    return updatedProducts
}

// Lista ASINs únicos que precisam de verificação: pendentes primeiro,
// depois os verificados há mais tempo (ou nunca verificados).
async function getDueAsins(limit, checkIntervalMs) {
    const cutoff = new Date(Date.now() - checkIntervalMs)

    const rows = await User.aggregate([
        { $unwind: "$products" },
        {
            $match: {
                "products.asin": { $type: "string" },
                $or: [
                    { "products.status": "pending" },
                    { "products.lastCheckedAt": { $exists: false } },
                    { "products.lastCheckedAt": null },
                    { "products.lastCheckedAt": { $lt: cutoff } }
                ]
            }
        },
        {
            $group: {
                _id: "$products.asin",
                pending: { $max: { $cond: [{ $eq: ["$products.status", "pending"] }, 1, 0] } },
                lastCheckedAt: { $min: "$products.lastCheckedAt" }
            }
        },
        { $sort: { pending: -1, lastCheckedAt: 1 } },
        { $limit: limit }
    ])

    return rows.map((row) => ({ asin: row._id }))
}

async function touchWorkerStatus(update = {}) {
    await WorkerStatus.findByIdAndUpdate(
        "default",
        { lastSeenAt: new Date(), ...update },
        { upsert: true, setDefaultsOnInsert: true }
    )
}

module.exports = { sanitizeResult, applyResult, getDueAsins, touchWorkerStatus }
