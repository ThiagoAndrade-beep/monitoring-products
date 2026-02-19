import fetchApi from "../axios/config";
import fetchApiDev from "../axios/config-dev";

export async function authUser(data) {
    const response = await fetchApi.post('/login', data)
    return response.data
}