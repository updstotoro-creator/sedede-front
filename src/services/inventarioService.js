import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sedede_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Consumo real del backend para Inventario (Tipos de Ítem y Almacenes).
 * Reemplaza al store de Pinia con datos en memoria — mismo patrón que
 * userService.js.
 */
export const inventarioService = {
  // --- Tipos de ítem ---
  async listTiposItem() {
    const { data } = await api.get('/inventario/tipos-item')
    return data.data
  },
  async createTipoItem(payload) {
    const { data } = await api.post('/inventario/tipos-item', payload)
    return data.data
  },
  async updateTipoItem(id, payload) {
    const { data } = await api.put(`/inventario/tipos-item/${id}`, payload)
    return data.data
  },

  // --- Almacenes ---
  async listAlmacenes() {
    const { data } = await api.get('/inventario/almacenes')
    return data.data
  },
  async createAlmacen(payload) {
    const { data } = await api.post('/inventario/almacenes', payload)
    return data.data
  },
  async updateAlmacen(id, payload) {
    const { data } = await api.put(`/inventario/almacenes/${id}`, payload)
    return data.data
  },
}
