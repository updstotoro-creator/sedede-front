import api from './api'

export const tarifarioService = {
  async getTarifas(params = {}) {
    const response = await api.get('/v1/tarifario/tarifas', { params })
    return response.data
  },

  async calcularTarifa(data) {
    const response = await api.post('/v1/tarifario/calcular', data)
    return response.data
  },

  async getLiquidaciones(params = {}) {
    const response = await api.get('/v1/tarifario/liquidaciones', { params })
    return response.data
  },

  async crearLiquidacion(data) {
    const response = await api.post('/v1/tarifario/liquidaciones', data)
    return response.data
  },

  async pagarRecibo(id, data) {
    const response = await api.post(`/v1/tarifario/liquidaciones/${id}/recibo`, data)
    return response.data
  },

  async aplicarExencion(id, data) {
    const response = await api.post(`/v1/tarifario/liquidaciones/${id}/exencion`, data)
    return response.data
  },

  async getResumen() {
    const response = await api.get('/v1/tarifario/resumen')
    return response.data
  },
}
