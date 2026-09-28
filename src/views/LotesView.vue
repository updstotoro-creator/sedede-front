<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

const busqueda = ref('')
const filtroVencimiento = ref('')
const filtroItem = ref('')
const pagina = ref(1)
const porPagina = 5

const showModal = ref(false)
const editing = ref(null)
const form = reactive({
  item_nombre: '',
  numero_lote: '',
  fecha_fabricacion: '',
  fecha_vencimiento: '',
  stock: 0,
  observaciones: '',
})

const categorias = computed(() => {
  const set = new Set(
    store.lotes.map((l) => (l.item_nombre ?? '').split(' - ')[0]).filter(Boolean)
  )
  return [...set].sort()
})

function aFechaLocal(fecha) {
  return fecha ? new Date(`${fecha}T00:00:00`) : null
}

function diasRestantes(fecha) {
  const v = aFechaLocal(fecha)
  if (!v) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((v - hoy) / 86400000)
}

function alertaLote(lote) {
  if (!lote.fecha_vencimiento) {
    return {
      cod: 'sin',
      label: 'Sin vencimiento',
      badge: 'bg-gray-100 text-gray-600 border-gray-300',
      texto: 'italic text-gray-400',
    }
  }
  const dias = diasRestantes(lote.fecha_vencimiento)
  if (dias < 0) {
    return {
      cod: 'vencido',
      label: 'Vencido',
      badge: 'bg-red-100 text-red-700 border-red-300',
      texto: 'font-semibold text-red-600',
    }
  }
  if (dias <= 30) {
    return {
      cod: 'por_vencer',
      label: dias === 0 ? 'Por vencer (hoy)' : `Por vencer (${dias} ${dias === 1 ? 'día' : 'días'})`,
      badge: 'bg-orange-100 text-orange-700 border-orange-300',
      texto: 'font-semibold text-orange-600',
    }
  }
  if (dias <= 60) {
    return {
      cod: 'proximo',
      label: `Próximo (${dias} días)`,
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      texto: 'font-semibold text-yellow-700',
    }
  }
  return {
    cod: 'vigente',
    label: 'Vigente',
    badge: 'bg-green-100 text-green-700 border-green-300',
    texto: 'text-gray-700',
  }
}

function fmtFecha(fecha) {
  if (!fecha) return null
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

const resumen = computed(() => {
  const lotes = store.lotes
  return {
    total: lotes.length,
    porVencer: lotes.filter((l) => alertaLote(l).cod === 'por_vencer').length,
    vencidos: lotes.filter((l) => alertaLote(l).cod === 'vencido').length,
    sinVencimiento: lotes.filter((l) => alertaLote(l).cod === 'sin').length,
  }
})

const lotesFiltrados = computed(() => {
  return store.lotes.filter((l) => {
    const q = busqueda.value.toLowerCase()
    const coincideBusqueda = !busqueda.value ||
      (l.numero_lote ?? '').toLowerCase().includes(q) ||
      (l.item_nombre ?? '').toLowerCase().includes(q)

    const cod = alertaLote(l).cod
    const coincideVencimiento = !filtroVencimiento.value ||
      (filtroVencimiento.value === 'por_vencer' && cod === 'por_vencer') ||
      (filtroVencimiento.value === 'vencido' && cod === 'vencido') ||
      (filtroVencimiento.value === 'sin_vencimiento' && cod === 'sin')

    const coincideItem = !filtroItem.value ||
      (l.item_nombre ?? '').startsWith(`${filtroItem.value} - `)

    return coincideBusqueda && coincideVencimiento && coincideItem
  })
})

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(lotesFiltrados.value.length / porPagina))
)

const lotesPagina = computed(() => {
  const inicio = (pagina.value - 1) * porPagina
  return lotesFiltrados.value.slice(inicio, inicio + porPagina)
})

watch([busqueda, filtroVencimiento, filtroItem], () => {
  pagina.value = 1
})

watch(totalPaginas, (total) => {
  if (pagina.value > total) pagina.value = total
})

