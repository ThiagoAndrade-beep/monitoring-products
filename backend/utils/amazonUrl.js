// Validação e normalização de URLs da Amazon Brasil.
// Só aceitamos hosts da amazon.com.br para que o Puppeteer nunca navegue
// para endereços arbitrários (ex.: rede interna / metadados da cloud).

const ALLOWED_HOSTS = new Set([
    "amazon.com.br",
    "www.amazon.com.br",
    "m.amazon.com.br"
])

const ASIN_PATTERNS = [
    /\/dp\/([A-Z0-9]{10})(?:[/?#]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?#]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?#]|$)/i
]

function isAllowedAmazonHost(hostname) {
    return ALLOWED_HOSTS.has(String(hostname).toLowerCase())
}

// Retorna { asin, canonicalUrl } ou null se a URL não for um produto da amazon.com.br
function parseAmazonUrl(rawUrl) {
    let url
    try {
        url = new URL(String(rawUrl).trim())
    } catch {
        return null
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    if (!isAllowedAmazonHost(url.hostname)) return null

    for (const pattern of ASIN_PATTERNS) {
        const match = url.pathname.match(pattern)
        if (match) {
            const asin = match[1].toUpperCase()
            return {
                asin,
                canonicalUrl: `https://www.amazon.com.br/dp/${asin}`
            }
        }
    }

    return null
}

module.exports = { parseAmazonUrl, isAllowedAmazonHost }
