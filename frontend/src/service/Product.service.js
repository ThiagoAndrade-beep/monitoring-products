import fetchApi from "../axios/config";

export async function infoProducts(token) {
    const response = await fetchApi.get('/view-products', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}