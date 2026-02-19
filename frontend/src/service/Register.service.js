import fetchApi from "../axios/config";

export async function registerUser(data) {
    const response = await fetchApi.post('/register', data)
    return response.data
}