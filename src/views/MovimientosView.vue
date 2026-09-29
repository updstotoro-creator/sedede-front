<script setup>
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
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Kardex de Movimientos</h1>
        <p class="text-sm text-gray-500">Registro inmutable de entradas y salidas de la sede</p>
      </div>
      <router-link
        to="/dashboard/inventario/movimientos/nuevo"
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Registrar Movimiento
      </router-link>
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
            <td class="px-4 py-3 text-xs">{{ fmtDocumento(mov) }}</td>
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
  </div>
</template>
