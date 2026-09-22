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

  // Bloque 1: Visibilidad de Ocupación, Disciplinas y Reservas con Tarifario
  async getOcupacion(params = {}) {
    const response = await api.get('/escenarios/ocupacion', { params })
    return response.data
  },

  async getReservas(params = {}) {
    const response = await api.get('/escenarios/reservas', { params })
    return response.data
  },

  async crearReserva(payload) {
    const response = await api.post('/escenarios/reservas', payload)
    return response.data
  },

  async actualizarEstadoReserva(id, payload) {
    const response = await api.patch(`/escenarios/reservas/${id}/estado`, payload)
    return response.data
  },
}
