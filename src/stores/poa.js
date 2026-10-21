import { defineStore } from 'pinia'
import { poaService, mensajeError } from '@/services/poaService'
import { useAuthStore } from '@/stores/auth'

const CLAVE_PLAN = 'sedede_poa_plan_id'

function leerPlanGuardado() {
  try {
    const id = Number(localStorage.getItem(CLAVE_PLAN))
    return id || null
  } catch {
    return null
  }
}

export const usePoaStore = defineStore('poa', {
  state: () => ({
    dashboard: null,
    arbol: [],
    planes: [],
    // Plan sobre el que trabajan el árbol, los techos y el dashboard.
    planId: leerPlanGuardado(),
    techos: [],
    transiciones: [],
    unidades: [],
    loading: false,
    error: null,
  }),

  getters: {
    planActivo: (state) => state.planes.find((p) => p.id === state.planId) ?? null,
    planEditable() {
      return this.planActivo?.estado === 'borrador'
    },
    nombreUnidad: (state) => (id) => state.unidades.find((u) => u.id === id)?.nombre ?? (id ? `Unidad #${id}` : '—'),
    // Permisos poa.* del rol, para ocultar lo que el backend rechazaría con
    // 403. Sin datos del rol (p. ej. tras recargar) no se oculta nada: el
    // backend sigue siendo quien autoriza.
    puede() {
      return (permiso) => {
        let permisos = useAuthStore().user?.role?.permisos
        if (typeof permisos === 'string') {
          try { permisos = JSON.parse(permisos) } catch { permisos = null }
        }
        return Array.isArray(permisos) ? permisos.includes(permiso) : true
      }
    },
  },

  actions: {
    setError(msg) {
      this.error = msg
    },

    // Envuelve una carga: activa `loading`, limpia y registra el error.
    async cargar(fn, porDefecto) {
      this.loading = true
      this.error = null
      try {
        return await fn()
      } catch (e) {
        this.error = mensajeError(e, porDefecto)
      } finally {
        this.loading = false
      }
    },

    seleccionarPlan(id) {
      this.planId = id || null
      try {
        if (this.planId) localStorage.setItem(CLAVE_PLAN, String(this.planId))
        else localStorage.removeItem(CLAVE_PLAN)
      } catch {
        // Sin almacenamiento local la selección dura solo la sesión.
      }
    },

    // ── Planes ───────────────────────────────────────────────
    async fetchPlanes() {
      await this.cargar(async () => {
        this.planes = await poaService.listPlanes()
        // Si no hay plan elegido (o ya no existe), se toma el más reciente.
        if (!this.planes.some((p) => p.id === this.planId)) {
          this.seleccionarPlan(this.planes[0]?.id ?? null)
        }
      }, 'Error al cargar planes')
    },

    // ── Catálogo de unidades (se carga una vez) ──────────────
    async fetchUnidades() {
      if (this.unidades.length) return
      try {
        this.unidades = await poaService.listUnidades()
      } catch {
        // Sin catálogo se muestran los IDs; no bloquea la vista.
      }
    },

    // ── Dashboard ────────────────────────────────────────────
    async fetchDashboard() {
      await this.cargar(async () => {
        this.dashboard = await poaService.getDashboard(this.planId ? { plan_id: this.planId } : {})
      }, 'Error al cargar el dashboard')
    },

    // ── Árbol ────────────────────────────────────────────────
    async fetchArbol() {
      await this.cargar(async () => {
        this.arbol = await poaService.getArbol(this.planId ? { plan_id: this.planId } : {})
      }, 'Error al cargar la estructura')
    },

    // ── Techos ───────────────────────────────────────────────
    async fetchTechos(params = {}) {
      await this.cargar(async () => {
        this.techos = await poaService.listTechos({
          ...(this.planId ? { plan_id: this.planId } : {}),
          ...params,
        })
      }, 'Error al cargar techos')
    },

    // ── Bitácora ─────────────────────────────────────────────
    async fetchTransiciones(params = {}) {
      await this.cargar(async () => {
        this.transiciones = await poaService.listTransiciones(params)
      }, 'Error al cargar la bitácora')
    },
  },
})
