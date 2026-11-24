// Circuit breaker do scraper.
// Quando a Amazon sinaliza bloqueio, paramos TODAS as consultas por um período
// que cresce exponencialmente a cada novo bloqueio: 1h, 2h, 4h ... até 24h.
// Um acesso bem-sucedido zera o contador.
// O estado é salvo em arquivo para sobreviver a reinícios do worker.

const fs = require('fs')
const path = require('path')

const STATE_FILE = path.join(__dirname, '..', '.state.json')
const BASE_COOLDOWN_MS = 60 * 60 * 1000
const MAX_COOLDOWN_MS = 24 * 60 * 60 * 1000

let consecutiveBlocks = 0
let blockedUntil = 0

function loadState() {
    try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
        consecutiveBlocks = Number(state.consecutiveBlocks) || 0
        blockedUntil = Number(state.blockedUntil) || 0
    } catch {
        // arquivo ainda não existe ou está inválido: começa do zero
    }
}

function saveState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify({ consecutiveBlocks, blockedUntil }, null, 2))
    } catch (error) {
        console.warn('Não foi possível salvar o estado do circuit breaker:', error.message)
    }
}

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
    saveState()
    console.warn('Scraper pausado por sinal de bloqueio da Amazon:', {
        reason,
        consecutiveBlocks,
        pausedUntil: new Date(blockedUntil).toISOString()
    })
}

function recordSuccess() {
    if (consecutiveBlocks === 0) return
    consecutiveBlocks = 0
    saveState()
}

loadState()

module.exports = { isOpen, getBlockedUntil, trip, recordSuccess }
