import api from './api'

/**
 * Servicio CRUD de roles contra Api\Core\RoleController.
 */
export const roleService = {
  async list() {
    const { data } = await api.get('/core/roles')
    return data.data
  },

  async create(payload) {
    const { data } = await api.post('/core/roles', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/core/roles/${id}`, payload)
    return data.data
  },

  async setActive(id, activo) {
    if (!activo) {
      const { data } = await api.delete(`/core/roles/${id}`)
      return data.data
    } else {
      const { data } = await api.post(`/core/roles/${id}/reactivar`)
      return data.data
    }
  },
}
