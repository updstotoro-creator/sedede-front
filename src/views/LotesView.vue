<script setup>
import { reactive, ref, computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

const busqueda = ref('')
const filtroVencimiento = ref('')

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

const lotesFiltrados = computed(() => {
  const hoy = new Date()
  const en30dias = new Date(hoy)
  en30dias.setDate(hoy.getDate() + 30)

  return store.lotes.filter((l) => {
    const q = busqueda.value.toLowerCase()
    const coincideBusqueda = !busqueda.value ||
      l.numero_lote.toLowerCase().includes(q) ||
      l.item_nombre.toLowerCase().includes(q)

    let coincideVencimiento = true
    if (filtroVencimiento.value === 'sin_vencimiento') {
      coincideVencimiento = !l.fecha_vencimiento
    } else if (filtroVencimiento.value === 'por_vencer') {
      if (!l.fecha_vencimiento) coincideVencimiento = false
      else {
        const v = new Date(l.fecha_vencimiento)
        coincideVencimiento = v >= hoy && v <= en30dias
      }
    } else if (filtroVencimiento.value === 'vencido') {
      coincideVencimiento = l.fecha_vencimiento && new Date(l.fecha_vencimiento) < hoy
    }

    return coincideBusqueda && coincideVencimiento
  })
})

function estadoVencimiento(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  const en30dias = new Date(hoy)
  en30dias.setDate(hoy.getDate() + 30)
  const v = new Date(fecha)
  if (v < hoy) return 'vencido'
  if (v <= en30dias) return 'por_vencer'
  return 'vigente'
}

function resetForm() {
  form.item_nombre = ''
  form.numero_lote = ''
  form.fecha_fabricacion = ''
  form.fecha_vencimiento = ''
  form.stock = 0
  form.observaciones = ''
}

function openCreateModal() {
  editing.value = null
  resetForm()
  showModal.value = true
}

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
  const payload = {
    ...form,
    fecha_fabricacion: form.fecha_fabricacion || null,
    fecha_vencimiento: form.fecha_vencimiento || null,
    observaciones: form.observaciones || null,
  }
  if (editing.value) {
    store.updateLote(editing.value.id, payload)
  } else {
    store.addLote(payload)
  }
  closeModal()
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Catálogo de Lotes</h1>
        <p class="text-sm text-gray-500">Lotes con control de fabricación y vencimiento</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Nuevo Lote
      </button>
    </div>

    <div class="flex flex-col justify-between gap-4 rounded-t-lg border-b border-gray-200 bg-white p-4 shadow-sm md:flex-row">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por número de lote o ítem..."
        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-1/3"
      />
      <select v-model="filtroVencimiento" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
        <option value="">Todos los vencimientos</option>
        <option value="por_vencer">Por vencer (30 días)</option>
        <option value="vencido">Vencidos</option>
        <option value="sin_vencimiento">Sin vencimiento</option>
      </select>
    </div>

    <div class="overflow-x-auto rounded-b-lg bg-white shadow-md">
      <table class="min-w-full leading-normal">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
            <th class="px-4 py-3 text-left font-semibold">Ítem</th>
            <th class="px-4 py-3 text-left font-semibold">N° Lote</th>
            <th class="px-4 py-3 text-left font-semibold">Fabricación</th>
            <th class="px-4 py-3 text-left font-semibold">Vencimiento</th>
            <th class="px-4 py-3 text-right font-semibold">Stock</th>
            <th class="px-4 py-3 text-center font-semibold">Estado</th>
            <th class="px-4 py-3 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-700">
          <tr
            v-for="lote in lotesFiltrados"
            :key="lote.id"
            class="border-b border-gray-100 hover:bg-gray-50"
            :class="!lote.activo && 'opacity-75'"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ lote.item_nombre }}</td>
            <td class="px-4 py-3 font-mono text-xs">{{ lote.numero_lote }}</td>
            <td class="px-4 py-3 text-gray-600">{{ lote.fecha_fabricacion ?? '—' }}</td>
            <td class="px-4 py-3">
              <template v-if="lote.fecha_vencimiento">
                <span
                  :class="estadoVencimiento(lote.fecha_vencimiento) === 'vencido' ? 'font-semibold text-red-600'
                    : estadoVencimiento(lote.fecha_vencimiento) === 'por_vencer' ? 'font-semibold text-orange-600'
                    : 'text-gray-700'"
                >{{ lote.fecha_vencimiento }}</span>
                <span
                  v-if="estadoVencimiento(lote.fecha_vencimiento) === 'vigente'"
                  class="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                >Vigente</span>
                <span
                  v-else-if="estadoVencimiento(lote.fecha_vencimiento) === 'por_vencer'"
                  class="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700"
                >Por vencer</span>
                <span
                  v-else
                  class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                >Vencido</span>
              </template>
              <span v-else class="italic text-gray-500">Sin vencimiento</span>
            </td>
            <td class="px-4 py-3 text-right font-semibold text-gray-800">{{ lote.stock.toFixed(4) }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="rounded-full px-2 py-1 text-xs font-semibold"
                :class="lote.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ lote.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button class="mr-2 text-xs font-medium text-blue-600 hover:text-blue-800" @click="openEditModal(lote)">Editar</button>
              <button
                class="text-xs font-medium"
                :class="lote.activo ? 'text-red-600 hover:text-red-800' : 'cursor-not-allowed text-gray-400'"
                @click="lote.activo && store.toggleLoteActivo(lote.id)"
              >
                {{ lote.activo ? 'Eliminar' : '—' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
        <span class="text-xs text-gray-500">Mostrando {{ lotesFiltrados.length }} registros</span>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Vista funcional con datos en memoria — el backend aún no expone rutas para este módulo.
    </p>

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
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
