import api from './api'

export const deportistaService = {
  // Ranking público para la landing (sin sesión), agrupado por disciplina.
  async getRankingPublico(params = {}) {
    const { data } = await api.get('/deportistas/publico/ranking', { params })
    return data.data
  },

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

  async getMiPerfil() {
    const { data } = await api.get('/deportistas/me/perfil')
    return data
  },

  async updateMiPerfil(payload) {
    const { data } = await api.put('/deportistas/me/perfil', payload)
    return data
  },

  async getMisLogros() {
    const { data } = await api.get('/deportistas/me/logros')
    return data
  },

  async cargarMiLogro(payload) {
    const { data } = await api.post('/deportistas/me/logros', payload)
    return data
  },

  async validarLogro(logroId, payload) {
    const { data } = await api.patch(`/deportistas/logros/${logroId}/validar`, payload)
    return data
  },

  // Estadísticas públicas de deportes con más medallistas (Punto 3)
  async getEstadisticasMedallas() {
    const { data } = await api.get('/deportistas/publico/estadisticas-medallas')
    return data.data
  },

  // Buscador público ciudadano de deportistas (Punto 4)
  async buscarPublico(params = {}) {
    const { data } = await api.get('/deportistas/publico/buscar', { params })
    return data
  },

  // Perfil público resumido con CV, logros y apoyos SEDEDE (Punto 4)
  async getPerfilPublico(id) {
    const { data } = await api.get(`/deportistas/publico/perfil/${id}`)
    return data.data
  },
}
