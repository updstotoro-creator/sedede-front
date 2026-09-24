<script setup>
import { ref, computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

const busqueda = ref('')
const filtroAlmacen = ref('')

const almacenesUnicos = computed(() => {
  const nombres = new Set(store.existencias.map((e) => e.almacen_nombre))
  return [...nombres]
})

const existenciasFiltradas = computed(() => {
  return store.existencias.filter((e) => {
    const q = busqueda.value.toLowerCase()
    const coincideBusqueda = !busqueda.value ||
      e.codigo.toLowerCase().includes(q) ||
      e.item_nombre.toLowerCase().includes(q)
    const coincideAlmacen = !filtroAlmacen.value || e.almacen_nombre === filtroAlmacen.value
    return coincideBusqueda && coincideAlmacen
  })
})

const totalItems = computed(() => store.existencias.length)
const conStock = computed(() => store.existencias.filter((e) => e.stock > 0).length)
const sinStock = computed(() => store.existencias.filter((e) => e.stock === 0).length)
const bajoMinimo = computed(() => store.existencias.filter((e) => e.stock > 0 && e.stock < e.minimo).length)

function alerta(e) {
  if (e.stock === 0) return { label: 'Sin Stock', class: 'bg-red-100 text-red-700' }
  if (e.stock < e.minimo) return { label: 'Bajo', class: 'bg-orange-100 text-orange-700' }
  return { label: 'OK', class: 'bg-green-100 text-green-700' }
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Existencias de Inventario</h1>
        <p class="text-sm text-gray-500">Stock actual de la sede calculado desde los movimientos</p>
      </div>
      <button class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-green-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar
      </button>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Total Ítems</p>
        <p class="text-2xl font-bold text-gray-800">{{ totalItems }}</p>
      </div>
      <div class="rounded-lg border-l-4 border-green-500 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Con Stock</p>
        <p class="text-2xl font-bold text-green-600">{{ conStock }}</p>
      </div>
      <div class="rounded-lg border-l-4 border-red-500 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Sin Stock</p>
        <p class="text-2xl font-bold text-red-600">{{ sinStock }}</p>
      </div>
      <div class="rounded-lg border-l-4 border-orange-500 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Bajo Mínimo</p>
        <p class="text-2xl font-bold text-orange-600">{{ bajoMinimo }}</p>
      </div>
    </div>

    <div class="flex flex-col justify-between gap-4 rounded-t-lg border-b border-gray-200 bg-white p-4 shadow-sm md:flex-row">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar ítem..."
        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-1/3"
      />
      <select v-model="filtroAlmacen" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
        <option value="">Todos los almacenes</option>
        <option v-for="a in almacenesUnicos" :key="a" :value="a">{{ a }}</option>
      </select>
    </div>

    <div class="overflow-x-auto rounded-b-lg bg-white shadow-md">
      <table class="min-w-full leading-normal">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
            <th class="px-4 py-3 text-left font-semibold">Código</th>
            <th class="px-4 py-3 text-left font-semibold">Ítem</th>
            <th class="px-4 py-3 text-left font-semibold">Almacén</th>
            <th class="px-4 py-3 text-left font-semibold">Lote</th>
            <th class="px-4 py-3 text-right font-semibold">Stock</th>
            <th class="px-4 py-3 text-right font-semibold">Mínimo</th>
            <th class="px-4 py-3 text-center font-semibold">Alerta</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-700">
          <tr
            v-for="e in existenciasFiltradas"
            :key="e.id"
            class="border-b border-gray-100 hover:bg-gray-50"
            :class="e.stock === 0 && 'opacity-75'"
          >
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ e.codigo }}</td>
            <td class="px-4 py-3 font-medium">{{ e.item_nombre }}</td>
            <td class="px-4 py-3 text-gray-600">{{ e.almacen_nombre }}</td>
            <td class="px-4 py-3 text-xs" :class="e.lote ? 'text-gray-500' : 'italic text-gray-400'">
              {{ e.lote ?? '—' }}
            </td>
            <td
              class="px-4 py-3 text-right font-bold"
              :class="e.stock === 0 ? 'text-red-600' : e.stock < e.minimo ? 'text-orange-600' : 'text-gray-800'"
            >
              {{ e.stock.toFixed(4) }}
            </td>
            <td class="px-4 py-3 text-right text-gray-500">{{ e.minimo.toFixed(4) }}</td>
            <td class="px-4 py-3 text-center">
              <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="alerta(e).class">
                {{ alerta(e).label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
        <span class="text-xs text-gray-500">Mostrando {{ existenciasFiltradas.length }} registros</span>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Vista funcional con datos en memoria — el backend aún no expone rutas para este módulo.
    </p>
  </div>
</template>
