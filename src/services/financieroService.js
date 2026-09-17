import api from './api'

/**
 * Consumo real del backend para el módulo Financiero.
 * Cubre los 3 catálogos ya conectados: organismos financiadores,
 * fuentes de financiamiento, y la matriz fuente-organismo.
 */
export const financieroService = {
  // --- Organismos financiadores ---
  async listOrganismos() {
    const { data } = await api.get('/financiero/organismos-financiadores')
    return data.data
  },
  async createOrganismo(payload) {
    const { data } = await api.post('/financiero/organismos-financiadores', payload)
    return data.data
  },
  async updateOrganismo(id, payload) {
    const { data } = await api.put(`/financiero/organismos-financiadores/${id}`, payload)
    return data.data
  },

  // --- Fuentes de financiamiento ---
  async listFuentes() {
    const { data } = await api.get('/financiero/fuentes-financiamiento')
    return data.data
  },
  async createFuente(payload) {
    const { data } = await api.post('/financiero/fuentes-financiamiento', payload)
    return data.data
  },
  async updateFuente(id, payload) {
    const { data } = await api.put(`/financiero/fuentes-financiamiento/${id}`, payload)
    return data.data
  },

  // --- Matriz fuente-organismo (combinaciones válidas) ---
  async listFuenteOrganismo() {
    const { data } = await api.get('/financiero/fuente-organismo')
    return data.data
  },
  async createFuenteOrganismo(payload) {
    const { data } = await api.post('/financiero/fuente-organismo', payload)
    return data.data
  },
  async updateFuenteOrganismo(id, payload) {
    const { data } = await api.put(`/financiero/fuente-organismo/${id}`, payload)
    return data.data
  },
}
