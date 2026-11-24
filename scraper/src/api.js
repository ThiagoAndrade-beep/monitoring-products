// Cliente HTTP do backend. Toda comunicação usa o WORKER_TOKEN,
// que é um segredo diferente do JWT dos usuários.

const REQUEST_TIMEOUT_MS = 30000

function getConfig() {
    const baseUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '')
    const token = process.env.WORKER_TOKEN || ''
    return { baseUrl, token }
}

async function request(method, path, body) {
    const { baseUrl, token } = getConfig()
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`${method} ${path} -> HTTP ${response.status} ${text.slice(0, 200)}`)
    }
    return response.json()
}

// Retorna [{ asin }] com os produtos que precisam de verificação (pendentes primeiro).
async function getJobs(limit) {
    const data = await request('GET', `/worker/jobs?limit=${limit}`)
    return Array.isArray(data.jobs) ? data.jobs : []
}

async function sendResults(results) {
    return request('POST', '/worker/results', { results })
}

async function reportStatus(status) {
    return request('POST', '/worker/status', status)
}

module.exports = { getConfig, getJobs, sendResults, reportStatus }
