import api from './api'

export const deportistaService = {
  async list(params = {}) {
    const { data } = await api.get('/deportistas', { params })
    return { items: data.data, meta: data.meta }
  },

  async get(id) {
    const { data } = await api.get(`/deportistas/${id}`)
    return data.data
  },

  async create(payload) {
    const { data } = await api.post('/deportistas', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/deportistas/${id}`, payload)
    return data.data
  },

  async delete(id) {
    const { data } = await api.delete(`/deportistas/${id}`)
    return data.data
  },

  async reactivar(id) {
    const { data } = await api.post(`/deportistas/${id}/reactivar`)
    return data.data
  },
}
