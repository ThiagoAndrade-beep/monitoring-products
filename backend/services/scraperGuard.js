// Circuit breaker simples (em memória) para o scraper.
// Quando a Amazon sinaliza bloqueio, paramos TODAS as consultas por um período
// que cresce exponencialmente a cada novo bloqueio: 1h, 2h, 4h ... até 24h.
// Um acesso bem-sucedido zera o contador.
// Obs.: o estado se perde ao reiniciar o processo; a persistência no Mongo está no P1.

const BASE_COOLDOWN_MS = 60 * 60 * 1000
const MAX_COOLDOWN_MS = 24 * 60 * 60 * 1000

let consecutiveBlocks = 0
let blockedUntil = 0

function isOpen() {
    return Date.now() < blockedUntil
}

function getBlockedUntil() {
    return isOpen() ? new Date(blockedUntil) : null
}

function trip(reason) {
    consecutiveBlocks += 1
    const cooldown = Math.min(BASE_COOLDOWN_MS * 2 ** (consecutiveBlocks - 1), MAX_COOLDOWN_MS)
    blockedUntil = Date.now() + cooldown
    console.warn("Scraper pausado por sinal de bloqueio da Amazon:", {
        reason,
        consecutiveBlocks,
        pausedUntil: new Date(blockedUntil).toISOString()
    })
}

function recordSuccess() {
    consecutiveBlocks = 0
}

module.exports = { isOpen, getBlockedUntil, trip, recordSuccess }
