import api from './api'

export const poaService = {
  async getDashboard() {
    const { data } = await api.get('/poa/dashboard')
    return data
  },

  // ── Árbol jerárquico ─────────────────────────────────────
  async getArbol(params) {
    const { data } = await api.get('/poa/arbol', { params })
    return data
  },

  // ── Programas ──────────────────────────────────────────────
  async listProgramas(params) {
    const { data } = await api.get('/poa/programas', { params })
    return data
  },

  async createPrograma(payload) {
    const { data } = await api.post('/poa/programas', payload)
    return data
  },

  async updatePrograma(id, payload) {
    const { data } = await api.put(`/poa/programas/${id}`, payload)
    return data
  },

  async deletePrograma(id) {
    const { data } = await api.delete(`/poa/programas/${id}`)
    return data
  },

  // ── Proyectos ──────────────────────────────────────────────
  async listProyectos(params) {
    const { data } = await api.get('/poa/proyectos', { params })
    return data
  },

  async createProyecto(payload) {
    const { data } = await api.post('/poa/proyectos', payload)
    return data
  },

  async updateProyecto(id, payload) {
    const { data } = await api.put(`/poa/proyectos/${id}`, payload)
    return data
  },

  async deleteProyecto(id) {
    const { data } = await api.delete(`/poa/proyectos/${id}`)
    return data
  },

  // ── Planes ─────────────────────────────────────────────────
  async listPlanes(params) {
    const { data } = await api.get('/poa/planes', { params })
    return data
  },

  async createPlan(payload) {
    const { data } = await api.post('/poa/planes', payload)
    return data
  },

  async updatePlan(id, payload) {
    const { data } = await api.put(`/poa/planes/${id}`, payload)
    return data
  },

  async aprobarPlan(id) {
    const { data } = await api.post(`/poa/planes/${id}/aprobar`)
    return data
  },

  // ── Actividades ────────────────────────────────────────────
  async listActividades(params) {
    const { data } = await api.get('/poa/actividades', { params })
    return data
  },

  async getActividad(id) {
    const { data } = await api.get(`/poa/actividades/${id}`)
    return data
  },

  async createActividad(payload) {
    const { data } = await api.post('/poa/actividades', payload)
    return data
  },

  async updateActividad(id, payload) {
    const { data } = await api.put(`/poa/actividades/${id}`, payload)
    return data
  },

  async deleteActividad(id) {
    const { data } = await api.delete(`/poa/actividades/${id}`)
    return data
  },

  // ── Indicadores ────────────────────────────────────────────
  async listIndicadores(params) {
    const { data } = await api.get('/poa/indicadores', { params })
    return data
  },

  async createIndicador(payload) {
    const { data } = await api.post('/poa/indicadores', payload)
    return data
  },

  async updateIndicador(id, payload) {
    const { data } = await api.put(`/poa/indicadores/${id}`, payload)
    return data
  },

  async deleteIndicador(id) {
    const { data } = await api.delete(`/poa/indicadores/${id}`)
    return data
  },

  // ── Metas ──────────────────────────────────────────────────
  async listMetas(params) {
    const { data } = await api.get('/poa/metas', { params })
    return data
  },

  async createMeta(payload) {
    const { data } = await api.post('/poa/metas', payload)
    return data
  },

  async updateMeta(id, payload) {
    const { data } = await api.put(`/poa/metas/${id}`, payload)
    return data
  },

  // ── Techos presupuestarios ─────────────────────────────────
  async listTechos(params) {
    const { data } = await api.get('/poa/techos', { params })
    return data
  },

  async createTecho(payload) {
    const { data } = await api.post('/poa/techos', payload)
    return data
  },

  async updateTecho(id, payload) {
    const { data } = await api.put(`/poa/techos/${id}`, payload)
    return data
  },

  // ── Transiciones (bitácora) ────────────────────────────────
  async listTransiciones(params) {
    const { data } = await api.get('/poa/transiciones', { params })
    return data
  },

  async createTransicion(payload) {
    const { data } = await api.post('/poa/transiciones', payload)
    return data
  },
}
