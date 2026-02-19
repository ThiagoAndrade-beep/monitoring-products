import fetchApi from "../axios/config";

export async function authUser(data) {
    const response = await fetchApi.post('/login', data)
    return response.data
}