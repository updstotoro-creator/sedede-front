import { defineStore } from 'pinia'
import { authService } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    status: 'idle', // idle | loading | success | error
    errorMessage: '',
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isLoading: (state) => state.status === 'loading',
  },

  actions: {
    async login(credentials) {
      this.status = 'loading'
      this.errorMessage = ''
      try {
        this.user = await authService.login(credentials)
        this.status = 'success'
        return true
      } catch (error) {
        this.status = 'error'
        this.errorMessage = this.mapError(error)
        return false
      }
    },

    async logout() {
      await authService.logout()
      this.user = null
      this.status = 'idle'
    },

    mapError(error) {
      const status = error.response?.status
      if (status === 422) {
        return 'Credenciales inválidas. Verifica tu correo y contraseña.'
      }
      if (status === 429) {
        return 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'
      }
      if (!error.response) {
        return 'No se pudo conectar con el servidor. Verifica tu conexión.'
      }
      return 'Ocurrió un error inesperado. Intenta nuevamente.'
    },
  },
})
