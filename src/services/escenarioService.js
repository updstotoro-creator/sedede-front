import api from './api'

export const escenarioService = {
  async list() {
    const { data } = await api.get('/escenarios')
    return data.data
  },

  async listEscenarios() {
    return this.list()
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

  async getDisponibilidad(params = {}) {
    const response = await api.get('/escenarios/disponibilidad', { params })
    return response.data
  },

  async actualizarEstadoReserva(id, payload) {
    const response = await api.patch(`/escenarios/reservas/${id}/estado`, payload)
    return response.data
  },

  async cotizarReserva(params = {}) {
    const response = await api.get('/escenarios/reservas/cotizar', { params })
    return response.data
  },

  // Flujo Público para Particulares (Landing Page sin sesión)
  async getEscenariosPublicos() {
    const response = await api.get('/escenarios/publico/escenarios')
    return response.data?.data || []
  },

  async getDisponibilidadPublica(params = {}) {
    const response = await api.get('/escenarios/publico/disponibilidad', { params })
    return response.data
  },

  async cotizarPublico(params = {}) {
    const response = await api.get('/escenarios/publico/cotizar', { params })
    return response.data
  },

  async solicitarReservaPublica(payload) {
    const response = await api.post('/escenarios/publico/reservas', payload)
    return response.data
  },

  async consultarEstadoPublico(codigo) {
    const response = await api.get(`/escenarios/publico/reservas/${encodeURIComponent(codigo)}`)
    return response.data
  },

  // Quien perdió el comprobante: se identifica con C.I. y celular (los dos).
  async consultarReservasPorSolicitante({ ci, telefono }) {
    const response = await api.get('/escenarios/publico/reservas', { params: { ci, telefono } })
    return response.data
  },
}
