<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { asociacionService } from '../services/asociacionService'

const router = useRouter()
const asociaciones = ref([])
const status = ref('idle')
const errorMessage = ref('')

const showModal = ref(false)
const editingAsociacion = ref(null)
const formError = ref('')
const saving = ref(false)

const form = reactive({
  nombre: '',
  nit: '',
  sigla: '',
  personeria_juridica: '',
  nivel: 'Departamental',
  tipo_disciplina: 'conjunto',
  telefono: '',
  correo: '',
  direccion: '',
})

function resetForm() {
  form.nombre = ''
  form.nit = ''
  form.sigla = ''
  form.personeria_juridica = ''
  form.nivel = 'Departamental'
  form.tipo_disciplina = 'conjunto'
  form.telefono = ''
  form.correo = ''
  form.direccion = ''
  formError.value = ''
}

async function loadAsociaciones() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const data = await asociacionService.list()
    asociaciones.value = data
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Error al cargar las asociaciones.'
  }
}

function verClubes(asociacion) {
  router.push(`/dashboard/asociaciones/${asociacion.id}`)
}

function openCreateModal() {
  editingAsociacion.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(asociacion) {
  editingAsociacion.value = asociacion
  form.nombre = asociacion.nombre
  form.nit = asociacion.nit
  form.sigla = asociacion.sigla || ''
  form.personeria_juridica = asociacion.personeria_juridica || ''
  form.nivel = asociacion.nivel || 'Departamental'
  form.tipo_disciplina = asociacion.tipo_disciplina || 'conjunto'
  form.telefono = asociacion.telefono || ''
  form.correo = asociacion.correo || ''
  form.direccion = asociacion.direccion || ''
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingAsociacion.value = null
}

async function submitForm() {
  saving.value = true
  formError.value = ''
  try {
    if (editingAsociacion.value) {
      await asociacionService.update(editingAsociacion.value.id, { ...form })
    } else {
      await asociacionService.create({ ...form })
    }
    closeModal()
    await loadAsociaciones()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Revise los campos requeridos.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar la asociación.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(asociacion) {
  try {
    if (asociacion.activo) {
      await asociacionService.delete(asociacion.id)
    } else {
      await asociacionService.reactivar(asociacion.id)
    }
    await loadAsociaciones()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar el estado de la asociación.')
  }
}

onMounted(() => {
  loadAsociaciones()
})
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="font-display text-xl font-bold text-ink">Padrón de Asociaciones</h2>
        <p class="text-xs text-slate-500">Asociaciones deportivas registradas en el departamento de Chuquisaca</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Nueva Asociación</button>
    </div>

    <div v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">
      Cargando asociaciones…
    </div>

    <div v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Asociación</th>
            <th class="px-4 py-3">NIT / Sigla</th>
            <th class="px-4 py-3">Nivel / Tipo</th>
            <th class="px-4 py-3">Estado Legal</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="asociacion in asociaciones" :key="asociacion.id" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <div class="font-semibold text-ink">{{ asociacion.nombre }}</div>
              <div class="text-xs text-slate-500">{{ asociacion.correo || asociacion.telefono || 'Sin datos de contacto' }}</div>
            </td>
            <td class="px-4 py-3 text-slate-600">
              <div>NIT: {{ asociacion.nit }}</div>
              <div class="text-xs text-slate-400">Sigla: {{ asociacion.sigla || '—' }}</div>
            </td>
            <td class="px-4 py-3 text-slate-600">
              <span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {{ asociacion.nivel || 'Departamental' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-teal-100 text-teal-800': asociacion.estado_legal === 'Vigente',
                  'bg-amber-100 text-amber-800': asociacion.estado_legal === 'Pendiente',
                  'bg-red-100 text-red-800': asociacion.estado_legal === 'Suspendido' || asociacion.estado_legal === 'Cancelado'
                }"
              >
                {{ asociacion.estado_legal }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="asociacion.activo ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ asociacion.activo ? 'Activa' : 'Baja Lógica' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="verClubes(asociacion)">
                Clubes →
              </button>
              <button class="text-xs font-semibold text-slate-600 hover:underline" @click="openEditModal(asociacion)">
                Editar
              </button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="asociacion.activo ? 'text-red-600' : 'text-teal-700'"
                @click="toggleActive(asociacion)"
              >
                {{ asociacion.activo ? 'Dar de Baja' : 'Reactivar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!asociaciones.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">No hay asociaciones registradas.</td>
          </tr>
          <tr v-if="!store.asociaciones.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">No hay asociaciones registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear / Editar Asociación -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">
          {{ editingAsociacion ? 'Editar Asociación' : 'Nueva Asociación' }}
        </h3>

        <form class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre de la Asociación *</label>
            <input v-model="form.nombre" type="text" class="input-field" placeholder="ej. Asociación Departamental de Fútbol" required :disabled="saving" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">NIT *</label>
              <input v-model="form.nit" type="text" class="input-field" placeholder="ej. 1028374901" required :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Sigla</label>
              <input v-model="form.sigla" type="text" class="input-field" placeholder="ej. ADF" :disabled="saving" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Nivel</label>
              <select v-model="form.nivel" class="input-field" :disabled="saving">
                <option value="Departamental">Departamental</option>
                <option value="Municipal">Municipal</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Tipo de Disciplina</label>
              <select v-model="form.tipo_disciplina" class="input-field" :disabled="saving">
                <option value="conjunto">Conjunto</option>
                <option value="individual">Individual</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">N° Personería Jurídica</label>
            <input v-model="form.personeria_juridica" type="text" class="input-field" placeholder="ej. Res. Adm. 123/2020" :disabled="saving" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Teléfono</label>
              <input v-model="form.telefono" type="text" class="input-field" placeholder="ej. 64-12345" :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Correo Electrónico</label>
              <input v-model="form.correo" type="email" class="input-field" placeholder="ej. contacto@futbol.bo" :disabled="saving" />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Dirección / Sede</label>
            <input v-model="form.direccion" type="text" class="input-field" placeholder="ej. Av. Jaime Mendoza #450" :disabled="saving" />
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700" :disabled="saving" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

