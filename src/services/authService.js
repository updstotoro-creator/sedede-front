import api from './api'

/**
 * Servicio de autenticación contra el backend real (Api\Core\AuthController).
 * Auth por token Bearer (Sanctum) — sin cookies, sin csrf-cookie.
 */
export const authService = {
  async login({ email, password }) {
    const { data } = await api.post('/login', { email, password })

    localStorage.setItem('sedede_token', data.token)

    return data.data // el usuario viene dentro de "data.data"
  },

  async logout() {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('sedede_token')
    }
  },

  async me() {
    const { data } = await api.get('/me')
    return data.data
  },
}