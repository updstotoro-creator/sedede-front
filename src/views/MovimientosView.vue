<script setup>
import { reactive, ref, computed } from 'vue'
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

const showModal = ref(false)
const form = reactive({
  tipo: 'ingreso',
  item_nombre: '',
  almacen_nombre: '',
  cantidad: 1,
  documento: '',
  motivo: '',
  observaciones: '',
})

const almacenesUnicos = computed(() => {
  const nombres = new Set(store.movimientos.map((m) => m.almacen_nombre))
  return [...nombres]
})

const movimientosFiltrados = computed(() => {
  return store.movimientos.filter((m) => {
    const coincideFecha = !filtroFecha.value || m.fecha.startsWith(filtroFecha.value)
    const coincideTipo = !filtroTipo.value || m.tipo === filtroTipo.value
    const coincideAlmacen = !filtroAlmacen.value || m.almacen_nombre === filtroAlmacen.value
    const q = busqueda.value.toLowerCase()
    const coincideBusqueda = !busqueda.value ||
      m.item_nombre.toLowerCase().includes(q) ||
      (m.documento ?? '').toLowerCase().includes(q)
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

function openCreateModal() {
  form.tipo = 'ingreso'
  form.item_nombre = ''
  form.almacen_nombre = ''
  form.cantidad = 1
  form.documento = ''
  form.motivo = ''
  form.observaciones = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function submitForm() {
  const ahora = new Date()
  const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
  const cantidad = form.tipo === 'ingreso' ? Math.abs(form.cantidad) : -Math.abs(form.cantidad)
  store.addMovimiento({
    fecha,
    tipo: form.tipo,
    item_nombre: form.item_nombre,
    almacen_nombre: form.almacen_nombre,
    almacen_destino: null,
    cantidad,
    saldo: 0,
    documento: form.documento,
    usuario: 'Actual',
    motivo: form.motivo || null,
    observaciones: form.observaciones || null,
  })
  closeModal()
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Kardex de Movimientos</h1>
        <p class="text-sm text-gray-500">Registro inmutable de entradas y salidas de la sede</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Registrar Movimiento
      </button>
    </div>

    <div class="rounded-t-lg border-b border-gray-200 bg-white p-4 shadow-sm">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input v-model="filtroFecha" type="date" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
        <select v-model="filtroTipo" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
          <option value="">Todos los tipos</option>
          <option v-for="t in tiposMovimiento" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <select v-model="filtroAlmacen" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
          <option value="">Todos los almacenes</option>
          <option v-for="a in almacenesUnicos" :key="a" :value="a">{{ a }}</option>
        </select>
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar ítem o documento..."
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
        />
      </div>
    </div>

    <div class="overflow-x-auto rounded-b-lg bg-white shadow-md">
      <table class="min-w-full leading-normal">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
            <th class="px-4 py-3 text-left font-semibold">Fecha</th>
            <th class="px-4 py-3 text-left font-semibold">Tipo</th>
            <th class="px-4 py-3 text-left font-semibold">Ítem</th>
            <th class="px-4 py-3 text-left font-semibold">Almacén</th>
            <th class="px-4 py-3 text-right font-semibold">Cantidad</th>
            <th class="px-4 py-3 text-right font-semibold">Saldo</th>
            <th class="px-4 py-3 text-left font-semibold">Documento</th>
            <th class="px-4 py-3 text-left font-semibold">Usuario</th>
            <th class="px-4 py-3 text-center font-semibold">Ver</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-700">
          <tr
            v-for="mov in movimientosFiltrados"
            :key="mov.id"
            class="border-b border-gray-100 hover:bg-gray-50"
            :class="[
              mov.tipo === 'transferencia' && 'bg-blue-50/30',
              mov.tipo === 'baja' && 'opacity-75',
            ]"
          >
            <td class="whitespace-nowrap px-4 py-3 text-gray-600">{{ mov.fecha }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="tipoBadge(mov.tipo)">
                {{ tipoLabel(mov.tipo) }}
              </span>
            </td>
            <td class="px-4 py-3 font-medium">{{ mov.item_nombre }}</td>
            <td class="px-4 py-3 text-gray-600">
              {{ mov.almacen_nombre }}
              <template v-if="mov.almacen_destino">
                <span class="mx-1 text-gray-400">→</span> {{ mov.almacen_destino }}
              </template>
            </td>
            <td
              class="px-4 py-3 text-right font-semibold"
              :class="mov.cantidad >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ mov.cantidad >= 0 ? '+' : '' }}{{ mov.cantidad.toFixed(4) }}
            </td>
            <td class="px-4 py-3 text-right font-bold text-gray-800">{{ mov.saldo.toFixed(4) }}</td>
            <td class="px-4 py-3 text-xs">{{ mov.documento ?? '—' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ mov.usuario }}</td>
            <td class="px-4 py-3 text-center">
              <button class="text-xs font-medium text-blue-600 hover:text-blue-800">Ver</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
        <span class="text-xs text-gray-500">Mostrando {{ movimientosFiltrados.length }} movimientos</span>
      </div>
    </div>

    <div class="mt-4 border-l-4 border-blue-400 bg-blue-50 p-3 text-sm text-blue-800">
      <strong>ℹ️ Nota:</strong> Los movimientos son inmutables. Para corregir un error se debe registrar un nuevo movimiento de tipo <em>ajuste</em>.
    </div>

    <!-- Modal crear -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">Registrar Movimiento</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Tipo</label>
            <select v-model="form.tipo" class="input-field">
              <option v-for="t in tiposMovimiento" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Ítem</label>
            <input v-model="form.item_nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Almacén</label>
            <input v-model="form.almacen_nombre" type="text" class="input-field" required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Cantidad</label>
              <input v-model.number="form.cantidad" type="number" step="0.0001" class="input-field" required />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Motivo</label>
              <input v-model="form.motivo" type="text" class="input-field" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Documento</label>
            <input v-model="form.documento" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Observaciones</label>
            <input v-model="form.observaciones" type="text" class="input-field" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
