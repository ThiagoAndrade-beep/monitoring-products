import fetchApi from "../axios/config";

export async function addUrl(novaUrl, token) {
    const response = await fetchApi.post('/add-url', {novaUrl}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}