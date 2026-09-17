<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { inventarioService } from '../services/inventarioService'

const almacenes = ref([])
const status = ref('idle')
const errorMessage = ref('')

const showModal = ref(false)
const editing = ref(null)
const formError = ref('')
const saving = ref(false)
const form = reactive({
  codigo: '',
  nombre: '',
  descripcion: '',
  ubicacion: '',
  padre_id: '',
  responsable_id: '',
  es_principal: false,
})

const opcionesPadre = computed(() =>
  almacenes.value.filter((a) => !editing.value || a.id !== editing.value.id)
)

function rutaCompleta(id) {
  const camino = []
  let actual = almacenes.value.find((a) => a.id === Number(id))
  while (actual) {
    camino.unshift(actual.nombre)
    actual = almacenes.value.find((a) => a.id === actual.padre_id)
  }
  return camino.join(' > ')
}

async function loadAlmacenes() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    almacenes.value = await inventarioService.listAlmacenes()
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = mapListError(error)
  }
}

function mapListError(error) {
  if (error.response?.status === 403) return 'No tienes permisos para ver los almacenes.'
  if (!error.response) return 'No se pudo conectar con el servidor.'
  return 'Ocurrió un error al cargar los almacenes.'
}

function resetForm() {
  form.codigo = ''
  form.nombre = ''
  form.descripcion = ''
  form.ubicacion = ''
  form.padre_id = ''
  form.responsable_id = ''
  form.es_principal = false
  formError.value = ''
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
  form.responsable_id = almacen.responsable_id ?? ''
  form.es_principal = almacen.es_principal
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

async function submitForm() {
  saving.value = true
  formError.value = ''
  const payload = {
    ...form,
    padre_id: form.padre_id ? Number(form.padre_id) : null,
    responsable_id: form.responsable_id ? Number(form.responsable_id) : null,
  }
  try {
    if (editing.value) {
      await inventarioService.updateAlmacen(editing.value.id, payload)
    } else {
      await inventarioService.createAlmacen(payload)
    }
    closeModal()
    await loadAlmacenes()
  } catch (error) {
    formError.value = mapFormError(error)
  } finally {
    saving.value = false
  }
}

async function toggleActivo(almacen) {
  try {
    await inventarioService.updateAlmacen(almacen.id, { activo: !almacen.activo })
    await loadAlmacenes()
  } catch (error) {
    errorMessage.value = mapListError(error)
  }
}

function mapFormError(error) {
  const status = error.response?.status
  if (status === 422) {
    const errors = error.response.data?.errors
    if (errors) return Object.values(errors).flat().join(' ')
    return 'Revisa los datos ingresados.'
  }
  if (status === 403) return 'No tienes permisos para esta acción.'
  if (!error.response) return 'No se pudo conectar con el servidor.'
  return 'Ocurrió un error al guardar. Intenta nuevamente.'
}

onMounted(loadAlmacenes)
</script>

<template>
  <section>
    <div class="mb-6 flex items-center justify-between">
      <p class="text-sm text-slate-500">Almacenes del SEDEDE y sus subdivisiones físicas.</p>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo almacén</button>
    </div>

    <div v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">Cargando almacenes…</div>
    <div v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
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
          <tr v-for="almacen in almacenes" :key="almacen.id">
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ almacen.codigo }}</td>
            <td class="px-4 py-3">
              <p class="font-medium text-ink">{{ almacen.nombre }}</p>
              <p class="text-xs text-slate-400">{{ rutaCompleta(almacen.id) }}</p>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ almacen.responsable?.name ?? '—' }}</td>
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
                @click="toggleActivo(almacen)"
              >
                {{ almacen.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!almacenes.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">No hay almacenes registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editing ? 'Editar almacén' : 'Nuevo almacén' }}</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Código</label>
              <input v-model="form.codigo" type="text" class="input-field" required :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Ubicación</label>
              <input v-model="form.ubicacion" type="text" class="input-field" :disabled="saving" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
            <input v-model="form.nombre" type="text" class="input-field" required :disabled="saving" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Descripción</label>
            <input v-model="form.descripcion" type="text" class="input-field" :disabled="saving" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Almacén padre (opcional)</label>
            <select v-model="form.padre_id" class="input-field" :disabled="saving">
              <option value="">— Ninguno (almacén raíz) —</option>
              <option v-for="opcion in opcionesPadre" :key="opcion.id" :value="opcion.id">{{ rutaCompleta(opcion.id) }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">ID de usuario responsable (opcional)</label>
            <input v-model="form.responsable_id" type="number" min="1" placeholder="Ej: 1" class="input-field" :disabled="saving" />
          </div>
          <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input v-model="form.es_principal" type="checkbox" class="rounded border-slate-300" :disabled="saving" />
            Es el almacén principal
          </label>
          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{{ formError }}</div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" :disabled="saving" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

