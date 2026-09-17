<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { inventarioService } from '../services/inventarioService'

const tiposItem = ref([])
const status = ref('idle') // idle | loading | error
const errorMessage = ref('')

const naturalezas = [
  { value: 'consumible', label: 'Consumible' },
  { value: 'activo_fijo', label: 'Activo fijo' },
  { value: 'herramienta', label: 'Herramienta' },
]

const showModal = ref(false)
const editing = ref(null)
const formError = ref('')
const saving = ref(false)
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
  tiposItem.value.filter((t) => !editing.value || t.id !== editing.value.id)
)

// Arma "Deportivo > Balones > Fútbol" a partir de padre_id
function rutaCompleta(id) {
  const camino = []
  let actual = tiposItem.value.find((t) => t.id === Number(id))
  while (actual) {
    camino.unshift(actual.nombre)
    actual = tiposItem.value.find((t) => t.id === actual.padre_id)
  }
  return camino.join(' > ')
}

async function loadTiposItem() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    tiposItem.value = await inventarioService.listTiposItem()
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = mapListError(error)
  }
}

function mapListError(error) {
  if (error.response?.status === 403) return 'No tienes permisos para ver los tipos de ítem.'
  if (!error.response) return 'No se pudo conectar con el servidor.'
  return 'Ocurrió un error al cargar los tipos de ítem.'
}

function resetForm() {
  form.codigo = ''
  form.nombre = ''
  form.descripcion = ''
  form.padre_id = ''
  form.naturaleza = 'consumible'
  form.controla_lote = false
  form.controla_vencimiento = false
  formError.value = ''
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
  const payload = { ...form, padre_id: form.padre_id ? Number(form.padre_id) : null }
  try {
    if (editing.value) {
      await inventarioService.updateTipoItem(editing.value.id, payload)
    } else {
      await inventarioService.createTipoItem(payload)
    }
    closeModal()
    await loadTiposItem()
  } catch (error) {
    formError.value = mapFormError(error)
  } finally {
    saving.value = false
  }
}

async function toggleActivo(tipo) {
  try {
    await inventarioService.updateTipoItem(tipo.id, { activo: !tipo.activo })
    await loadTiposItem()
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

const naturalezaLabel = (value) => naturalezas.find((n) => n.value === value)?.label ?? value

onMounted(loadTiposItem)
</script>

<template>
  <section>
    <div class="mb-6 flex items-center justify-between">
      <p class="text-sm text-slate-500">Catálogo jerárquico de tipos de ítem del inventario.</p>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo tipo</button>
    </div>

    <div v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">Cargando tipos de ítem…</div>
    <div v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Nombre / Jerarquía</th>
            <th class="px-4 py-3">Naturaleza</th>
            <th class="px-4 py-3">Controla</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="tipo in tiposItem" :key="tipo.id">
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ tipo.codigo }}</td>
            <td class="px-4 py-3">
              <p class="font-medium text-ink">{{ tipo.nombre }}</p>
              <p class="text-xs text-slate-400">{{ rutaCompleta(tipo.id) }}</p>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ naturalezaLabel(tipo.naturaleza) }}</td>
            <td class="px-4 py-3 text-xs text-slate-500">
              <span v-if="tipo.controla_lote">Lote</span>
              <span v-if="tipo.controla_lote && tipo.controla_vencimiento"> · </span>
              <span v-if="tipo.controla_vencimiento">Vencimiento</span>
              <span v-if="!tipo.controla_lote && !tipo.controla_vencimiento">—</span>
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="tipo.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
                {{ tipo.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="mr-3 text-xs font-semibold text-slate-500 hover:underline" @click="openEditModal(tipo)">Editar</button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="tipo.activo ? 'text-red-600' : 'text-teal-700'"
                @click="toggleActivo(tipo)"
              >
                {{ tipo.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!tiposItem.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">No hay tipos de ítem registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editing ? 'Editar tipo de ítem' : 'Nuevo tipo de ítem' }}</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Código</label>
              <input v-model="form.codigo" type="text" class="input-field" required :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Naturaleza</label>
              <select v-model="form.naturaleza" class="input-field" :disabled="saving">
                <option v-for="n in naturalezas" :key="n.value" :value="n.value">{{ n.label }}</option>
              </select>
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
            <label class="mb-1 block text-xs font-semibold text-slate-600">Tipo padre (opcional)</label>
            <select v-model="form.padre_id" class="input-field" :disabled="saving">
              <option value="">— Ninguno (categoría raíz) —</option>
              <option v-for="opcion in opcionesPadre" :key="opcion.id" :value="opcion.id">{{ rutaCompleta(opcion.id) }}</option>
            </select>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input v-model="form.controla_lote" type="checkbox" class="rounded border-slate-300" :disabled="saving" />
              Controla lote
            </label>
            <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input v-model="form.controla_vencimiento" type="checkbox" class="rounded border-slate-300" :disabled="saving" />
              Controla vencimiento
            </label>
          </div>
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

