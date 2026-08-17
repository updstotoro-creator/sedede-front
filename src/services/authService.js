import api, { sanctum } from './api'

/**
 * Servicio de autenticación.
 *
 * Soporta el flujo recomendado por Laravel Sanctum para SPA:
 *  1. GET /sanctum/csrf-cookie   -> obtiene la cookie XSRF-TOKEN
 *  2. POST /login                -> autentica y crea la sesión (cookie)
 *
 * Si el backend expone en su lugar un endpoint de token (JWT clásico),
 * basta con comentar el paso de csrf-cookie y guardar el token recibido;
 * el interceptor de api.js ya está preparado para adjuntarlo como Bearer.
 */
export const authService = {
  async login({ email, password }) {
    await sanctum.get('/sanctum/csrf-cookie')
    const { data } = await api.post('/login', { email, password })

    // Si el backend responde con un token (JWT / Sanctum token ability),
    // se persiste para las peticiones siguientes.
    if (data?.token) {
      localStorage.setItem('sedede_token', data.token)
    }

    return data.user ?? data
  },

  async logout() {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('sedede_token')
    }
  },

  async me() {
    const { data } = await api.get('/user')
    return data
  },
}
