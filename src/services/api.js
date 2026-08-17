import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL

// Cliente para las rutas web de Sanctum (cookie CSRF, /sanctum/csrf-cookie)
export const sanctum = axios.create({
  baseURL,
  withCredentials: true, // imprescindible para Sanctum SPA (cookies de sesión)
  withXSRFToken: true,
})

// Cliente para el consumo normal de la API REST
const api = axios.create({
  baseURL: `${baseURL}${import.meta.env.VITE_API_PREFIX ?? '/api'}`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

// Si en vez de Sanctum SPA usan tokens (Bearer/JWT), adjuntamos el token
// guardado por el store de auth en cada petición saliente.
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
