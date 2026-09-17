import api from './api'

export const asociacionService = {
  async list() {
    const { data } = await api.get('/asociaciones')
    return data.data
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
    const { data } = await api.get(`/asociaciones/${asociacionId}/clubes`)
    return data.data
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
}
