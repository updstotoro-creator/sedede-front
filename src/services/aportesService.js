import apiV1 from './apiV1';

export default {
  async listar(asociacionId, filters = {}) {
    const { data } = await apiV1.get(`/asociaciones/${asociacionId}/aportes`, { params: filters });
    return data.data;
  },

  async crear(asociacionId, payload) {
    const { data } = await apiV1.post(`/asociaciones/${asociacionId}/aportes`, payload);
    return data.data;
  },

  async reportarEjecucion(asociacionId, aporteId, payload) {
    const { data } = await apiV1.put(`/asociaciones/${asociacionId}/aportes/${aporteId}`, payload);
    return data.data;
  },

  async inactivar(asociacionId, aporteId) {
    const { data } = await apiV1.delete(`/asociaciones/${asociacionId}/aportes/${aporteId}`);
    return data.data;
  },

  async reactivar(asociacionId, aporteId) {
    const { data } = await apiV1.post(`/asociaciones/${asociacionId}/aportes/${aporteId}/reactivar`);
    return data.data;
  }
};