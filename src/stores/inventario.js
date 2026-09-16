import { defineStore } from 'pinia'

/**
 * Store temporal en memoria para el módulo de Inventario.
 *
 * Basado en los campos reales de las migraciones del backend
 * (inventario_tipos_item, inventario_almacenes). El backend todavía
 * no expone rutas API para este módulo ni tiene tabla de Ítems, así
 * que Lotes y Movimientos no se construyen aún — dependen de una
 * tabla `inventario_items` que no existe todavía.
 *
 * Cuando el backend exponga las rutas, este store se reemplaza por
 * un `inventarioService.js` (mismo patrón que userService.js).
 */

let nextTipoId = 5
let nextAlmacenId = 4

export const useInventarioStore = defineStore('inventario', {
  state: () => ({
    tiposItem: [
      {
        id: 1,
        codigo: 'DEP',
        nombre: 'Deportivo',
        descripcion: 'Material deportivo en general',
        padre_id: null,
        naturaleza: 'consumible',
        controla_lote: false,
        controla_vencimiento: false,
        activo: true,
      },
      {
        id: 2,
        codigo: 'DEP-BAL',
        nombre: 'Balones',
        descripcion: 'Balones de distintas disciplinas',
        padre_id: 1,
        naturaleza: 'activo_fijo',
        controla_lote: false,
        controla_vencimiento: false,
        activo: true,
      },
      {
        id: 3,
        codigo: 'DEP-BAL-FUT',
        nombre: 'Fútbol',
        descripcion: 'Balones de fútbol reglamentarios',
        padre_id: 2,
        naturaleza: 'activo_fijo',
        controla_lote: false,
        controla_vencimiento: false,
        activo: true,
      },
      {
        id: 4,
        codigo: 'MED',
        nombre: 'Botiquín',
        descripcion: 'Insumos médicos de primeros auxilios',
        padre_id: null,
        naturaleza: 'consumible',
        controla_lote: true,
        controla_vencimiento: true,
        activo: true,
      },
    ],

    almacenes: [
      {
        id: 1,
        codigo: 'ALM-CEN',
        nombre: 'Almacén Central',
        descripcion: 'Almacén principal del SEDEDE',
        ubicacion: 'Sucre, sede central',
        padre_id: null,
        responsable: 'Administrador SEDEDE',
        es_principal: true,
        activo: true,
      },
      {
        id: 2,
        codigo: 'ALM-CEN-A',
        nombre: 'Estante A',
        descripcion: 'Subdivisión del almacén central',
        ubicacion: null,
        padre_id: 1,
        responsable: null,
        es_principal: false,
        activo: true,
      },
      {
        id: 3,
        codigo: 'ALM-COL',
        nombre: 'Almacén Coliseo Cerrado',
        descripcion: 'Depósito auxiliar en el coliseo',
        ubicacion: 'Coliseo Cerrado, Sucre',
        padre_id: null,
        responsable: null,
        es_principal: false,
        activo: true,
      },
    ],
  }),

  getters: {
    // Nombre completo con su jerarquía, ej: "Deportivo > Balones > Fútbol"
    tipoRutaCompleta: (state) => (id) => {
      const camino = []
      let actual = state.tiposItem.find((t) => t.id === Number(id))
      while (actual) {
        camino.unshift(actual.nombre)
        actual = state.tiposItem.find((t) => t.id === actual.padre_id)
      }
      return camino.join(' > ')
    },
    almacenRutaCompleta: (state) => (id) => {
      const camino = []
      let actual = state.almacenes.find((a) => a.id === Number(id))
      while (actual) {
        camino.unshift(actual.nombre)
        actual = state.almacenes.find((a) => a.id === actual.padre_id)
      }
      return camino.join(' > ')
    },
  },

  actions: {
    // --- Tipos de ítem ---
    addTipoItem(payload) {
      this.tiposItem.push({ id: nextTipoId++, activo: true, ...payload })
    },
    updateTipoItem(id, payload) {
      const tipo = this.tiposItem.find((t) => t.id === Number(id))
      if (tipo) Object.assign(tipo, payload)
    },
    toggleTipoItemActivo(id) {
      const tipo = this.tiposItem.find((t) => t.id === Number(id))
      if (tipo) tipo.activo = !tipo.activo
    },

    // --- Almacenes ---
    addAlmacen(payload) {
      this.almacenes.push({ id: nextAlmacenId++, activo: true, ...payload })
    },
    updateAlmacen(id, payload) {
      const almacen = this.almacenes.find((a) => a.id === Number(id))
      if (almacen) Object.assign(almacen, payload)
    },
    toggleAlmacenActivo(id) {
      const almacen = this.almacenes.find((a) => a.id === Number(id))
      if (almacen) almacen.activo = !almacen.activo
    },
  },
})
