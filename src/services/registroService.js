import api from './api'

export const registroService = {
  async getCatalogos() {
    const { data } = await api.get('/registro/catalogos')
    return data
  },

  async registrarComunidad(formData) {
    const { data } = await api.post('/registro/comunidad', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async registrarDeportista(payload) {
    const { data } = await api.post('/registro/deportista', payload)
    return data
  },

  async registrarAsociacion(payload) {
    const { data } = await api.post('/registro/asociacion', payload)
    return data
  },

  async registrarClub(payload) {
    const { data } = await api.post('/registro/club', payload)
    return data
  },
}
