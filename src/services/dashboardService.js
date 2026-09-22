import api from './api'

export const dashboardService = {
  async getExecutiveMetrics(params = {}) {
    const { data } = await api.get('/core/dashboard/executive', { params })
    return data
  },
}
