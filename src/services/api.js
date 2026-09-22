import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/sedede/api'
const prefix = import.meta.env.VITE_API_PREFIX || '/v1'

// Cliente para el consumo de la API REST del backend (Laravel Sanctum,
// autenticación por token Bearer — sin cookies, sin csrf-cookie).
const api = axios.create({
  baseURL: `${baseURL}${prefix}`,
  headers: {
    Accept: 'application/json',
  },
})

// Adjunta el token guardado por el store de auth en cada petición saliente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sedede_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Manejo centralizado de sesión expirada / no autorizada
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('sedede_token')
      const base = import.meta.env.BASE_URL || '/sedede/'
      const loginUrl = `${base}login`.replace(/\/+/g, '/')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = loginUrl
      }
    }
    return Promise.reject(error)
  }
)

export default api
