import axios from "axios"

const fetchApiDev = axios.create({
    baseURL: 'https://api.monitoringproducts.com.br/auth',
    headers: {
        "Content-Type": "application/json"
    }
})

export default fetchApiDev