import { defineStore } from 'pinia'
import { poaService } from '@/services/poaService'

export const usePoaStore = defineStore('poa', {
  state: () => ({
    dashboard: null,
    programas: [],
    proyectos: [],
    planes: [],
    actividades: [],
    indicadores: [],
    metas: [],
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
  },
})
