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
let nextLoteId = 6
let nextMovimientoId = 9

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

    lotes: [
      {
        id: 1,
        item_id: null,
        item_nombre: 'Material de Limpieza - Desinfectante',
        numero_lote: 'L-2026-001',
        fecha_fabricacion: '2026-01-15',
        fecha_vencimiento: '2027-01-15',
        stock: 48,
        observaciones: null,
        activo: true,
      },
      {
        id: 2,
        item_id: null,
        item_nombre: 'Papelería - Resma Papel Bond A4',
        numero_lote: 'L-2026-014',
        fecha_fabricacion: '2026-03-20',
        fecha_vencimiento: null,
        stock: 120,
        observaciones: null,
        activo: true,
      },
      {
        id: 3,
        item_id: null,
        item_nombre: 'Implementos Deportivos - Balones Fútbol',
        numero_lote: 'L-2025-088',
        fecha_fabricacion: '2025-06-10',
        fecha_vencimiento: null,
        stock: 15,
        observaciones: null,
        activo: true,
      },
      {
        id: 4,
        item_id: null,
        item_nombre: 'Papelería - Bolígrafos',
        numero_lote: 'L-2024-102',
        fecha_fabricacion: '2024-08-15',
        fecha_vencimiento: '2026-10-15',
        stock: 32,
        observaciones: null,
        activo: true,
      },
      {
        id: 5,
        item_id: null,
        item_nombre: 'Material de Limpieza - Alcohol',
        numero_lote: 'L-2024-045',
        fecha_fabricacion: '2024-02-10',
        fecha_vencimiento: '2025-02-10',
        stock: 0,
        observaciones: null,
        activo: false,
      },
    ],

    movimientos: [
      {
        id: 1,
        fecha: '2026-09-15 10:30',
        tipo: 'ingreso',
        item_nombre: 'Escritorios de Oficina',
        almacen_nombre: 'Almacén Central de la Sede',
        almacen_destino: null,
        cantidad: 10,
        saldo: 10,
        documento: 'Acta Recepción N° 045/2026',
        usuario: 'Roxana Q.',
        motivo: 'compra',
        observaciones: null,
      },
      {
        id: 2,
        fecha: '2026-09-16 14:15',
        tipo: 'salida',
        item_nombre: 'Resma Papel Bond A4',
        almacen_nombre: 'Almacén Central de la Sede',
        almacen_destino: null,
        cantidad: -20,
        saldo: 100,
        documento: 'Nota Salida N° 112/2026',
        usuario: 'Luis M.',
        motivo: 'solicitud_material',
        observaciones: null,
      },
      {
        id: 3,
        fecha: '2026-09-18 09:00',
        tipo: 'transferencia',
        item_nombre: 'Computadoras de Escritorio',
        almacen_nombre: 'Almacén Central de la Sede',
        almacen_destino: 'Sub Sede Cochabamba',
        cantidad: -5,
        saldo: 15,
        documento: 'Acta Transferencia N° 008/2026',
        usuario: 'Roxana Q.',
        motivo: null,
        observaciones: null,
      },
      {
        id: 4,
        fecha: '2026-09-18 09:00',
        tipo: 'transferencia',
        item_nombre: 'Computadoras de Escritorio',
        almacen_nombre: 'Almacén Central de la Sede',
        almacen_destino: 'Sub Sede Cochabamba',
        cantidad: 5,
        saldo: 5,
        documento: 'Acta Transferencia N° 008/2026',
        usuario: 'Roxana Q.',
        motivo: null,
        observaciones: null,
      },
      {
        id: 5,
        fecha: '2026-09-20 11:00',
        tipo: 'salida',
        item_nombre: 'Balones de Fútbol',
        almacen_nombre: 'Depósito para Entrega a Asociaciones',
        almacen_destino: null,
        cantidad: -6,
        saldo: 9,
        documento: 'Convenio N° 023/2026 - Asoc. San José',
        usuario: 'Patricia T.',
        motivo: 'donacion',
        observaciones: null,
      },
      {
        id: 6,
        fecha: '2026-09-22 16:45',
        tipo: 'ajuste',
        item_nombre: 'Desinfectante 5L',
        almacen_nombre: 'Depósito de Papelería y Limpieza',
        almacen_destino: null,
        cantidad: -2,
        saldo: 46,
        documento: 'Acta Recuento N° 007/2026',
        usuario: 'Luis M.',
        motivo: 'recuento',
        observaciones: null,
      },
      {
        id: 7,
        fecha: '2026-09-23 17:20',
        tipo: 'baja',
        item_nombre: 'Sillas Giratorias (deterioradas)',
        almacen_nombre: 'Depósito de Activos Fijos',
        almacen_destino: null,
        cantidad: -3,
        saldo: 0,
        documento: 'Acta Baja N° 002/2026',
        usuario: 'Roxana Q.',
        motivo: 'merma',
        observaciones: null,
      },
    ],

    existencias: [
      { id: 1, codigo: 'MOB-002', item_nombre: 'Escritorios de Oficina', almacen_nombre: 'Almacén Central de la Sede', lote: null, stock: 10, minimo: 5 },
      { id: 2, codigo: 'EQP-001', item_nombre: 'Computadoras de Escritorio', almacen_nombre: 'Almacén Central de la Sede', lote: null, stock: 15, minimo: 10 },
      { id: 3, codigo: 'EQP-001', item_nombre: 'Computadoras de Escritorio', almacen_nombre: 'Sub Sede Cochabamba', lote: null, stock: 5, minimo: 3 },
      { id: 4, codigo: 'PAP-001', item_nombre: 'Resma Papel Bond A4', almacen_nombre: 'Almacén Central de la Sede', lote: 'L-2026-014', stock: 100, minimo: 50 },
      { id: 5, codigo: 'LIM-001', item_nombre: 'Desinfectante 5L', almacen_nombre: 'Depósito de Papelería y Limpieza', lote: 'L-2026-001', stock: 46, minimo: 20 },
      { id: 6, codigo: 'DEP-001', item_nombre: 'Balones de Fútbol', almacen_nombre: 'Depósito para Entrega a Asociaciones', lote: 'L-2025-088', stock: 9, minimo: 15 },
      { id: 7, codigo: 'MOB-003', item_nombre: 'Sillas Giratorias', almacen_nombre: 'Depósito de Activos Fijos', lote: null, stock: 0, minimo: 5 },
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

    // --- Lotes ---
    addLote(payload) {
      this.lotes.push({ id: nextLoteId++, activo: true, ...payload })
    },
    updateLote(id, payload) {
      const lote = this.lotes.find((l) => l.id === Number(id))
      if (lote) Object.assign(lote, payload)
    },
    toggleLoteActivo(id) {
      const lote = this.lotes.find((l) => l.id === Number(id))
      if (lote) lote.activo = !lote.activo
    },

    // --- Movimientos ---
    addMovimiento(payload) {
      this.movimientos.push({ id: nextMovimientoId++, ...payload })
    },
  },
})
