# Registro de Movimiento de Inventario (página completa) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el modal de "Registrar Movimiento" por una página completa con radios de tipo, selects de ítem/almacén/lote, costo unitario, motivo, documento y fecha, guardando con saldo acumulado.

**Architecture:** Nueva vista `MovimientoNuevoView.vue` en ruta nueva (patrón idéntico a `LoteNuevoView`), store de inventario extendido con los campos nuevos y cálculo de saldo, y `MovimientosView` simplificado (botón → enlace, sin modal).

**Tech Stack:** Vue 3 (`<script setup>`), Vue Router, Pinia, Tailwind CSS (sin framework de tests).

## Global Constraints

- El proyecto NO tiene framework de tests: la verificación es `npm run lint`, `npm run build` y checks manuales con `npm run dev`. No agregar dependencias de testing.
- No instalar paquetes nuevos. No tocar `package.json`.
- No committear los cambios sin commit que ya existen en `src/services/*.js` (rutas `/core/`): usar siempre `git add <archivos concretos>`, nunca `git add -A`.
- Convenciones del codebase: `<script setup>`, Composition API, Tailwind inline, sin comentarios innecesarios, mensajes en español.
- El store de inventario sigue siendo datos en memoria (documentado en el propio archivo); no crear servicios API para este módulo.
- Spec: `docs/superpowers/specs/2026-09-28-registrar-movimiento-design.md`.

---

### Task 1: Store de inventario — saldo, firmas y getters

**Files:**
- Modify: `src/stores/inventario.js` (getters ~línea 276, action `addMovimiento` ~línea 339)

**Interfaces:**
- Consumes: estado `lotes`, `existencias`, `movimientos` (ya existen).
- Produces (lo usan Tasks 3 y 4):
  - `store.itemsDisponibles` → `string[]` (nombres únicos ordenados)
  - `store.lotesPorItem(itemNombre)` → `lote[]` (activos de ese ítem)
  - `store.addMovimiento(payload)` → acepta `fecha, tipo, item_nombre, almacen_nombre, almacen_destino, lote, cantidad (≥0), costo_unitario, tipo_documento, numero_documento, motivo, observaciones, usuario`; calcula `cantidad` firmada y `saldo`.

- [ ] **Step 1: Agregar getters al store**

En `src/stores/inventario.js`, dentro de `getters:` (después de `almacenRutaCompleta`), agregar:

```js
    itemsDisponibles: (state) => {
      const nombres = [
        ...state.lotes.map((l) => l.item_nombre),
        ...state.existencias.map((e) => e.item_nombre),
      ].filter(Boolean)
      return [...new Set(nombres)].sort()
    },
    lotesPorItem: (state) => (itemNombre) =>
      state.lotes.filter((l) => l.activo && l.item_nombre === itemNombre),
```

- [ ] **Step 2: Reemplazar `addMovimiento`**

Reemplazar el método actual por:

```js
    addMovimiento(payload) {
      const signo = ['salida', 'baja', 'transferencia'].includes(payload.tipo) ? -1 : 1
      const cantidadFirmada = Math.abs(payload.cantidad) * signo
      const anteriores = this.movimientos.filter((m) => m.item_nombre === payload.item_nombre)
      const ultimo = anteriores.length ? anteriores[anteriores.length - 1] : null
      this.movimientos.push({
        ...payload,
        id: nextMovimientoId++,
        cantidad: cantidadFirmada,
        saldo: (ultimo ? ultimo.saldo : 0) + cantidadFirmada,
      })
    },
```

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores; build termina `✓ built in …s`.

- [ ] **Step 4: Commit**

```bash
git add src/stores/inventario.js
git commit -m "feat(inventario): store calcula saldo y expone items/lotes por ítem"
```

---

### Task 2: Ruta nueva y títulos del header

**Files:**
- Modify: `src/router/index.js` (bloque de rutas hijas de `/dashboard`, tras la ruta `inventario/movimientos` ~línea 67-71)
- Modify: `src/views/DashboardView.vue:7-18` (objeto `titles`)

**Interfaces:**
- Consumes: nombre de ruta `dashboard-inventario-movimientos-nuevo` (lo usa Task 3).
- Produces: ruta navegable y títulos correctos en el header.

- [ ] **Step 1: Registrar la ruta**

En `src/router/index.js`, después de la ruta `inventario/movimientos`, agregar:

