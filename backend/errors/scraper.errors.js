// Erros tipados do scraper, para que o job e as rotas reajam de forma diferente
// a bloqueio da Amazon, produto indisponível e falhas comuns.

class ScraperError extends Error {
    constructor(message, details = {}) {
        super(message)
        this.name = this.constructor.name
        this.details = details
    }
}

// A Amazon respondeu com 403/429/503 ou página de verificação (CAPTCHA).
// Nunca deve gerar nova tentativa imediata.
class BlockedError extends ScraperError {}

// Página carregou mas não há preço (indisponível, removido, layout sem oferta).
class ProductUnavailableError extends ScraperError {}

module.exports = { ScraperError, BlockedError, ProductUnavailableError }
