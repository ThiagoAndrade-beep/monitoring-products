import fetchApi from "../axios/config";
import fetchApiDev from "../axios/config-dev";

export async function registerUser(data) {
    const response = await fetchApi.post('/register', data)
    return response.data
}