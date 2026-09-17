<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { deportistaService } from '../services/deportistaService'
import { asociacionService } from '../services/asociacionService'

const deportistas = ref([])
const asociaciones = ref([])
const clubesParaAsociacion = ref([])

const meta = ref(null)
const currentPage = ref(1)
const isLoading = ref(true)
const search = ref('')
const errorMessage = ref('')

const showModal = ref(false)
const editingDeportista = ref(null)
const formError = ref('')
const saving = ref(false)

const form = reactive({
  nombres: '',
  apellidos: '',
  ci: '',
  expedido: 'CH',
  fecha_expiracion_ci: '',
  fecha_nacimiento: '',
  direccion: '',
  telefono: '',
  sexo: 'M',
  asociacion_id: '',
  club_id: '',
  categoria: 'Élite',
  sigep_cuenta: '',
  ranking_nacional: '',
  tutor_nombre: '',
  tutor_ci: '',
  tutor_telefono: '',
})

// Cálculo dinámico de edad y si es menor de edad (< 18 años)
const edadCalculada = computed(() => {
  if (!form.fecha_nacimiento) return null
  const dob = new Date(form.fecha_nacimiento)
  if (isNaN(dob.getTime())) return null
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
})

const esMenorDeEdad = computed(() => {
  return edadCalculada.value !== null && edadCalculada.value < 18
})

// Cargar clubes al cambiar de asociación seleccionada
watch(() => form.asociacion_id, async (newAsocId) => {
  clubesParaAsociacion.value = []
  if (newAsocId) {
    try {
      clubesParaAsociacion.value = await asociacionService.listClubes(newAsocId)
    } catch {
      clubesParaAsociacion.value = []
    }
  }
})

function resetForm() {
  form.nombres = ''
  form.apellidos = ''
  form.ci = ''
  form.expedido = 'CH'
  form.fecha_expiracion_ci = ''
  form.fecha_nacimiento = ''
  form.direccion = ''
  form.telefono = ''
  form.sexo = 'M'
  form.asociacion_id = ''
  form.club_id = ''
  form.categoria = 'Élite'
  form.sigep_cuenta = ''
  form.ranking_nacional = ''
  form.tutor_nombre = ''
  form.tutor_ci = ''
  form.tutor_telefono = ''
  formError.value = ''
  clubesParaAsociacion.value = []
}

async function loadInitialData() {
  try {
    asociaciones.value = await asociacionService.list()
  } catch (e) {
    console.error('Error cargando asociaciones:', e)
  }
}

async function fetchDeportistas(page = 1) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await deportistaService.list({ search: search.value, page })
    deportistas.value = res.items
    meta.value = res.meta
    currentPage.value = page
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Error al cargar los deportistas.'
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  editingDeportista.value = null
  resetForm()
  showModal.value = true
}

async function openEditModal(dep) {
  editingDeportista.value = dep
  form.nombres = dep.nombres
  form.apellidos = dep.apellidos
  form.ci = dep.ci
  form.expedido = dep.expedido || 'CH'
  form.fecha_expiracion_ci = dep.fecha_expiracion_ci ? dep.fecha_expiracion_ci.split('T')[0] : ''
  form.fecha_nacimiento = dep.fecha_nacimiento ? dep.fecha_nacimiento.split('T')[0] : ''
  form.direccion = dep.direccion || ''
  form.telefono = dep.telefono || ''
  form.sexo = dep.sexo || 'M'
  form.asociacion_id = dep.asociacion_id || ''
  form.club_id = dep.club_id || ''
  form.categoria = dep.categoria || 'Élite'
  form.sigep_cuenta = dep.sigep_cuenta || ''
  form.ranking_nacional = dep.ranking_nacional || ''
  form.tutor_nombre = dep.tutor_nombre || ''
  form.tutor_ci = dep.tutor_ci || ''
  form.tutor_telefono = dep.tutor_telefono || ''
  formError.value = ''

  if (dep.asociacion_id) {
    try {
      clubesParaAsociacion.value = await asociacionService.listClubes(dep.asociacion_id)
    } catch {
      clubesParaAsociacion.value = []
    }
  }

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingDeportista.value = null
}

