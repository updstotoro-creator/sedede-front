<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { asociacionService } from '../services/asociacionService'
import clubesService from '../services/clubesService'

const router = useRouter()
const clubes = ref([])
const asociaciones = ref([])
const status = ref('idle')
const errorMessage = ref('')

const search = ref('')
const filterAsociacion = ref('')

const showModal = ref(false)
const editingClub = ref(null)
const formError = ref('')
const saving = ref(false)

const form = reactive({
  asociacion_id: '',
  nombre: '',
  sigla: '',
  personeria_juridica: '',
  fecha_eleccion_directiva: '',
})

const clubesFiltrados = computed(() => {
  const term = search.value.trim().toLowerCase()
  return clubes.value.filter((club) => {
    if (filterAsociacion.value && String(club.asociacion_id) !== String(filterAsociacion.value)) return false
    if (!term) return true
    return [club.nombre, club.sigla, club.asociacion?.nombre]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term))
  })
})

function disciplinasDe(club) {
  const list = club.asociacion?.disciplinas
  if (!list) return '—'
  const arr = Array.isArray(list) ? list : [list]
  return arr.length ? arr.join(', ') : '—'
}

function resetForm() {
  form.asociacion_id = ''
  form.nombre = ''
  form.sigla = ''
  form.personeria_juridica = ''
  form.fecha_eleccion_directiva = ''
  formError.value = ''
}

async function loadData() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const [asoc, clbs] = await Promise.all([
      asociacionService.list(),
      clubesService.listarTodas(),
    ])
    asociaciones.value = asoc
    clubes.value = clbs
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Error al cargar los clubes.'
  }
}

function openCreateModal() {
  editingClub.value = null
  resetForm()
  form.asociacion_id = filterAsociacion.value || (asociaciones.value[0]?.id ?? '')
  showModal.value = true
}

function openEditModal(club) {
  editingClub.value = club
  form.asociacion_id = club.asociacion_id
  form.nombre = club.nombre
  form.sigla = club.sigla || ''
  form.personeria_juridica = club.personeria_juridica || ''
  form.fecha_eleccion_directiva = (club.fecha_eleccion_directiva || '').slice(0, 10)
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingClub.value = null
}

async function submitForm() {
  saving.value = true
  formError.value = ''
  try {
    // El backend toma la asociación de la ruta, sólo se envían los campos del club.
    const payload = {
      nombre: form.nombre.trim(),
      sigla: form.sigla.trim() || null,
      personeria_juridica: form.personeria_juridica.trim() || null,
      fecha_eleccion_directiva: form.fecha_eleccion_directiva || null,
    }
    if (editingClub.value) {
      await clubesService.actualizar(editingClub.value.asociacion_id, editingClub.value.id, payload)
    } else {
      await clubesService.crear(Number(form.asociacion_id), payload)
    }
    closeModal()
    await loadData()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Revise los campos requeridos.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar el club.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(club) {
  try {
    if (club.activo) {
      await clubesService.inactivar(club.asociacion_id, club.id)
    } else {
      await clubesService.reactivar(club.asociacion_id, club.id)
    }
    await loadData()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar el estado del club.')
  }
}

function verDetalle(club) {
  router.push(`/dashboard/asociaciones/${club.asociacion_id}/clubes/${club.id}`)
}

onMounted(loadData)
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="font-display text-xl font-bold text-ink">Clubes</h2>
        <p class="text-xs text-slate-500">Listado global de clubes afiliados a las asociaciones deportivas.</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo Club</button>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="text"
        class="input-field max-w-xs"
        placeholder="Buscar por nombre, sigla o asociación…"
      />
      <select v-model="filterAsociacion" class="input-field max-w-xs">
        <option value="">Todas las asociaciones</option>
        <option v-for="a in asociaciones" :key="a.id" :value="String(a.id)">
          {{ a.nombre }}
        </option>
      </select>
    </div>

    <div v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">
      Cargando clubes…
    </div>

    <div v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Club</th>
            <th class="px-4 py-3">Asociación</th>
            <th class="px-4 py-3">Disciplina</th>
            <th class="px-4 py-3">Personería Jurídica</th>
            <th class="px-4 py-3">Fecha Elección</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="club in clubesFiltrados" :key="`${club.asociacion_id}-${club.id}`" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <div class="font-semibold text-ink">{{ club.nombre }}</div>
              <div class="text-xs text-slate-500">Sigla: {{ club.sigla || '—' }}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-slate-700">{{ club.asociacion?.nombre || '—' }}</div>
              <div class="text-xs text-slate-400">{{ club.asociacion?.sigla || '' }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {{ disciplinasDe(club) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ club.personeria_juridica || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">
              {{ club.fecha_eleccion_directiva ? new Date(club.fecha_eleccion_directiva).toLocaleDateString('es-BO') : '—' }}
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="club.activo ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ club.activo ? 'Afiliado' : 'Baja Lógica' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="verDetalle(club)">
                Detalle →
              </button>
              <button class="text-xs font-semibold text-slate-600 hover:underline" @click="openEditModal(club)">
                Editar
              </button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="club.activo ? 'text-red-600' : 'text-teal-700'"
                @click="toggleActive(club)"
              >
                {{ club.activo ? 'Dar de Baja' : 'Reactivar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!clubesFiltrados.length">
            <td colspan="7" class="px-4 py-8 text-center text-slate-400">No hay clubes registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear / Editar Club -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">
          {{ editingClub ? 'Editar Club' : 'Nuevo Club' }}
        </h3>

        <form class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Asociación *</label>
            <select v-model="form.asociacion_id" class="input-field" required :disabled="saving || !!editingClub">
              <option value="" disabled>Seleccione una asociación</option>
              <option v-for="a in asociaciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre del Club *</label>
            <input v-model="form.nombre" type="text" class="input-field" placeholder="ej. Club Deportivo Municipal" required :disabled="saving" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Sigla</label>
              <input v-model="form.sigla" type="text" class="input-field" placeholder="ej. CDM" :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">N° Personería Jurídica</label>
              <input v-model="form.personeria_juridica" type="text" class="input-field" placeholder="ej. Res. Adm. 45/2021" :disabled="saving" />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Fecha de Elección de Directiva</label>
            <input v-model="form.fecha_eleccion_directiva" type="date" class="input-field" :disabled="saving" />
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
