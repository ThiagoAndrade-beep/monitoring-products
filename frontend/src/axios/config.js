import axios from "axios"

const fetchApiDev = axios.create({
    baseURL: 'http://34.224.21.23:80/auth',
    headers: {
        "Content-Type": "application/json"
    }
})

export default fetchApiDev