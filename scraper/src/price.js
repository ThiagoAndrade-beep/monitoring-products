function normalizePrice(price) {
    if (typeof price !== "string") return NaN

    const cleaned = price
        .replace(/[^\d.,]/g, "") // remove "R$", espaços e &nbsp;
        .replace(/\./g, "")      // separador de milhar
        .replace(",", ".")       // separador decimal

    if (!cleaned) return NaN
    return Number(cleaned)
}

module.exports = { normalizePrice }
