import api from './api';
import { asociacionService } from './asociacionService';

export default {
  async listar(asociacionId, filters = {}) {
    const { data } = await api.get(`/asociaciones/${asociacionId}/clubes`, { params: { per_page: 100, ...filters } });
    return Array.isArray(data.data) ? data.data : (data.data?.data || []);
  },

  // El backend sólo expone clubes anidados bajo una asociación, así que se
  // consolidan en paralelo todas las asociaciones para tener el listado global.
  async listarTodas() {
    const asociaciones = await asociacionService.list();
    const clubes = await Promise.all(
      asociaciones.map(async (asociacion) => {
        try {
          const lista = await this.listar(asociacion.id);
          return lista.map((club) => ({
            ...club,
            asociacion,
          }));
        } catch {
          return [];
        }
      })
    );
    return clubes.flat();
  },

  async crear(asociacionId, payload) {
    const { data } = await api.post(`/asociaciones/${asociacionId}/clubes`, payload);
    return data.data;
  },

  async actualizar(asociacionId, clubId, payload) {
    const { data } = await api.put(`/asociaciones/${asociacionId}/clubes/${clubId}`, payload);
    return data.data;
  },

  async inactivar(asociacionId, clubId) {
    const { data } = await api.delete(`/asociaciones/${asociacionId}/clubes/${clubId}`);
    return data.data;
  },

  async reactivar(asociacionId, clubId) {
    const { data } = await api.post(`/asociaciones/${asociacionId}/clubes/${clubId}/reactivar`);
    return data.data;
  },
};
