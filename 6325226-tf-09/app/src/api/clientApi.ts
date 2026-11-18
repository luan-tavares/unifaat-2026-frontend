import axios from "axios"

// Único cliente do Axios do app: toda chamada passa por aqui
const clientApi = axios.create({
    baseURL: "http://localhost:8080",
})

export default clientApi