```js
      {
        path: 'inventario/movimientos/nuevo',
        name: 'dashboard-inventario-movimientos-nuevo',
        component: () => import('../views/MovimientoNuevoView.vue'),
      },
```

- [ ] **Step 2: Completar el mapa de títulos**

Reemplazar el objeto `titles` completo de `DashboardView.vue` por:

```js
const titles = {
  dashboard: 'Resumen',
  'dashboard-users': 'Usuarios',
  'dashboard-roles': 'Roles',
  'dashboard-asociaciones': 'Padrón de Asociaciones',
  'dashboard-asociacion-detalle': 'Clubes de la Asociación',
  'dashboard-club-detalle': 'Deportistas del Club',
  'dashboard-inventario-tipos-item': 'Tipos de Ítem',
  'dashboard-inventario-almacenes': 'Almacenes',
  'dashboard-inventario-lotes': 'Lotes',
  'dashboard-inventario-lotes-nuevo': 'Nuevo Lote',
  'dashboard-inventario-movimientos': 'Movimientos (Kardex)',
  'dashboard-inventario-movimientos-nuevo': 'Nuevo Movimiento',
  'dashboard-inventario-existencias': 'Existencias',
  'dashboard-poa': 'Estructura POA',
  'dashboard-poa-dashboard': 'Dashboard POA',
  'dashboard-poa-planes': 'Planes POA',
  'dashboard-poa-actividad': 'Actividad POA',
  'dashboard-poa-techos': 'Techos Presupuestarios',
  'dashboard-poa-bitacora': 'Bitácora de Metas',
}
```

(De paso se arregla la indentación mezclada que tenía el objeto.)

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores. (La ruta compila aunque la vista aún no exista: es import dinámico.)

- [ ] **Step 4: Commit**

```bash
git add src/router/index.js src/views/DashboardView.vue
git commit -m "feat(inventario): ruta para nuevo movimiento y títulos de header"
```

---

### Task 3: Vista `MovimientoNuevoView.vue`

**Files:**
- Create: `src/views/MovimientoNuevoView.vue`

**Interfaces:**
- Consumes: `useInventarioStore()` con `itemsDisponibles`, `lotesPorItem`, `almacenes`, `lotes`, `addMovimiento` (Task 1); ruta `dashboard-inventario-movimientos-nuevo` (Task 2).
- Produces: al guardar hace `router.push({ name: 'dashboard-inventario-movimientos' })`.

- [ ] **Step 1: Crear la vista completa**

Crear `src/views/MovimientoNuevoView.vue` con este contenido:

