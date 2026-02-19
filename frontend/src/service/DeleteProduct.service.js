import fetchApi from "../axios/config";

export async function deleteProducts(token, productId) {
    const response = await fetchApi.delete(`delete-product/${productId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}