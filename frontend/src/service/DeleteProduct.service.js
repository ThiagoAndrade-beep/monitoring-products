import fetchApi from "../axios/config";
import fetchApiDev from "../axios/config-dev";

export async function deleteProducts(token, productId) {
    const response = await fetchApi.delete(`delete-product/${productId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}