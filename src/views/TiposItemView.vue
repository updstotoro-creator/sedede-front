<script setup>
import { reactive, ref, computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

const naturalezas = [
  { value: 'consumible', label: 'Consumible' },
  { value: 'activo_fijo', label: 'Activo Fijo' },
  { value: 'herramienta', label: 'Herramienta' },
]

const busqueda = ref('')
const filtroNaturaleza = ref('')
const filtroEstado = ref('')

const showModal = ref(false)
const editing = ref(null)
const form = reactive({
  codigo: '',
  nombre: '',
  descripcion: '',
  padre_id: '',
  naturaleza: 'consumible',
  controla_lote: false,
  controla_vencimiento: false,
})

const opcionesPadre = computed(() =>
  store.tiposItem.filter((t) => !editing.value || t.id !== editing.value.id)
)

const tiposFiltrados = computed(() => {
  return store.tiposItem.filter((t) => {
    const coincideBusqueda = !busqueda.value ||
      t.codigo.toLowerCase().includes(busqueda.value.toLowerCase()) ||
      t.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
    const coincideNaturaleza = !filtroNaturaleza.value || t.naturaleza === filtroNaturaleza.value
    const coincideEstado = filtroEstado.value === '' ||
      (filtroEstado.value === 'activo' && t.activo) ||
      (filtroEstado.value === 'inactivo' && !t.activo)
    return coincideBusqueda && coincideNaturaleza && coincideEstado
  })
})

function esHijo(tipo) {
  return tipo.padre_id !== null && tipo.padre_id !== undefined
}

function resetForm() {
  form.codigo = ''
  form.nombre = ''
  form.descripcion = ''
  form.padre_id = ''
  form.naturaleza = 'consumible'
  form.controla_lote = false
  form.controla_vencimiento = false
}

function openCreateModal() {
  editing.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(tipo) {
  editing.value = tipo
  form.codigo = tipo.codigo
  form.nombre = tipo.nombre
  form.descripcion = tipo.descripcion ?? ''
  form.padre_id = tipo.padre_id ?? ''
  form.naturaleza = tipo.naturaleza
  form.controla_lote = tipo.controla_lote
  form.controla_vencimiento = tipo.controla_vencimiento
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

function submitForm() {
  const payload = { ...form, padre_id: form.padre_id ? Number(form.padre_id) : null }
  if (editing.value) {
    store.updateTipoItem(editing.value.id, payload)
  } else {
    store.addTipoItem(payload)
  }
  closeModal()
}

const naturalezaBadge = (value) => {
  const map = {
    consumible: 'bg-yellow-100 text-yellow-700',
    activo_fijo: 'bg-blue-100 text-blue-700',
    herramienta: 'bg-purple-100 text-purple-700',
  }
  return map[value] ?? 'bg-slate-100 text-slate-700'
}

const naturalezaLabel = (value) => naturalezas.find((n) => n.value === value)?.label ?? value
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Catálogo de Tipos de Ítem</h1>
        <p class="text-sm text-gray-500">Categorías para clasificar los bienes de la sede</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Nuevo Tipo
      </button>
    </div>

    <div class="flex flex-col justify-between gap-4 rounded-t-lg border-b border-gray-200 bg-white p-4 shadow-sm md:flex-row">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por código o nombre..."
        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-1/3"
      />
      <div class="flex gap-2">
        <select v-model="filtroNaturaleza" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
          <option value="">Todas las naturalezas</option>
          <option v-for="n in naturalezas" :key="n.value" :value="n.value">{{ n.label }}</option>
        </select>
        <select v-model="filtroEstado" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>
    </div>

    <div class="overflow-x-auto rounded-b-lg bg-white shadow-md">
      <table class="min-w-full leading-normal">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
            <th class="px-4 py-3 text-left font-semibold">Código</th>
            <th class="px-4 py-3 text-left font-semibold">Nombre</th>
            <th class="px-4 py-3 text-left font-semibold">Naturaleza</th>
            <th class="px-4 py-3 text-center font-semibold">Lote</th>
            <th class="px-4 py-3 text-center font-semibold">Vencimiento</th>
            <th class="px-4 py-3 text-center font-semibold">Estado</th>
            <th class="px-4 py-3 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-700">
          <tr
            v-for="tipo in tiposFiltrados"
            :key="tipo.id"
            class="border-b border-gray-100 hover:bg-gray-50"
            :class="[
              esHijo(tipo) && 'bg-gray-50/50',
              !tipo.activo && 'opacity-75',
            ]"
          >
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ tipo.codigo }}</td>
            <td
              class="px-4 py-3 font-medium text-gray-900"
              :class="esHijo(tipo) && 'border-l-2 border-blue-200 pl-8'"
            >
              <span v-if="esHijo(tipo)" class="mr-2 text-gray-400">↳</span>
              {{ tipo.nombre }}
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="naturalezaBadge(tipo.naturaleza)">
                {{ naturalezaLabel(tipo.naturaleza) }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <span v-if="tipo.controla_lote" class="text-lg font-bold text-green-500">✓</span>
              <span v-else class="text-lg font-bold text-red-400">✗</span>
            </td>
            <td class="px-4 py-3 text-center">
              <span v-if="tipo.controla_vencimiento" class="text-lg font-bold text-green-500">✓</span>
              <span v-else class="text-lg font-bold text-red-400">✗</span>
            </td>
            <td class="px-4 py-3 text-center">
              <span
                class="rounded-full px-2 py-1 text-xs font-semibold"
                :class="tipo.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ tipo.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button class="mr-2 text-xs font-medium text-blue-600 hover:text-blue-800" @click="openEditModal(tipo)">Editar</button>
              <button
                class="text-xs font-medium"
                :class="tipo.activo ? 'text-red-600 hover:text-red-800' : 'cursor-not-allowed text-gray-400'"
                @click="tipo.activo && store.toggleTipoItemActivo(tipo.id)"
              >
                {{ tipo.activo ? 'Eliminar' : '—' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
        <span class="text-xs text-gray-500">Mostrando {{ tiposFiltrados.length }} registros</span>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Vista funcional con datos en memoria — el backend aún no expone rutas para este módulo.
    </p>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editing ? 'Editar tipo de ítem' : 'Nuevo tipo de ítem' }}</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Código</label>
              <input v-model="form.codigo" type="text" class="input-field" required />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Naturaleza</label>
              <select v-model="form.naturaleza" class="input-field">
                <option v-for="n in naturalezas" :key="n.value" :value="n.value">{{ n.label }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
            <input v-model="form.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Descripción</label>
            <input v-model="form.descripcion" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Tipo padre (opcional)</label>
            <select v-model="form.padre_id" class="input-field">
              <option value="">— Ninguno (categoría raíz) —</option>
              <option v-for="opcion in opcionesPadre" :key="opcion.id" :value="opcion.id">{{ store.tipoRutaCompleta(opcion.id) }}</option>
            </select>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input v-model="form.controla_lote" type="checkbox" class="rounded border-slate-300" />
              Controla lote
            </label>
            <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input v-model="form.controla_vencimiento" type="checkbox" class="rounded border-slate-300" />
              Controla vencimiento
            </label>
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
