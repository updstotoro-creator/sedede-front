import api from './api';
import { asociacionService } from './asociacionService';

export default {
  async listar(asociacionId, filters = {}) {
    const { data } = await api.get(`/asociaciones/${asociacionId}/clubes`, { params: { per_page: 100, ...filters } });
    return Array.isArray(data.data) ? data.data : (data.data?.data || []);
  },

  // El backend sólo expone clubes anidados bajo una asociación, así que se
  // consolidan en paralelo todas las asociaciones para tener el listado global.
  async listarTodas(filtroAsociacionId = null) {
    if (filtroAsociacionId) {
      try {
        const asoc = await asociacionService.get(filtroAsociacionId);
        const lista = await this.listar(filtroAsociacionId);
        return lista.map((club) => ({
          ...club,
          asociacion: asoc,
          asociacion_id: Number(filtroAsociacionId),
        }));
      } catch {
        return [];
      }
    }

    const asociaciones = await asociacionService.list();
    const clubes = await Promise.all(
      asociaciones.map(async (asociacion) => {
        try {
          const lista = await this.listar(asociacion.id);
          return lista.map((club) => ({
            ...club,
            asociacion,
            asociacion_id: Number(club.asociacion_id || asociacion.id),
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

  // Portal específico de Club: Mi Club
  async getMiClub(params = {}) {
    const { data } = await api.get('/clubes/mi-club', { params });
    return data;
  },

  async getClubPortal(clubId) {
    const { data } = await api.get(`/clubes/${clubId}/portal`);
    return data;
  },

  // Carga y actualización de documentación y personería jurídica del club
  async actualizarDocumentacion(clubId, payload) {
    const url = clubId ? `/clubes/${clubId}/documentacion` : '/clubes/mi-club/documentacion';
    const { data } = await api.put(url, payload);
    return data;
  },

  // Gestión y aprobación de deportistas por parte del club
  async getDeportistasClub(clubId, params = {}) {
    const url = clubId ? `/clubes/${clubId}/deportistas` : '/clubes/mi-club/deportistas';
    const { data } = await api.get(url, { params });
    return data;
  },

  async aceptarDeportista(clubId, deportistaId, payload = {}) {
    const { data } = await api.post(`/clubes/${clubId}/deportistas/${deportistaId}/aceptar`, payload);
    return data;
  },

  async rechazarDeportista(clubId, deportistaId, payload = {}) {
    const { data } = await api.post(`/clubes/${clubId}/deportistas/${deportistaId}/rechazar`, payload);
    return data;
  },

  async afiliarDeportista(clubId, payload) {
    const { data } = await api.post(`/clubes/${clubId}/deportistas`, payload);
    return data;
  },
};
