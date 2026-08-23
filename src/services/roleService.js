import api from './api'

/**
 * Solo lectura de roles — se usa para llenar el <select> de rol
 * al crear/editar un usuario. El CRUD completo de roles es otra vista.
 */
export const roleService = {
  async list() {
    const { data } = await api.get('/roles')
    return data.data
  },
}
