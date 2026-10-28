import api from './api'

export const asociacionService = {
  async list(params = {}) {
    const { data } = await api.get('/asociaciones', { params: { per_page: 100, ...params } })
    return Array.isArray(data.data) ? data.data : (data.data?.data || [])
  },

  async get(id) {
    const { data } = await api.get(`/asociaciones/${id}`)
    return data.data
  },

  async create(payload) {
    const { data } = await api.post('/asociaciones', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/asociaciones/${id}`, payload)
    return data.data
  },

  async delete(id) {
    const { data } = await api.delete(`/asociaciones/${id}`)
    return data.data
  },

  async reactivar(id) {
    const { data } = await api.post(`/asociaciones/${id}/reactivar`)
    return data.data
  },

  // Clubes
  async listClubes(asociacionId) {
    const { data } = await api.get(`/asociaciones/${asociacionId}/clubes`, { params: { per_page: 100 } })
    return Array.isArray(data.data) ? data.data : (data.data?.data || [])
  },

  async createClub(asociacionId, payload) {
    const { data } = await api.post(`/asociaciones/${asociacionId}/clubes`, payload)
    return data.data
  },

  async updateClub(asociacionId, clubId, payload) {
    const { data } = await api.put(`/asociaciones/${asociacionId}/clubes/${clubId}`, payload)
    return data.data
  },

  async deleteClub(asociacionId, clubId) {
    const { data } = await api.delete(`/asociaciones/${asociacionId}/clubes/${clubId}`)
    return data.data
  },

  // Deportistas de la Asociación (Validación en 2 fases y seleccionado)
  async getDeportistas(asociacionId, params = {}) {
    const { data } = await api.get(`/asociaciones/${asociacionId}/deportistas`, { params })
    return data
  },

  async aceptarDeportista(asociacionId, deportistaId, payload = {}) {
    const { data } = await api.post(`/asociaciones/${asociacionId}/deportistas/${deportistaId}/aceptar`, payload)
    return data
  },

  async rechazarDeportista(asociacionId, deportistaId, payload) {
    const { data } = await api.post(`/asociaciones/${asociacionId}/deportistas/${deportistaId}/rechazar`, payload)
    return data
  },

  // Trámites de deportistas de la asociación
  async getTramites(asociacionId, params = {}) {
    const { data } = await api.get(`/asociaciones/${asociacionId}/tramites`, { params })
    return data
  },
}
