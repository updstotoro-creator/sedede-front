import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL
const prefix = import.meta.env.VITE_API_PREFIX ?? '/api/v1/core'

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
    if (error.response?.status === 401) {
      localStorage.removeItem('sedede_token')
      // Evita loop si ya estamos en /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
