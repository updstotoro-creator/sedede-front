import api from './api'

// Las colecciones del backend vienen paginadas como { data: [...], meta }.
const lista = (data) => (Array.isArray(data.data) ? data.data : (data.data?.data || []))

// Mensaje legible de un error de la API: une los errores de validación (422)
// o devuelve el `message` del backend.
export function mensajeError(error, porDefecto = 'Ocurrió un error inesperado') {
  const errors = error.response?.data?.errors
  if (errors) return Object.values(errors).flat().join(' ')
  return error.response?.data?.message || porDefecto
}

export const poaService = {
  async getDashboard(params = {}) {
    const { data } = await api.get('/poa/dashboard', { params })
    return data.data
  },

  // Catálogo provisional de unidades organizacionales.
  async listUnidades() {
    const { data } = await api.get('/poa/unidades')
    return data.data
  },

  // ── Árbol programa → proyecto → actividad → indicador ─────
  async getArbol(params = {}) {
    const { data } = await api.get('/poa/arbol', { params })
    return data.data
  },

  // ── Programas ──────────────────────────────────────────────
  async listProgramas(params = {}) {
    const { data } = await api.get('/poa/programas', { params: { per_page: 100, ...params } })
    return lista(data)
  },

  async createPrograma(payload) {
    const { data } = await api.post('/poa/programas', payload)
    return data.data
  },

  async updatePrograma(id, payload) {
    const { data } = await api.put(`/poa/programas/${id}`, payload)
    return data.data
  },

  async deletePrograma(id) {
    await api.delete(`/poa/programas/${id}`)
  },

  // ── Proyectos ──────────────────────────────────────────────
  async listProyectos(params = {}) {
    const { data } = await api.get('/poa/proyectos', { params: { per_page: 100, ...params } })
    return lista(data)
  },

  async createProyecto(payload) {
    const { data } = await api.post('/poa/proyectos', payload)
    return data.data
  },

  async updateProyecto(id, payload) {
    const { data } = await api.put(`/poa/proyectos/${id}`, payload)
    return data.data
  },

  async deleteProyecto(id) {
    await api.delete(`/poa/proyectos/${id}`)
  },

  // ── Planes ─────────────────────────────────────────────────
  async listPlanes(params = {}) {
    const { data } = await api.get('/poa/planes', { params: { per_page: 100, ...params } })
    return lista(data)
  },

  async createPlan(payload) {
    const { data } = await api.post('/poa/planes', payload)
    return data.data
  },

  async updatePlan(id, payload) {
    const { data } = await api.put(`/poa/planes/${id}`, payload)
    return data.data
  },

  async aprobarPlan(id, payload) {
    const { data } = await api.post(`/poa/planes/${id}/aprobar`, payload)
    return data.data
  },

  // Cumplimiento físico por programa, actividad e indicador.
  async getCumplimiento(planId) {
    const { data } = await api.get(`/poa/planes/${planId}/cumplimiento`)
    return data.data
  },

  // ── Actividades ────────────────────────────────────────────
  async listActividades(params = {}) {
    const { data } = await api.get('/poa/actividades', { params: { per_page: 100, ...params } })
    return lista(data)
  },

  async getActividad(id) {
    const { data } = await api.get(`/poa/actividades/${id}`)
    return data.data
  },

  async createActividad(payload) {
    const { data } = await api.post('/poa/actividades', payload)
    return data.data
  },

  async updateActividad(id, payload) {
    const { data } = await api.put(`/poa/actividades/${id}`, payload)
    return data.data
  },

  async deleteActividad(id) {
    await api.delete(`/poa/actividades/${id}`)
  },

  // ── Indicadores ────────────────────────────────────────────
  async createIndicador(payload) {
    const { data } = await api.post('/poa/indicadores', payload)
    return data.data
  },

  async updateIndicador(id, payload) {
    const { data } = await api.put(`/poa/indicadores/${id}`, payload)
    return data.data
  },

  async deleteIndicador(id) {
    await api.delete(`/poa/indicadores/${id}`)
  },

  // ── Metas (versionadas) ────────────────────────────────────
  // Crear con el plan en borrador registra la v1; con el plan aprobado
  // registra la versión siguiente y exige `motivo`.
  async createMeta(payload) {
    const { data } = await api.post('/poa/metas', payload)
    return data.data
  },

  // Solo mientras el plan está en borrador.
  async updateMeta(id, payload) {
    const { data } = await api.put(`/poa/metas/${id}`, payload)
    return data.data
  },

  // periodos: [{ numero_periodo, meta_periodo }]; la suma debe igualar la meta anual.
  async guardarProgramacion(metaId, periodos) {
    const { data } = await api.put(`/poa/metas/${metaId}/programacion`, { periodos })
    return data.data
  },

  // ── Techos presupuestarios (versionados) ───────────────────
  async listTechos(params = {}) {
    const { data } = await api.get('/poa/techos', { params: { per_page: 100, ...params } })
    return lista(data)
  },

  async createTecho(payload) {
    const { data } = await api.post('/poa/techos', payload)
    return data.data
  },

  // ── Avance físico con medio de verificación ────────────────
  async listAvances(params = {}) {
    const { data } = await api.get('/poa/avances', { params: { per_page: 100, ...params } })
    return lista(data)
  },

  // { indicador_id, numero_periodo, valor_ejecutado, observacion, motivo, archivos: File[] }
  async registrarAvance({ archivos = [], ...campos }) {
    const form = new FormData()
    Object.entries(campos).forEach(([clave, valor]) => {
      if (valor !== null && valor !== undefined && valor !== '') form.append(clave, valor)
    })
    archivos.forEach((archivo) => form.append('archivos[]', archivo))
    const { data } = await api.post('/poa/avances', form)
    return data.data
  },

  // Descarga autenticada: el respaldo no tiene URL pública.
  async descargarVerificacion(avanceId, verificacion) {
    const { data } = await api.get(`/poa/avances/${avanceId}/verificaciones/${verificacion.id}/descargar`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(data)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = verificacion.nombre_archivo
    enlace.click()
    URL.revokeObjectURL(url)
  },

  async verificarIntegridad(avanceId, verificacionId) {
    const { data } = await api.get(`/poa/avances/${avanceId}/verificaciones/${verificacionId}/integridad`)
    return data.data
  },

  // ── Bitácora de metas (solo lectura) ───────────────────────
  async listTransiciones(params = {}) {
    const { data } = await api.get('/poa/transiciones', { params: { per_page: 100, ...params } })
    return lista(data)
  },
}
