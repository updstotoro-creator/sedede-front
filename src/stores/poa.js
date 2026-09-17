import { defineStore } from 'pinia'
import { poaService } from '@/services/poaService'

export const usePoaStore = defineStore('poa', {
  state: () => ({
    dashboard: null,
    arbol: [],
    programas: [],
    proyectos: [],
    planes: [],
    actividades: [],
    indicadores: [],
    metas: [],
    techos: [],
    transiciones: [],
    loading: false,
    error: null,
  }),

  actions: {
    setLoading(val) {
      this.loading = val
    },

    setError(msg) {
      this.error = msg
    },

    // ── Dashboard ────────────────────────────────────────────
    async fetchDashboard() {
      this.setLoading(true)
      this.setError(null)
      try {
        this.dashboard = await poaService.getDashboard()
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar dashboard')
      } finally {
        this.setLoading(false)
      }
    },

    // ── Árbol jerárquico ─────────────────────────────────────
    async fetchArbol(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.getArbol(params)
        this.arbol = res.data
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar árbol')
      } finally {
        this.setLoading(false)
      }
    },

    // ── Programas ────────────────────────────────────────────
    async fetchProgramas(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listProgramas(params)
        this.programas = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar programas')
      } finally {
        this.setLoading(false)
      }
    },

    async createPrograma(payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.createPrograma(payload)
        this.programas.push(res.data)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al crear programa')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async updatePrograma(id, payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.updatePrograma(id, payload)
        const idx = this.programas.findIndex((p) => p.id === id)
        if (idx !== -1) this.programas[idx] = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al actualizar programa')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async deletePrograma(id) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.deletePrograma(id)
        this.programas = this.programas.filter((p) => p.id !== id)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al eliminar programa')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    // ── Proyectos ────────────────────────────────────────────
    async fetchProyectos(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listProyectos(params)
        this.proyectos = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar proyectos')
      } finally {
        this.setLoading(false)
      }
    },

    async createProyecto(payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.createProyecto(payload)
        this.proyectos.push(res.data)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al crear proyecto')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async updateProyecto(id, payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.updateProyecto(id, payload)
        const idx = this.proyectos.findIndex((p) => p.id === id)
        if (idx !== -1) this.proyectos[idx] = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al actualizar proyecto')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async deleteProyecto(id) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.deleteProyecto(id)
        this.proyectos = this.proyectos.filter((p) => p.id !== id)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al eliminar proyecto')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    // ── Planes ───────────────────────────────────────────────
    async fetchPlanes(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listPlanes(params)
        this.planes = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar planes')
      } finally {
        this.setLoading(false)
      }
    },

    async createPlan(payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.createPlan(payload)
        this.planes.push(res.data)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al crear plan')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async aprobarPlan(id) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.aprobarPlan(id)
        const idx = this.planes.findIndex((p) => p.id === id)
        if (idx !== -1) this.planes[idx] = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al aprobar plan')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    // ── Actividades ──────────────────────────────────────────
    async fetchActividades(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listActividades(params)
        this.actividades = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar actividades')
      } finally {
        this.setLoading(false)
      }
    },

    async createActividad(payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.createActividad(payload)
        this.actividades.push(res.data)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al crear actividad')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async updateActividad(id, payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.updateActividad(id, payload)
        const idx = this.actividades.findIndex((a) => a.id === id)
        if (idx !== -1) this.actividades[idx] = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al actualizar actividad')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async deleteActividad(id) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.deleteActividad(id)
        this.actividades = this.actividades.filter((a) => a.id !== id)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al eliminar actividad')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    // ── Indicadores ──────────────────────────────────────────
    async fetchIndicadores(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listIndicadores(params)
        this.indicadores = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar indicadores')
      } finally {
        this.setLoading(false)
      }
    },

    async createIndicador(payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.createIndicador(payload)
        this.indicadores.push(res.data)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al crear indicador')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async updateIndicador(id, payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.updateIndicador(id, payload)
        const idx = this.indicadores.findIndex((i) => i.id === id)
        if (idx !== -1) this.indicadores[idx] = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al actualizar indicador')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async deleteIndicador(id) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.deleteIndicador(id)
        this.indicadores = this.indicadores.filter((i) => i.id !== id)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al eliminar indicador')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    // ── Metas ────────────────────────────────────────────────
    async fetchMetas(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listMetas(params)
        this.metas = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar metas')
      } finally {
        this.setLoading(false)
      }
    },

    async createMeta(payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.createMeta(payload)
        this.metas.push(res.data)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al crear meta')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    async updateMeta(id, payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.updateMeta(id, payload)
        const idx = this.metas.findIndex((m) => m.id === id)
        if (idx !== -1) this.metas[idx] = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al actualizar meta')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    // ── Techos ───────────────────────────────────────────────
    async fetchTechos(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listTechos(params)
        this.techos = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar techos')
      } finally {
        this.setLoading(false)
      }
    },

    async createTecho(payload) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.createTecho(payload)
        this.techos.push(res.data)
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al crear techo')
        throw e
      } finally {
        this.setLoading(false)
      }
    },

    // ── Transiciones ─────────────────────────────────────────
    async fetchTransiciones(params) {
      this.setLoading(true)
      this.setError(null)
      try {
        const res = await poaService.listTransiciones(params)
        this.transiciones = res.data
        return res
      } catch (e) {
        this.setError(e.response?.data?.message || 'Error al cargar transiciones')
      } finally {
        this.setLoading(false)
      }
    },
  },
})
