import api from './api'

/**
 * Servicio de autenticación contra el backend real (Api\Core\AuthController).
 * Auth por token Bearer (Sanctum) — sin cookies, sin csrf-cookie.
 */
export const authService = {
  async login({ email, password }) {
    const { data } = await api.post('/core/login', { email, password })

    if (data?.token) {
      localStorage.setItem('sedede_token', data.token)
    }

    return data?.data ?? data?.user ?? data
  },

  async logout() {
    try {
      await api.post('/core/logout')
    } finally {
      localStorage.removeItem('sedede_token')
    }
  },

  async me() {
    const { data } = await api.get('/core/me')
    return data?.data ?? data
  },
}