const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const takingData = require('./scrape')
const guard = require('./guard')
const api = require('./api')
const { closeBrowser } = require('./browser')
const { normalizePrice } = require('./price')
const { BlockedError, ProductUnavailableError } = require('./errors')

const ASIN_REGEX = /^[A-Z0-9]{10}$/

const POLL_INTERVAL_MS = (Number(process.env.POLL_INTERVAL_MINUTES) || 5) * 60 * 1000
const DELAY_BETWEEN_PAGES_MS = (Number(process.env.DELAY_BETWEEN_PAGES_SECONDS) || 20) * 1000
const BATCH_SIZE = Math.min(Number(process.env.BATCH_SIZE) || 10, 50)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function validateConfig() {
    const { baseUrl, token } = api.getConfig()
    if (!baseUrl) throw new Error('Defina BACKEND_URL no scraper/.env')
    if (token.length < 32) throw new Error('Defina WORKER_TOKEN (mínimo de 32 caracteres) no scraper/.env')

    const { protocol, hostname } = new URL(baseUrl)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
    if (protocol !== 'https:' && !isLocal) {
        throw new Error('BACKEND_URL precisa usar https:// (o token seria enviado sem criptografia)')
    }
}

// Consulta um produto e devolve o resultado no formato esperado pelo backend.
// BlockedError é relançado para interromper a rodada.
async function checkProduct(asin) {
    // A URL é montada aqui a partir do ASIN validado: o worker nunca navega
    // para uma URL recebida do backend.
    const url = `https://www.amazon.com.br/dp/${asin}`

    try {
        const [data] = await takingData(url)
        const price = normalizePrice(data.price)
        if (!Number.isFinite(price) || price <= 0) {
            return { asin, status: 'error', error: `Preço inválido: "${data.price}"` }
        }
        return { asin, status: 'ok', name: data.name, price }
    } catch (error) {
        if (error instanceof BlockedError) throw error
        return {
            asin,
            status: error instanceof ProductUnavailableError ? 'unavailable' : 'error',
            error: error.message
        }
    }
}

async function reportPaused() {
    await api.reportStatus({ state: 'paused', pausedUntil: guard.getBlockedUntil()?.toISOString() })
        .catch((error) => console.warn('Não foi possível avisar o backend da pausa:', error.message))
}

async function runRound() {
    if (guard.isOpen()) {
        console.log(`Scraper pausado até ${guard.getBlockedUntil().toISOString()}; nenhuma consulta nesta rodada.`)
        await reportPaused()
        return
    }

    const jobs = (await api.getJobs(BATCH_SIZE)).filter((job) => ASIN_REGEX.test(job?.asin))
    if (jobs.length === 0) {
        console.log('Nenhum produto para verificar agora.')
        return
    }

    console.log(`Verificando ${jobs.length} produto(s)...`)
    const stats = { ok: 0, unavailable: 0, error: 0 }

    try {
        for (const [index, job] of jobs.entries()) {
            if (index > 0) await sleep(DELAY_BETWEEN_PAGES_MS)

            let result
            try {
                result = await checkProduct(job.asin)
            } catch (error) {
                if (!(error instanceof BlockedError)) throw error
                console.warn('Rodada interrompida: a Amazon sinalizou bloqueio.')
                await reportPaused()
                break
            }

            stats[result.status]++
            // Envia cada resultado na hora: se o worker cair no meio da rodada,
            // o que já foi consultado não se perde.
            await api.sendResults([result])
            console.log(`${result.asin}: ${result.status}${result.price ? ` R$ ${result.price}` : ''}`)
        }
    } finally {
        await closeBrowser()
    }

    console.log('Rodada finalizada:', stats)
}

async function main() {
    validateConfig()
    const runOnce = process.argv.includes('--once')

    console.log(`Worker iniciado (${runOnce ? 'execução única' : `a cada ${POLL_INTERVAL_MS / 60000} min`}).`)

    do {
        try {
            await runRound()
        } catch (error) {
            console.error('Erro na rodada:', error.message)
        }
        if (!runOnce) await sleep(POLL_INTERVAL_MS)
    } while (!runOnce)
}

process.on('SIGINT', async () => {
    console.log('Encerrando worker...')
    await closeBrowser()
    process.exit(0)
})

main().catch((error) => {
    console.error('Não foi possível iniciar o worker:', error.message)
    process.exit(1)
})
