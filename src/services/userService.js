import api from './api'

/**
 * CRUD de usuarios contra Api\Core\UserController.
 * Campos: name, email, password (+password_confirmation al crear), role_id, activo.
 */
export const userService = {
  async list(page = 1) {
    const { data } = await api.get('/users', { params: { page } })
    return { items: data.data, meta: data.meta }
  },

  async create(payload) {
    const { data } = await api.post('/users', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.put(`/users/${id}`, payload)
    return data.data
  },

  // "Desactivar" no borra al usuario: solo cambia el campo activo,
  // reutilizando el mismo endpoint de edición.
  async setActive(id, activo) {
    const { data } = await api.put(`/users/${id}`, { activo })
    return data.data
  },
}
