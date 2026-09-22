import api from './api'

export const calendarioAnualService = {
  async list(params = {}) {
    const { data } = await api.get('/calendario-anual/unificado', { params })
    return { items: data.data, meta: data.meta }
  },

  async get(id) {
    const { data } = await api.get(`/calendario-anual/${id}`)
    return data.data
  },

  async create(payload) {
    const { data } = await api.post('/calendario-anual', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/calendario-anual/${id}`, payload)
    return data.data
  },

  async delete(id) {
    const { data } = await api.delete(`/calendario-anual/${id}`)
    return data.data
  },
}
