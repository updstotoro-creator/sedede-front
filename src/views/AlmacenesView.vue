<script setup>
import { reactive, ref, computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

const busqueda = ref('')
const filtroEstado = ref('')

const showModal = ref(false)
const editing = ref(null)
const form = reactive({
  codigo: '',
  nombre: '',
  descripcion: '',
  ubicacion: '',
  padre_id: '',
  responsable: '',
  es_principal: false,
})

const opcionesPadre = computed(() =>
  store.almacenes.filter((a) => !editing.value || a.id !== editing.value.id)
)

const almacenesFiltrados = computed(() => {
  return store.almacenes.filter((a) => {
    const q = busqueda.value.toLowerCase()
    const coincideBusqueda = !busqueda.value ||
      a.codigo.toLowerCase().includes(q) ||
      a.nombre.toLowerCase().includes(q) ||
      (a.ubicacion ?? '').toLowerCase().includes(q)
    const coincideEstado = filtroEstado.value === '' ||
      (filtroEstado.value === 'activo' && a.activo) ||
      (filtroEstado.value === 'inactivo' && !a.activo)
    return coincideBusqueda && coincideEstado
  })
})

function esHijo(almacen) {
  return almacen.padre_id !== null && almacen.padre_id !== undefined
}

function iniciales(nombre) {
  if (!nombre) return '—'
  return nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function resetForm() {
  form.codigo = ''
  form.nombre = ''
  form.descripcion = ''
  form.ubicacion = ''
  form.padre_id = ''
  form.responsable = ''
  form.es_principal = false
}

function openCreateModal() {
  editing.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(almacen) {
  editing.value = almacen
  form.codigo = almacen.codigo
  form.nombre = almacen.nombre
  form.descripcion = almacen.descripcion ?? ''
  form.ubicacion = almacen.ubicacion ?? ''
  form.padre_id = almacen.padre_id ?? ''
  form.responsable = almacen.responsable ?? ''
  form.es_principal = almacen.es_principal
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

function submitForm() {
  const payload = { ...form, padre_id: form.padre_id ? Number(form.padre_id) : null }
  if (editing.value) {
    store.updateAlmacen(editing.value.id, payload)
  } else {
    store.addAlmacen(payload)
  }
  closeModal()
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Catálogo de Almacenes</h1>
        <p class="text-sm text-gray-500">Almacenes y ambientes de la sede y sus subsedes</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Nuevo Almacén
      </button>
    </div>

    <div class="flex flex-col justify-between gap-4 rounded-t-lg border-b border-gray-200 bg-white p-4 shadow-sm md:flex-row">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por código, nombre o ubicación..."
        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-1/3"
      />
      <select v-model="filtroEstado" class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
        <option value="">Todos los estados</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>
    </div>

    <div class="overflow-x-auto rounded-b-lg bg-white shadow-md">
      <table class="min-w-full leading-normal">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
            <th class="px-4 py-3 text-left font-semibold">Código</th>
            <th class="px-4 py-3 text-left font-semibold">Nombre</th>
            <th class="px-4 py-3 text-left font-semibold">Ubicación</th>
            <th class="px-4 py-3 text-left font-semibold">Responsable</th>
            <th class="px-4 py-3 text-center font-semibold">Principal</th>
            <th class="px-4 py-3 text-center font-semibold">Estado</th>
            <th class="px-4 py-3 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-700">
          <tr
            v-for="almacen in almacenesFiltrados"
            :key="almacen.id"
            class="border-b border-gray-100 hover:bg-gray-50"
            :class="[
              esHijo(almacen) && 'bg-gray-50/50',
              !almacen.activo && 'opacity-75',
            ]"
          >
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ almacen.codigo }}</td>
            <td
              class="px-4 py-3 font-medium text-gray-900"
              :class="esHijo(almacen) && 'border-l-2 border-blue-200 pl-8'"
            >
              <span v-if="esHijo(almacen)" class="mr-2 text-gray-400">↳</span>
              {{ almacen.nombre }}
              <span
                v-if="almacen.es_principal"
                class="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-yellow-700"
              >Principal</span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ almacen.ubicacion ?? '—' }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="almacen.responsable ? 'bg-blue-500' : 'bg-gray-400'"
                >
                  {{ iniciales(almacen.responsable) }}
                </div>
                <span v-if="almacen.responsable">{{ almacen.responsable }}</span>
                <span v-else class="italic text-gray-400">Sin asignar</span>
              </div>
            </td>
            <td class="px-4 py-3 text-center">
              <span v-if="almacen.es_principal" class="text-lg font-bold text-yellow-500">★</span>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-4 py-3 text-center">
              <span
                class="rounded-full px-2 py-1 text-xs font-semibold"
                :class="almacen.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ almacen.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button class="mr-2 text-xs font-medium text-blue-600 hover:text-blue-800" @click="openEditModal(almacen)">Editar</button>
              <button
                class="text-xs font-medium"
                :class="almacen.activo ? 'text-red-600 hover:text-red-800' : 'cursor-not-allowed text-gray-400'"
                @click="almacen.activo && store.toggleAlmacenActivo(almacen.id)"
              >
                {{ almacen.activo ? 'Eliminar' : '—' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
        <span class="text-xs text-gray-500">Mostrando {{ almacenesFiltrados.length }} registros</span>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Vista funcional con datos en memoria — el backend aún no expone rutas para este módulo.
    </p>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editing ? 'Editar almacén' : 'Nuevo almacén' }}</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Código</label>
              <input v-model="form.codigo" type="text" class="input-field" required />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Ubicación</label>
              <input v-model="form.ubicacion" type="text" class="input-field" />
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
            <label class="mb-1 block text-xs font-semibold text-slate-600">Almacén padre (opcional)</label>
            <select v-model="form.padre_id" class="input-field">
              <option value="">— Ninguno (almacén raíz) —</option>
              <option v-for="opcion in opcionesPadre" :key="opcion.id" :value="opcion.id">{{ store.almacenRutaCompleta(opcion.id) }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Responsable</label>
            <input v-model="form.responsable" type="text" placeholder="Nombre del responsable" class="input-field" />
          </div>
          <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input v-model="form.es_principal" type="checkbox" class="rounded border-slate-300" />
            Es el almacén principal
          </label>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
