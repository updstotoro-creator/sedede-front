import api from './api'

export const escenarioService = {
  async list() {
    const { data } = await api.get('/escenarios')
    return data.data
  },

  async get(id) {
    const { data } = await api.get(`/escenarios/${id}`)
    return data.data
  },

  async create(payload) {
    const { data } = await api.post('/escenarios', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/escenarios/${id}`, payload)
    return data.data
  },

  async delete(id) {
    const { data } = await api.delete(`/escenarios/${id}`)
    return data.data
  },

  async reactivar(id) {
    const { data } = await api.post(`/escenarios/${id}/reactivar`)
    return data.data
  },

  async listProgramaciones(escenarioId) {
    const { data } = await api.get(`/escenarios/${escenarioId}/programaciones`)
    return data.data
  },

  async createProgramacion(escenarioId, payload) {
    const { data } = await api.post(`/escenarios/${escenarioId}/programaciones`, payload)
    return data.data
  },
}
