import axios from "axios"

const fetchApiDev = axios.create({
    baseURL: 'http://localhost:3000/auth',
    headers: {
        "Content-Type": "application/json"
    }
})

export default fetchApiDev