```vue
<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useInventarioStore } from '../stores/inventario'

const router = useRouter()
const store = useInventarioStore()

function ahoraLocal() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const tipos = [
  { value: 'ingreso', label: 'Entrada', emoji: '⬇️', active: 'border-green-500 bg-green-50 text-green-700' },
  { value: 'salida', label: 'Salida', emoji: '⬆️', active: 'border-red-500 bg-red-50 text-red-700' },
  { value: 'baja', label: 'Baja', emoji: '🗑️', active: 'border-gray-600 bg-gray-100 text-gray-700' },
  { value: 'ajuste', label: 'Ajuste', emoji: '⚙️', active: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
  { value: 'transferencia', label: 'Transferencia', emoji: '🔁', active: 'border-blue-500 bg-blue-50 text-blue-700' },
]

const motivos = [
  { value: 'compra', label: 'Compra' },
  { value: 'donacion', label: 'Donación' },
  { value: 'devolucion', label: 'Devolución' },
  { value: 'solicitud_material', label: 'Solicitud de material' },
  { value: 'merma', label: 'Merma' },
  { value: 'vencimiento', label: 'Vencimiento' },
  { value: 'extravio', label: 'Extravío' },
  { value: 'recuento', label: 'Recuento físico' },
  { value: 'entrega_asociacion', label: 'Entrega a asociación' },
  { value: 'baja', label: 'Baja' },
]

const tiposDocumento = [
  'Nota de Ingreso',
  'Nota de Salida',
  'Acta de Recepción',
  'Acta de Baja',
  'Acta de Transferencia',
  'Convenio',
]

const form = reactive({
  tipo: 'ingreso',
  item_nombre: '',
  almacen_nombre: '',
  almacen_destino: '',
  lote: '',
  cantidad: null,
  costo_unitario: null,
  motivo: '',
  tipo_documento: '',
  numero_documento: '',
  fecha: ahoraLocal(),
  observaciones: '',
})

const errores = reactive({ item: '', almacen: '', cantidad: '', destino: '' })

watch(
  [() => form.item_nombre, () => form.almacen_nombre, () => form.cantidad, () => form.almacen_destino],
  () => {
    errores.item = ''
    errores.almacen = ''
    errores.cantidad = ''
    errores.destino = ''
  },
)

const almacenesActivos = computed(() => store.almacenes.filter((a) => a.activo))
const destinos = computed(() => almacenesActivos.value.filter((a) => a.nombre !== form.almacen_nombre))
const lotesDelItem = computed(() =>
  form.item_nombre ? store.lotesPorItem(form.item_nombre) : [],
)

function submitForm() {
  errores.item = form.item_nombre ? '' : 'Selecciona un ítem.'
  errores.almacen = form.almacen_nombre ? '' : 'Selecciona un almacén.'
  errores.cantidad = Number(form.cantidad) > 0 ? '' : 'La cantidad debe ser mayor a 0.'
  errores.destino =
    form.tipo !== 'transferencia' || form.almacen_destino
      ? ''
      : 'Selecciona el almacén destino.'
  if (errores.item || errores.almacen || errores.cantidad || errores.destino) return

  store.addMovimiento({
    fecha: (form.fecha || ahoraLocal()).replace('T', ' '),
    tipo: form.tipo,
    item_nombre: form.item_nombre,
    almacen_nombre: form.almacen_nombre,
    almacen_destino: form.tipo === 'transferencia' ? form.almacen_destino : null,
    lote: form.lote || null,
    cantidad: Number(form.cantidad),
    costo_unitario:
      form.costo_unitario !== null && form.costo_unitario !== ''
        ? Number(form.costo_unitario)
        : null,
    tipo_documento: form.tipo_documento || null,
    numero_documento: form.numero_documento.trim() || null,
    documento: null,
    motivo: form.motivo || null,
    observaciones: form.observaciones.trim() || null,
    usuario: 'Actual',
  })
  router.push({ name: 'dashboard-inventario-movimientos' })
}

function cancelar() {
  router.push({ name: 'dashboard-inventario-movimientos' })
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-5">
      <h2 class="text-xl font-bold text-gray-800">Registrar Movimiento de Inventario</h2>
      <p class="mt-1 text-sm text-gray-500">
        Complete los datos del movimiento. Los campos marcados con
        <span class="text-red-600">*</span> son obligatorios.
      </p>
    </div>

    <form class="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm" @submit.prevent="submitForm">
      <!-- Tipo de movimiento -->
      <div>
        <label class="mb-2 block text-sm font-semibold text-gray-700">
          Tipo de Movimiento <span class="text-red-600">*</span>
        </label>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
          <label v-for="t in tipos" :key="t.value" class="cursor-pointer">
            <input v-model="form.tipo" type="radio" name="tipo" :value="t.value" class="sr-only" />
            <div
              class="rounded-lg border-2 p-3 text-center transition"
              :class="form.tipo === t.value ? t.active : 'border-gray-200 text-gray-700 hover:border-gray-300'"
            >
              <div class="mb-1 text-2xl">{{ t.emoji }}</div>
              <p class="text-xs font-semibold">{{ t.label }}</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Almacén destino (solo transferencia) -->
      <div v-if="form.tipo === 'transferencia'">
        <label class="mb-1 block text-sm font-semibold text-gray-700">
          Almacén Destino <span class="text-red-600">*</span>
        </label>
        <select v-model="form.almacen_destino" class="input-field">
          <option value="">— Seleccione el destino —</option>
          <option v-for="a in destinos" :key="a.id" :value="a.nombre">{{ a.nombre }}</option>
        </select>
        <p v-if="errores.destino" class="mt-1 text-xs font-semibold text-red-600">{{ errores.destino }}</p>
      </div>

      <!-- Ítem -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">
          Ítem <span class="text-red-600">*</span>
        </label>
        <select v-model="form.item_nombre" class="input-field">
          <option value="">— Seleccione un ítem —</option>
          <option v-for="nombre in store.itemsDisponibles" :key="nombre" :value="nombre">{{ nombre }}</option>
        </select>
        <p v-if="errores.item" class="mt-1 text-xs font-semibold text-red-600">{{ errores.item }}</p>
      </div>

      <!-- Almacén -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">
          Almacén <span class="text-red-600">*</span>
        </label>
        <select v-model="form.almacen_nombre" class="input-field">
          <option value="">— Seleccione un almacén —</option>
          <option v-for="a in almacenesActivos" :key="a.id" :value="a.nombre">{{ a.nombre }}</option>
        </select>
        <p v-if="errores.almacen" class="mt-1 text-xs font-semibold text-red-600">{{ errores.almacen }}</p>
      </div>

      <!-- Lote -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">Lote</label>
        <select v-model="form.lote" class="input-field">
          <option value="">— Sin lote / No aplica —</option>
          <option v-for="l in lotesDelItem" :key="l.id" :value="l.numero_lote">
            {{ l.numero_lote }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">Obligatorio solo para ítems con control de lote.</p>
      </div>

      <!-- Cantidad + costo -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">
            Cantidad <span class="text-red-600">*</span>
          </label>
          <input
            v-model.number="form.cantidad"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="input-field"
          />
          <p class="mt-1 text-xs text-gray-500">Se registrará con el signo según el tipo de movimiento.</p>
          <p v-if="errores.cantidad" class="mt-1 text-xs font-semibold text-red-600">{{ errores.cantidad }}</p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">Costo Unitario</label>
          <input
            v-model.number="form.costo_unitario"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="input-field"
          />
          <p class="mt-1 text-xs text-gray-500">Opcional. Para valorización del inventario.</p>
        </div>
      </div>

      <!-- Motivo -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">Motivo</label>
        <select v-model="form.motivo" class="input-field">
          <option value="">— Seleccione un motivo —</option>
          <option v-for="m in motivos" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <!-- Documento -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">Tipo de Documento</label>
          <select v-model="form.tipo_documento" class="input-field">
            <option value="">— Seleccione —</option>
            <option v-for="td in tiposDocumento" :key="td" :value="td">{{ td }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">N° de Documento</label>
          <input v-model="form.numero_documento" type="text" placeholder="Ej: 045/2026" class="input-field" />
        </div>
      </div>

      <!-- Fecha -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">
          Fecha del Movimiento <span class="text-red-600">*</span>
        </label>
        <input v-model="form.fecha" type="datetime-local" class="input-field" />
      </div>

      <!-- Observaciones -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">Observaciones</label>
        <textarea
          v-model="form.observaciones"
          rows="3"
          placeholder="Notas adicionales sobre el movimiento..."
          class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
        ></textarea>
      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          @click="cancelar"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-800"
        >
          Registrar Movimiento
        </button>
      </div>
    </form>
  </div>
</template>
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/views/MovimientoNuevoView.vue
git commit -m "feat(inventario): vista de registro de movimiento con radios, selects y documento"
```

