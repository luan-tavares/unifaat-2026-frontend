import axios from 'axios'

export const clientApi = axios.create({
  baseURL: 'http://localhost:8080',
})

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