async function submitForm() {
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form }
    if (editingDeportista.value) {
      await deportistaService.update(editingDeportista.value.id, payload)
    } else {
      await deportistaService.create(payload)
    }
    closeModal()
    await fetchDeportistas(currentPage.value)
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Verifique los campos ingresados.'
    } else {
      formError.value = error.response?.data?.message || error.response?.data?.error || 'Error al guardar deportista.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(dep) {
  try {
    if (dep.activo) {
      await deportistaService.delete(dep.id)
    } else {
      await deportistaService.reactivar(dep.id)
    }
    await fetchDeportistas(currentPage.value)
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar el estado del deportista.')
  }
}

onMounted(() => {
  loadInitialData()
  fetchDeportistas(1)
})
</script>

<template>
  <div class="mt-8">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-brand-700">Registro Único de Deportistas (RUN)</h1>
        <p class="text-sm text-slate-500">Padrón oficial de atletas competitivos y de alto rendimiento de Chuquisaca</p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, CI o disciplina..."
          class="input-field w-64 text-sm"
          @keyup.enter="fetchDeportistas(1)"
        />
        <button class="btn-primary" @click="fetchDeportistas(1)">Buscar</button>
        <button class="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none" @click="openCreateModal">+ Registrar Atleta</button>
      </div>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando padrón de deportistas...</div>
    <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Deportista</th>
            <th class="px-4 py-3">C.I. / Caducidad</th>
            <th class="px-4 py-3">Asociación / Club</th>
            <th class="px-4 py-3">Categoría</th>
            <th class="px-4 py-3">Cuenta SIGEP</th>
            <th class="px-4 py-3">Ranking</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="d in deportistas" :key="d.id" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <div class="font-semibold text-slate-900">
                {{ d.nombres }} {{ d.apellidos }}
                <span v-if="d.es_menor_de_edad" class="ml-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Menor de Edad</span>
              </div>
              <div class="text-xs text-slate-400">
                {{ d.telefono ? `Tel: ${d.telefono}` : 'Sin teléfono' }}
                <span v-if="d.direccion"> | {{ d.direccion }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="font-mono text-xs font-bold text-slate-800">{{ d.ci }} {{ d.expedido }}</div>
              <div class="text-[11px] text-slate-400">
                Exp: {{ d.fecha_expiracion_ci ? d.fecha_expiracion_ci.split('T')[0] : '—' }}
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-brand-700">{{ d.asociacion?.nombre || d.disciplina || 'Sin Asociación' }}</div>
              <div class="text-xs text-slate-500">Club: {{ d.club?.nombre || 'Independiente / Ninguno' }}</div>
            </td>
            <td class="px-4 py-3 text-slate-700">{{ d.categoria }}</td>
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ d.sigep_cuenta || 'Pendiente' }}</td>
            <td class="px-4 py-3 font-bold text-slate-800">#{{ d.ranking_nacional || '-' }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="d.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'">
                {{ d.activo ? 'Activo (Habilitado)' : 'Baja Lógica' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="openEditModal(d)">
                Editar
              </button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="d.activo ? 'text-red-600' : 'text-teal-700'"
                @click="toggleActive(d)"
              >
                {{ d.activo ? 'Inactivar' : 'Reactivar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!deportistas.length">
            <td colspan="8" class="px-4 py-8 text-center text-slate-400">No hay deportistas registrados.</td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
      <div v-if="meta" class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>Página {{ meta.current_page }} de {{ Math.ceil(meta.total / meta.per_page) || 1 }} · {{ meta.total }} deportistas</span>
        <div class="flex gap-2">
          <button
            class="rounded border border-slate-200 px-2.5 py-1 disabled:opacity-40"
            :disabled="meta.current_page <= 1"
            @click="fetchDeportistas(meta.current_page - 1)"
          >
            Anterior
          </button>
          <button
            class="rounded border border-slate-200 px-2.5 py-1 disabled:opacity-40"
            :disabled="meta.current_page * meta.per_page >= meta.total"
            @click="fetchDeportistas(meta.current_page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Crear / Editar Deportista (Formulario Completo RUN) -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        <div class="mb-4 border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h3 class="font-display text-lg font-bold text-ink">
              {{ editingDeportista ? 'Editar Expediente Deportista' : 'Registrar Nuevo Deportista (RUN)' }}
            </h3>
            <p class="text-xs text-slate-500">Datos personales, Cédula de Identidad y Adscripción Institucional</p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 font-bold" @click="closeModal">✕</button>
        </div>

        <form class="space-y-4" @submit.prevent="submitForm">
          <!-- Sección 1: Datos Personales e Identidad -->
          <div class="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wide text-brand-700">1. Identidad y Documentación</h4>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Nombres *</label>
                <input v-model="form.nombres" type="text" class="input-field" placeholder="ej. Pedro Antonio" required :disabled="saving" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Apellidos *</label>
                <input v-model="form.apellidos" type="text" class="input-field" placeholder="ej. López Chumacero" required :disabled="saving" />
              </div>
            </div>

            <div class="grid grid-cols-4 gap-3">
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-semibold text-slate-600">N° Cédula de Identidad *</label>
                <input v-model="form.ci" type="text" class="input-field" placeholder="ej. 7482844" required :disabled="saving" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Expedido *</label>
                <select v-model="form.expedido" class="input-field" required :disabled="saving">
                  <option value="CH">CH (Chuquisaca)</option>
                  <option value="LP">LP (La Paz)</option>
                  <option value="CB">CB (Cochabamba)</option>
                  <option value="SC">SC (Santa Cruz)</option>
                  <option value="OR">OR (Oruro)</option>
                  <option value="PT">PT (Potosí)</option>
                  <option value="TJ">TJ (Tarija)</option>
                  <option value="BE">BE (Beni)</option>
                  <option value="PD">PD (Pando)</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Fecha Caducidad CI</label>
                <input v-model="form.fecha_expiracion_ci" type="date" class="input-field text-xs" :disabled="saving" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Fecha de Nacimiento *</label>
                <input v-model="form.fecha_nacimiento" type="date" class="input-field text-xs" required :disabled="saving" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Sexo *</label>
                <select v-model="form.sexo" class="input-field" required :disabled="saving">
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Teléfono / Celular</label>
                <input v-model="form.telefono" type="text" class="input-field" placeholder="ej. 71234567" :disabled="saving" />
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Domicilio / Dirección</label>
              <input v-model="form.direccion" type="text" class="input-field" placeholder="ej. Cll. José Manuel Mercado S/N Z. Villa La Plata - Sucre" :disabled="saving" />
            </div>
          </div>

          <!-- Alerta / Sección para Menores de Edad -->
          <div v-if="esMenorDeEdad" class="rounded-lg bg-amber-50 p-4 border border-amber-200 space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">Menor de Edad ({{ edadCalculada }} años)</span>
              <span class="text-xs text-amber-800">Se requiere el registro obligatorio del Tutor Legal</span>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-1">
                <label class="mb-1 block text-xs font-semibold text-amber-900">Nombre del Tutor *</label>
                <input v-model="form.tutor_nombre" type="text" class="input-field" placeholder="ej. Roberto López" :required="esMenorDeEdad" :disabled="saving" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-amber-900">CI del Tutor *</label>
                <input v-model="form.tutor_ci" type="text" class="input-field" placeholder="ej. 3652148 CH" :required="esMenorDeEdad" :disabled="saving" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-amber-900">Teléfono Tutor *</label>
                <input v-model="form.tutor_telefono" type="text" class="input-field" placeholder="ej. 71158963" :required="esMenorDeEdad" :disabled="saving" />
              </div>
            </div>
          </div>

          <!-- Sección 2: Afiliación Deportiva (Asociación y Club) -->
          <div class="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wide text-brand-700">2. Adscripción Institucional</h4>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Asociación Departamental *</label>
                <select v-model="form.asociacion_id" class="input-field" required :disabled="saving">
                  <option value="" disabled>Seleccione Asociación...</option>
                  <option v-for="asoc in asociaciones" :key="asoc.id" :value="asoc.id">
                    {{ asoc.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Club Deportivo Afiliado</label>
                <select v-model="form.club_id" class="input-field" :disabled="saving || !form.asociacion_id">
                  <option value="">Independiente / Ninguno</option>
                  <option v-for="club in clubesParaAsociacion" :key="club.id" :value="club.id">
                    {{ club.nombre }} {{ club.sigla ? `(${club.sigla})` : '' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Categoría</label>
                <input v-model="form.categoria" type="text" class="input-field" placeholder="ej. Élite / Juvenil" :disabled="saving" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">N° Cuenta SIGEP</label>
                <input v-model="form.sigep_cuenta" type="text" class="input-field" placeholder="ej. 100000458921" :disabled="saving" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Ranking Deptal/Nac</label>
                <input v-model="form.ranking_nacional" type="number" class="input-field" placeholder="ej. 1" :disabled="saving" />
              </div>
            </div>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700" :disabled="saving" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar Expediente' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
