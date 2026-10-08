import apiV1 from './apiV1';

export default {
  async listar(asociacionId, filters = {}) {
    const { data } = await apiV1.get(`/asociaciones/${asociacionId}/clubes`, { params: filters });
    return data.data;
  },

  async crear(asociacionId, payload) {
    const { data } = await apiV1.post(`/asociaciones/${asociacionId}/clubes`, payload);
    return data.data;
  },

  async actualizar(asociacionId, clubId, payload) {
    const { data } = await apiV1.put(`/asociaciones/${asociacionId}/clubes/${clubId}`, payload);
    return data.data;
  },

  async inactivar(asociacionId, clubId) {
    const { data } = await apiV1.delete(`/asociaciones/${asociacionId}/clubes/${clubId}`);
    return data.data;
  },

  async reactivar(asociacionId, clubId) {
    const { data } = await apiV1.post(`/asociaciones/${asociacionId}/clubes/${clubId}/reactivar`);
    return data.data;
  }
};