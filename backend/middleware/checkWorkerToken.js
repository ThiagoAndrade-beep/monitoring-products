const crypto = require("crypto")

// Autentica o worker local por um segredo compartilhado (WORKER_TOKEN),
// separado do JWT dos usuários. A comparação é feita em tempo constante.
function checkWorkerToken(req, res, next) {
    const expected = process.env.WORKER_TOKEN || ""
    if (expected.length < 32) {
        return res.status(503).json({ msg: "Worker não configurado no servidor." })
    }

    const authHeader = req.headers["authorization"] || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""

    const received = Buffer.from(token)
    const wanted = Buffer.from(expected)
    if (received.length !== wanted.length || !crypto.timingSafeEqual(received, wanted)) {
        return res.status(401).json({ msg: "Não autorizado." })
    }

    next()
}

module.exports = checkWorkerToken