---

### Task 4: `MovimientosView` — botón como enlace, sin modal, Documento compuesto

**Files:**
- Modify: `src/views/MovimientosView.vue` (script líneas 1-96, botón línea 105-113, celda Documento línea 181, modal líneas 198-241)

**Interfaces:**
- Consumes: ruta `dashboard-inventario-movimientos-nuevo` (Task 2), `store.addMovimiento` ya no se usa en esta vista.
- Produces: lista de movimientos sin modal; columna Documento compuesta.

- [ ] **Step 1: Limpiar el script**

Reemplazar todo el bloque de estado/funciones del modal por:

```js
import { ref, computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

const filtroFecha = ref('')
const filtroTipo = ref('')
const filtroAlmacen = ref('')
const busqueda = ref('')

const tiposMovimiento = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'salida', label: 'Salida' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'baja', label: 'Baja' },
]

const almacenesUnicos = computed(() => {
  const nombres = new Set(store.movimientos.map((m) => m.almacen_nombre))
  return [...nombres]
})

function fmtDocumento(m) {
  if (m.tipo_documento && m.numero_documento) return `${m.tipo_documento} N° ${m.numero_documento}`
  if (m.tipo_documento) return m.tipo_documento
  if (m.numero_documento) return `N° ${m.numero_documento}`
  return m.documento ?? '—'
}

const movimientosFiltrados = computed(() => {
  return store.movimientos.filter((m) => {
    const coincideFecha = !filtroFecha.value || m.fecha.startsWith(filtroFecha.value)
    const coincideTipo = !filtroTipo.value || m.tipo === filtroTipo.value
    const coincideAlmacen = !filtroAlmacen.value || m.almacen_nombre === filtroAlmacen.value
    const q = busqueda.value.toLowerCase()
    const coincideBusqueda =
      !busqueda.value ||
      m.item_nombre.toLowerCase().includes(q) ||
      fmtDocumento(m).toLowerCase().includes(q)
    return coincideFecha && coincideTipo && coincideAlmacen && coincideBusqueda
  })
})

const tipoBadge = (tipo) => {
  const map = {
    ingreso: 'bg-green-100 text-green-700',
    salida: 'bg-red-100 text-red-700',
    transferencia: 'bg-blue-100 text-blue-700',
    ajuste: 'bg-yellow-100 text-yellow-700',
    baja: 'bg-gray-200 text-gray-700',
  }
  return map[tipo] ?? 'bg-slate-100 text-slate-700'
}

const tipoLabel = (tipo) => tiposMovimiento.find((t) => t.value === tipo)?.label ?? tipo
```

