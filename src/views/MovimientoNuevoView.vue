<script setup>
import { reactive, computed, watch } from 'vue'
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
