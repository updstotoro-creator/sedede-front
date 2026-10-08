import api from './api'

export const seguimientoService = {
  async getResumen() {
    const { data } = await api.get('/core/seguimiento/resumen')
    return data.data
  },

  async getExpedienteMiembro(id) {
    const { data } = await api.get(`/core/seguimiento/miembros/${id}`)
    return data.data
  },

  async crearTarea(payload) {
    const { data } = await api.post('/core/seguimiento/tareas', payload)
    return data.data
  },

  async registrarProrroga(tareaId, payload) {
    const { data } = await api.post(`/core/seguimiento/tareas/${tareaId}/prorroga`, payload)
    return data.data
  },

  async evaluarTarea(tareaId, payload) {
    const { data } = await api.put(`/core/seguimiento/tareas/${tareaId}/evaluar`, payload)
    return data.data
  },
}
