<script setup>
import { reactive, ref, computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

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
  <section>
    <div class="mb-6 flex items-center justify-between">
      <p class="text-sm text-slate-500">Almacenes del SEDEDE y sus subdivisiones físicas.</p>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo almacén</button>
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Nombre / Jerarquía</th>
            <th class="px-4 py-3">Responsable</th>
            <th class="px-4 py-3">Principal</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="almacen in store.almacenes" :key="almacen.id">
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ almacen.codigo }}</td>
            <td class="px-4 py-3">
              <p class="font-medium text-ink">{{ almacen.nombre }}</p>
              <p class="text-xs text-slate-400">{{ store.almacenRutaCompleta(almacen.id) }}</p>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ almacen.responsable ?? '—' }}</td>
            <td class="px-4 py-3">
              <span v-if="almacen.es_principal" class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Principal</span>
              <span v-else class="text-xs text-slate-400">—</span>
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="almacen.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
                {{ almacen.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="mr-3 text-xs font-semibold text-slate-500 hover:underline" @click="openEditModal(almacen)">Editar</button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="almacen.activo ? 'text-red-600' : 'text-teal-700'"
                @click="store.toggleAlmacenActivo(almacen.id)"
              >
                {{ almacen.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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
  </section>
</template>
