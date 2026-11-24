// Rotas usadas apenas pelo worker local (scraper/), autenticadas pelo WORKER_TOKEN.

const express = require("express")
const checkWorkerToken = require("../middleware/checkWorkerToken.js")
const {
    sanitizeResult,
    applyResult,
    getDueAsins,
    touchWorkerStatus
} = require("../services/priceUpdate.service.js")

const CHECK_INTERVAL_MS = (Number(process.env.CHECK_INTERVAL_HOURS) || 6) * 60 * 60 * 1000
const MAX_JOBS = 50
const MAX_RESULTS_PER_REQUEST = 50

const router = express.Router()
router.use(checkWorkerToken)

// GET /worker/jobs?limit=10 -> { jobs: [{ asin }] }
router.get("/jobs", async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), MAX_JOBS)

    try {
        const jobs = await getDueAsins(limit, CHECK_INTERVAL_MS)
        await touchWorkerStatus({ state: "running", pausedUntil: null })
        res.status(200).json({ jobs })
    } catch (error) {
        console.error("Erro ao listar produtos para o worker:", error)
        res.status(500).json({ msg: "Erro no servidor." })
    }
})

// POST /worker/results { results: [{ asin, status, name?, price?, error? }] }
router.post("/results", async (req, res) => {
    const rawResults = Array.isArray(req.body?.results) ? req.body.results : null
    if (!rawResults || rawResults.length === 0 || rawResults.length > MAX_RESULTS_PER_REQUEST) {
        return res.status(422).json({ msg: `Envie entre 1 e ${MAX_RESULTS_PER_REQUEST} resultados.` })
    }

    const summary = { processed: 0, rejected: 0, productsUpdated: 0 }

    try {
        for (const raw of rawResults) {
            const result = sanitizeResult(raw)
            if (!result) {
                summary.rejected++
                continue
            }
            summary.productsUpdated += await applyResult(result)
            summary.processed++
        }
        res.status(200).json(summary)
    } catch (error) {
        console.error("Erro ao processar resultados do worker:", error)
        res.status(500).json({ msg: "Erro no servidor." })
    }
})

// POST /worker/status { state: "running" | "paused", pausedUntil? }
router.post("/status", async (req, res) => {
    const state = req.body?.state === "paused" ? "paused" : "running"
    const pausedUntil = state === "paused" && req.body?.pausedUntil ? new Date(req.body.pausedUntil) : null

    try {
        await touchWorkerStatus({
            state,
            pausedUntil: pausedUntil && !Number.isNaN(pausedUntil.getTime()) ? pausedUntil : null
        })
        res.status(200).json({ ok: true })
    } catch (error) {
        console.error("Erro ao salvar status do worker:", error)
        res.status(500).json({ msg: "Erro no servidor." })
    }
})

module.exports = router
