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

  async expediente(id) {
    const { data } = await api.get(`/tramites/${id}/expediente`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/tramites', payload)
    return data.data
  },

  async derivar(id, payload) {
    const { data } = await api.post(`/tramites/${id}/derivar`, payload)
    return data
  },

  async validarRequisito(id, payload) {
    const { data } = await api.post(`/tramites/${id}/validar-requisito`, payload)
    return data
  },

  async subirDocumento(id, requisitoId, file) {
    const formData = new FormData()
    formData.append('requisito_id', requisitoId)
    formData.append('archivo', file)

    const { data } = await api.post(`/tramites/${id}/subir-documento`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async subsanar(id, payload) {
    const { data } = await api.post(`/tramites/${id}/subsanar`, payload)
    return data
  },

  async evaluar(id, payload) {
    const { data } = await api.put(`/tramites/${id}/evaluar`, payload)
    return data.data
  },

  async delete(id) {
    const { data } = await api.delete(`/tramites/${id}`)
    return data.data
  },
}
