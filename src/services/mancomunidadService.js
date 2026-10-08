import api from './api'

export const mancomunidadService = {
  // --- MANCOMUNIDADES ---
  async listMancomunidades(params = {}) {
    const { data } = await api.get('/mancomunidades', { params })
    return data
  },

  async getMancomunidad(id) {
    const { data } = await api.get(`/mancomunidades/${id}`)
    return data.data
  },

  async createMancomunidad(payload) {
    const { data } = await api.post('/mancomunidades', payload)
    return data
  },

  async listUsuariosDisponibles() {
    const { data } = await api.get('/mancomunidades-usuarios')
    return data.data
  },

  async updateMancomunidad(id, payload) {
    const { data } = await api.patch(`/mancomunidades/${id}`, payload)
    return data.data
  },

  async deleteMancomunidad(id) {
    const { data } = await api.delete(`/mancomunidades/${id}`)
    return data
  },

  async reactivarMancomunidad(id) {
    const { data } = await api.post(`/mancomunidades/${id}/reactivar`)
    return data
  },

  async suspenderMancomunidad(id) {
    const { data } = await api.post(`/mancomunidades/${id}/suspender`)
    return data
  },

  async cancelarMancomunidad(id, payload) {
    const { data } = await api.post(`/mancomunidades/${id}/cancelar`, payload)
    return data
  },

  async verificarExpediente(id) {
    const { data } = await api.post(`/mancomunidades/${id}/verificar`)
    return data
  },

  async getRequisitos(id) {
    const { data } = await api.get(`/mancomunidades/${id}/requisitos`)
    return data.data
  },

  async getAuditoria(id) {
    const { data } = await api.get(`/mancomunidades/${id}/auditoria`)
    return data.data
  },

  // --- USUARIOS DE ACCESO COMUNITARIO ---
  async getUsuariosMancomunidad(mancomunidadId) {
    const { data } = await api.get(`/mancomunidades/${mancomunidadId}/usuarios`)
    return data.data
  },

  async crearUsuarioMancomunidad(mancomunidadId, payload) {
    const { data } = await api.post(`/mancomunidades/${mancomunidadId}/usuarios`, payload)
    return data
  },

  // --- MIEMBROS ---
  async getMiembros(mancomunidadId) {
    const { data } = await api.get(`/mancomunidades/${mancomunidadId}/miembros`)
    return data.data
  },

  async addMiembro(mancomunidadId, payload) {
    const { data } = await api.post(`/mancomunidades/${mancomunidadId}/miembros`, payload)
    return data.data
  },

  async deleteMiembro(mancomunidadId, miembroId) {
    const { data } = await api.delete(`/mancomunidades/${mancomunidadId}/miembros/${miembroId}`)
    return data
  },

  // --- DOCUMENTOS / EXPEDIENTE ---
  async getDocumentos(mancomunidadId) {
    const { data } = await api.get(`/mancomunidades/${mancomunidadId}/documentos`)
    return data.data
  },

  async uploadDocumento(mancomunidadId, formData) {
    const { data } = await api.post(`/mancomunidades/${mancomunidadId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  async aprobarDocumento(mancomunidadId, documentoId) {
    const { data } = await api.post(`/mancomunidades/${mancomunidadId}/documentos/${documentoId}/aprobar`)
    return data
  },

  async rechazarDocumento(mancomunidadId, documentoId, observaciones) {
    const { data } = await api.post(`/mancomunidades/${mancomunidadId}/documentos/${documentoId}/rechazar`, {
      observaciones,
    })
    return data
  },

  async deleteDocumento(mancomunidadId, documentoId) {
    const { data } = await api.delete(`/mancomunidades/${mancomunidadId}/documentos/${documentoId}`)
    return data
  },

  // --- MUNICIPIOS ---
  async listMunicipios() {
    const { data } = await api.get('/municipios')
    return data.data
  },

  async createMunicipio(payload) {
    const { data } = await api.post('/municipios', payload)
    return data.data
  },

  // --- RECURSOS ---
  async listRecursos(params = {}) {
    const { data } = await api.get('/recursos', { params })
    return data
  },

  async createRecurso(payload) {
    const { data } = await api.post('/recursos', payload)
    return data.data
  },

  async updateRecurso(id, payload) {
    const { data } = await api.patch(`/recursos/${id}`, payload)
    return data.data
  },

  async deleteRecurso(id) {
    const { data } = await api.delete(`/recursos/${id}`)
    return data
  },

  async reactivarRecurso(id) {
    const { data } = await api.post(`/recursos/${id}/reactivar`)
    return data
  },

  // --- SOLICITUDES ---
  async listSolicitudes(params = {}) {
    const { data } = await api.get('/solicitudes', { params })
    return data
  },

  async getSolicitud(id) {
    const { data } = await api.get(`/solicitudes/${id}`)
    return data.data
  },

  async createSolicitud(payload) {
    const { data } = await api.post('/solicitudes', payload)
    return data.data
  },

  async updateSolicitud(id, payload) {
    const { data } = await api.patch(`/solicitudes/${id}`, payload)
    return data.data
  },

  async deleteSolicitud(id) {
    const { data } = await api.delete(`/solicitudes/${id}`)
    return data
  },

  async enviarSolicitud(id) {
    const { data } = await api.post(`/solicitudes/${id}/enviar`)
    return data
  },

  async revisarSolicitud(id) {
    const { data } = await api.post(`/solicitudes/${id}/revision`)
    return data
  },

  async resolverSolicitud(id, decision, motivo = null) {
    const dec = decision === 'aprobar' ? 'aprobada' : (decision === 'rechazar' ? 'rechazada' : decision)
    const payload = { decision: dec }
    if (motivo) payload.motivo = motivo
    const { data } = await api.post(`/solicitudes/${id}/resolver`, payload)
    return data
  },

  async asignarSolicitud(id) {
    const { data } = await api.post(`/solicitudes/${id}/asignar`)
    return data
  },

  async completarSolicitud(id) {
    const { data } = await api.post(`/solicitudes/${id}/completar`)
    return data
  },

  async anularSolicitud(id, motivo) {
    const { data } = await api.post(`/solicitudes/${id}/anular`, {
      motivo,
    })
    return data
  },

  async getTransiciones(id) {
    const { data } = await api.get(`/solicitudes/${id}/transiciones`)
    return data.data
  },
}
