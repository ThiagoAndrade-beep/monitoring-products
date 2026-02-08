import axios from "axios"

const fetchApi = axios.create({
    baseURL: "https://monitoring-products-develop-api.up.railway.app/auth/",
    headers: {
        "Content-Type": "application/json"
    }
})

export default fetchApi