import api from './api'

export const tramiteService = {
  async list(params = {}) {
    const { data } = await api.get('/tramites', { params })
    return { items: data.data, meta: data.meta }
  },

  async get(id) {
    const { data } = await api.get(`/tramites/${id}`)
    return data.data
  },

  async create(payload) {
    const { data } = await api.post('/tramites', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/tramites/${id}`, payload)
    return data.data
  },

  async evaluar(id, payload) {
    const { data } = await api.post(`/tramites/${id}/evaluar`, payload)
    return data.data
  },

  async delete(id) {
    const { data } = await api.delete(`/tramites/${id}`)
    return data.data
  },

  async reactivar(id) {
    const { data } = await api.post(`/tramites/${id}/reactivar`)
    return data.data
  },
}