(Elimina `reactive`, `showModal`, `form`, `openCreateModal`, `closeModal`, `submitForm`.)

- [ ] **Step 2: Botón → enlace**

Reemplazar el `<button>` de "Registrar Movimiento" (líneas 105-113) por:

```html
        <router-link
          to="/dashboard/inventario/movimientos/nuevo"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Registrar Movimiento
        </router-link>
```

- [ ] **Step 3: Columna Documento compuesta**

Cambiar la celda de documento (línea 181) de:

```html
            <td class="px-4 py-3 text-xs">{{ mov.documento ?? '—' }}</td>
```

a:

```html
            <td class="px-4 py-3 text-xs">{{ fmtDocumento(mov) }}</td>
```

- [ ] **Step 4: Eliminar el modal**

Borrar el bloque completo `<!-- Modal crear -->` … `</div>` final del template (líneas 198-241), dejando cerrado el `<div class="mx-auto max-w-7xl">` raíz tras la nota informativa.

- [ ] **Step 5: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/views/MovimientosView.vue
git commit -m "feat(inventario): lista de movimientos usa enlace a página nueva y documento compuesto"
```

---

### Task 5: Verificación final

**Files:**
- Ninguno (solo verificación). Si algo falla, corregir en el archivo correspondiente.

**Interfaces:**
- Consumes: Tasks 1-4.

- [ ] **Step 1: Lint + build limpios**

Run: `npm run lint && npm run build`
Expected: sin errores; `✓ built`.

- [ ] **Step 2: Smoke test manual**

Run: `npm run dev` y verificar en el navegador:
1. `/dashboard/inventario/movimientos` → el botón "Registrar Movimiento" abre la página nueva; el header dice "Nuevo Movimiento".
2. Formulario: 5 radios; al elegir Transferencia aparece Almacén Destino; Ítem/Almacén/Motivo/Documento son selects; Lote empieza en "Sin lote / No aplica".
3. Elegir ítem "Papelería - Resma Papel Bond A4" → el select de lote muestra `L-2026-014`.
4. Dejar cantidad vacía y pulsar "Registrar Movimiento" → aparece el error rojo "La cantidad debe ser mayor a 0." y no se guarda.
5. Registrar una Salida de cantidad 20 de "Papelería - Resma Papel Bond A4" → vuelve a la lista; fila nueva con cantidad `-20.0000`, saldo `80.0000` (100 − 20) y Documento compuesto si se eligió tipo+número.
6. Cancelar → vuelve a la lista.
7. Recargar la página → los cambios se pierden (esperado: store en memoria).

- [ ] **Step 3: Estado de git limpio de cambios inesperados**

Run: `git status`
Expected: solo los archivos de este plan commiteados; `src/services/*.js` (cambios `/core/`) y `docs/`/`.superpowers/` siguen sin committear, tal como estaban.

---

## Self-Review (realizado al escribir el plan)

1. **Cobertura del spec:** ruta/títulos (Task 2), formulario completo con 5 radios y todos los campos (Task 3), store con saldo/campos nuevos/getters (Task 1), lista sin modal + Documento compuesto (Task 4), criterios 1-9 verificados en Task 5. `fecha` sin bloquear el guardado → cubierto con fallback `(form.fecha || ahoraLocal())`. Signo por tipo → `addMovimiento`. Fuera de alcance (columnas costo/lote, edición) no se toca.
2. **Placeholders:** ninguno; todos los pasos llevan código o comandos exactos.
3. **Consistencia de tipos/nombres:** `itemsDisponibles`, `lotesPorItem(itemNombre)`, `addMovimiento(payload)`, ruta `dashboard-inventario-movimientos-nuevo` usan los mismos nombres en Tasks 1-4.
