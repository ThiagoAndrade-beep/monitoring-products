import fetchApi from "../axios/config";
import fetchApiDev from "../axios/config-dev";

export async function infoUser(id, token) {
    const response = await fetchApi.get(`user/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}