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

    /**
     * Recupera al usuario a partir del token guardado. Sin esto, recargar la
     * página (F5) dejaba el token en localStorage pero el estado en memoria
     * vacío, y la guarda del router mandaba al login aunque la sesión seguía
     * vigente. Se llama una sola vez por carga (la promesa se reutiliza).
     */
    restaurarSesion() {
      if (this.user) return Promise.resolve(true)
      if (!localStorage.getItem('sedede_token')) return Promise.resolve(false)

      if (!this._restauracion) {
        this._restauracion = authService
          .me()
          .then((user) => {
            this.user = user
            this.status = 'success'
            return true
          })
          .catch(() => {
            // Token vencido o revocado: se descarta y queda como sin sesión.
            localStorage.removeItem('sedede_token')
            return false
          })
          .finally(() => {
            this._restauracion = null
          })
      }
      return this._restauracion
    },

    async logout() {
      // La sesión local se limpia aunque el backend falle (token ya
      // revocado, red caída): si no, el usuario quedaba a medias y hacía
      // falta un segundo "Cerrar sesión".
      try {
        await authService.logout()
      } catch {
        // El token local ya se borró en authService; no hay nada más que hacer.
      } finally {
        this.user = null
        this.status = 'idle'
        this.errorMessage = ''
      }
    },

    /**
     * ¿Tiene el usuario este permiso? Sólo sirve para no pedir en pantalla
     * datos que el servidor va a negar con 403. El servidor sigue decidiendo.
     */
    can(permiso) {
      const permisos = this.user?.role?.permisos
      return Array.isArray(permisos) && permisos.includes(permiso)
    },

    async actualizarAlertas(habilitadas) {
      const user = await authService.actualizarPreferenciaAlertas(habilitadas)
      this.user = { ...this.user, ...user }
      return this.user
    },

    mapError(error) {
      const status = error.response?.status
      const backendMessage = error.response?.data?.error

      if (status === 401) {
        return backendMessage || 'Credenciales inválidas. Verifica tu correo y contraseña.'
      }
      if (status === 422) {
        return 'Revisa los datos ingresados.'
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
