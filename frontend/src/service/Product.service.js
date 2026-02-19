import fetchApi from "../axios/config";
import fetchApiDev from "../axios/config-dev";

export async function infoProducts(token) {
    const response = await fetchApi.get('/view-products', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}