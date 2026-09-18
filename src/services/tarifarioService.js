import api from './api'

export const tarifarioService = {
  async getTarifas(params = {}) {
    const response = await api.get('/tarifario/tarifas', { params })
    return response.data
  },

  async calcularTarifa(data) {
    const response = await api.post('/tarifario/calcular', data)
    return response.data
  },

  async getLiquidaciones(params = {}) {
    const response = await api.get('/tarifario/liquidaciones', { params })
    return response.data
  },

  async crearLiquidacion(data) {
    const response = await api.post('/tarifario/liquidaciones', data)
    return response.data
  },

  async pagarRecibo(id, data) {
    const response = await api.post(`/tarifario/liquidaciones/${id}/recibo`, data)
    return response.data
  },

  async aplicarExencion(id, data) {
    const response = await api.post(`/tarifario/liquidaciones/${id}/exencion`, data)
    return response.data
  },

  async getResumen() {
    const response = await api.get('/tarifario/resumen')
    return response.data
  },
}