function openEditModal(lote) {
  editing.value = lote
  form.item_nombre = lote.item_nombre
  form.numero_lote = lote.numero_lote
  form.fecha_fabricacion = lote.fecha_fabricacion ?? ''
  form.fecha_vencimiento = lote.fecha_vencimiento ?? ''
  form.stock = lote.stock
  form.observaciones = lote.observaciones ?? ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

function submitForm() {
  if (!editing.value) return
  store.updateLote(editing.value.id, {
    ...form,
    fecha_fabricacion: form.fecha_fabricacion || null,
    fecha_vencimiento: form.fecha_vencimiento || null,
    observaciones: form.observaciones || null,
  })
  closeModal()
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <!-- Tarjeta título + botón -->
    <div class="mb-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-800">Registro y Listado de Lotes</h2>
          <p class="mt-1 text-sm text-gray-500">Control de lotes con alerta de próximos a vencer</p>
        </div>
        <router-link
          to="/dashboard/inventario/lotes/nuevo"
          class="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-800"
        >
          <span class="text-lg leading-none">+</span> Registrar Nuevo Lote
        </router-link>
      </div>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="rounded-xl border-l-4 border-blue-500 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Total Lotes</p>
        <p class="text-2xl font-bold text-gray-800">{{ resumen.total }}</p>
      </div>
      <div class="rounded-xl border-l-4 border-orange-500 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Por Vencer</p>
        <p class="text-2xl font-bold text-orange-600">{{ resumen.porVencer }}</p>
      </div>
      <div class="rounded-xl border-l-4 border-red-500 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Vencidos</p>
        <p class="text-2xl font-bold text-red-600">{{ resumen.vencidos }}</p>
      </div>
      <div class="rounded-xl border-l-4 border-gray-400 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase text-gray-500">Sin Vencimiento</p>
        <p class="text-2xl font-bold text-gray-600">{{ resumen.sinVencimiento }}</p>
      </div>
    </div>

    <!-- Tarjeta tabla -->
    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <!-- Filtros -->
      <div class="flex flex-col justify-between gap-3 border-b border-gray-100 p-4 md:flex-row">
        <div class="relative w-full md:w-1/3">
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por N° de lote o ítem..."
            class="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
          />
          <svg class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div class="flex gap-2">
          <select v-model="filtroVencimiento" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
            <option value="">Todos los vencimientos</option>
            <option value="por_vencer">Por vencer (30 días)</option>
            <option value="vencido">Vencidos</option>
            <option value="sin_vencimiento">Sin vencimiento</option>
          </select>
          <select v-model="filtroItem" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
            <option value="">Todos los ítems</option>
            <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <!-- Tabla -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-semibold">Ítem</th>
              <th class="px-4 py-3 text-left font-semibold">N° Lote</th>
              <th class="px-4 py-3 text-left font-semibold">Fabricación</th>
              <th class="px-4 py-3 text-left font-semibold">Vencimiento</th>
              <th class="px-4 py-3 text-right font-semibold">Stock</th>
              <th class="px-4 py-3 text-center font-semibold">Alerta</th>
              <th class="px-4 py-3 text-center font-semibold">Estado</th>
              <th class="px-4 py-3 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-gray-700">
            <tr
              v-for="lote in lotesPagina"
              :key="lote.id"
              class="border-b border-gray-100 transition-colors hover:bg-gray-50"
              :class="!lote.activo && 'opacity-75'"
            >
              <td class="px-4 py-3 font-medium text-gray-900">{{ lote.item_nombre }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ lote.numero_lote }}</td>
              <td class="px-4 py-3 text-gray-600">{{ fmtFecha(lote.fecha_fabricacion) ?? '—' }}</td>
              <td class="px-4 py-3">
                <span v-if="lote.fecha_vencimiento" :class="alertaLote(lote).texto">
                  {{ fmtFecha(lote.fecha_vencimiento) }}
                </span>
                <span v-else class="italic text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-right font-bold text-gray-800">{{ (lote.stock ?? 0).toFixed(4) }}</td>
              <td class="px-4 py-3 text-center">
                <span
                  class="rounded-full border px-2.5 py-1 text-xs font-semibold"
                  :class="alertaLote(lote).badge"
                >
                  {{ alertaLote(lote).label }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="lote.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
                  {{ lote.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <button class="mr-3 text-xs font-medium text-blue-600 hover:text-blue-800" @click="openEditModal(lote)">
                  Editar
                </button>
                <button
                  v-if="lote.activo"
                  class="text-xs font-medium text-red-600 hover:text-red-800"
                  @click="store.toggleLoteActivo(lote.id)"
                >
                  Eliminar
                </button>
                <span v-else class="cursor-not-allowed text-xs font-medium text-gray-300">Eliminar</span>
              </td>
            </tr>
            <tr v-if="!lotesPagina.length">
              <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-400">
                No se encontraron lotes con los filtros seleccionados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
        <span class="text-xs text-gray-500">
          Mostrando {{ lotesPagina.length }} de {{ lotesFiltrados.length }} registros
        </span>
        <div class="flex space-x-1">
          <button
            class="rounded border px-3 py-1 text-xs"
            :class="pagina === 1
              ? 'cursor-not-allowed border-gray-200 bg-white text-gray-300'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'"
            :disabled="pagina === 1"
            @click="pagina > 1 && pagina--"
          >
            Anterior
          </button>
          <button
            v-for="p in totalPaginas"
            :key="p"
            class="rounded border px-3 py-1 text-xs"
            :class="p === pagina
              ? 'border-red-600 bg-red-600 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'"
            @click="pagina = p"
          >
            {{ p }}
          </button>
          <button
            class="rounded border px-3 py-1 text-xs"
            :class="pagina === totalPaginas
              ? 'cursor-not-allowed border-gray-200 bg-white text-gray-300'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'"
            :disabled="pagina === totalPaginas"
            @click="pagina < totalPaginas && pagina++"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Nota al pie -->
    <div class="mt-4 border-l-4 border-orange-400 bg-orange-50 p-3 text-sm text-orange-800">
      <strong>Nota:</strong> Los lotes con vencimiento en los próximos 30 días se marcan en
      <span class="font-bold text-orange-700">naranja</span> como "Por vencer" y entre 31 y 60 días en
      <span class="font-bold text-yellow-700">amarillo</span> como "Próximo".
    </div>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editing ? 'Editar lote' : 'Nuevo lote' }}</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Ítem</label>
            <input v-model="form.item_nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">N° Lote</label>
            <input v-model="form.numero_lote" type="text" class="input-field" required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Fabricación</label>
              <input v-model="form.fecha_fabricacion" type="date" class="input-field" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Vencimiento</label>
              <input v-model="form.fecha_vencimiento" type="date" class="input-field" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Stock</label>
            <input v-model.number="form.stock" type="number" step="0.0001" min="0" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Observaciones</label>
            <input v-model="form.observaciones" type="text" class="input-field" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="closeModal">Cancelar</button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="!form.item_nombre.trim() || !form.numero_lote.trim()"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
