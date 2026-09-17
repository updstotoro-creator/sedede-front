<script setup>
import { ref, reactive, onMounted } from 'vue'
import { tramiteService } from '../services/tramiteService'
import { deportistaService } from '../services/deportistaService'

const tramites = ref([])
const deportistas = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const filterEstado = ref('')

const showModal = ref(false)
const showEvaluarModal = ref(false)
const selectedTramite = ref(null)

const saving = ref(false)
const formError = ref('')

const form = reactive({
  deportista_id: '',
  tipo_solicitud: 'Apoyo Económico',
  evento_nombre: '',
  monto_solicitado: '',
})

const evaluarForm = reactive({
  estado: 'En Revisión Técnica',
  unidad_actual: 'Coordinación Deportiva',
  monto_aprobado: '',
  observaciones: '',
})

function resetForm() {
  form.deportista_id = ''
  form.tipo_solicitud = 'Apoyo Económico'
  form.evento_nombre = ''
  form.monto_solicitado = ''
  formError.value = ''
}

async function fetchTramites() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const params = filterEstado.value ? { estado: filterEstado.value } : {}
    const res = await tramiteService.list(params)
    tramites.value = res.items || res
  } catch (e) {
    errorMessage.value = e.response?.data?.error || 'Error al cargar trámites'
  } finally {
    isLoading.value = false
  }
}

async function fetchDeportistas() {
  try {
    const res = await deportistaService.list()
    deportistas.value = res.items || []
  } catch (e) {
    console.error('Error cargando deportistas:', e)
  }
}

function openCreateModal() {
  resetForm()
  showModal.value = true
}

function openEvaluarModal(t) {
  selectedTramite.value = t
  evaluarForm.estado = t.estado === 'Registrada' ? 'En Revisión Técnica' : t.estado
  evaluarForm.unidad_actual = t.unidad_actual || 'Coordinación Deportiva'
  evaluarForm.monto_aprobado = t.monto_aprobado || t.monto_solicitado
  evaluarForm.observaciones = t.observaciones || ''
  formError.value = ''
  showEvaluarModal.value = true
}

function closeModals() {
  showModal.value = false
  showEvaluarModal.value = false
  selectedTramite.value = null
}

async function crearTramite() {
  saving.value = true
  formError.value = ''
  try {
    await tramiteService.create({ ...form })
    closeModals()
    await fetchTramites()
  } catch (e) {
    if (e.response?.status === 422) {
      const errors = e.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Complete todos los campos.'
    } else {
      formError.value = e.response?.data?.error || 'Error al registrar la solicitud'
    }
  } finally {
    saving.value = false
  }
}

async function guardarEvaluacion() {
  saving.value = true
  formError.value = ''
  try {
    await tramiteService.evaluar(selectedTramite.value.id, { ...evaluarForm })
    closeModals()
    await fetchTramites()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Error al actualizar estado del trámite'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchTramites()
  fetchDeportistas()
})
</script>

<template>
  <div class="mt-8">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-brand-700">Trámites y Solicitudes de Apoyo Deportivo</h1>
        <p class="text-sm text-slate-500">Expedientes digitales y seguimiento del flujo institucional SEDEDE</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="filterEstado" class="input-field text-xs w-48" @change="fetchTramites">
          <option value="">Todos los Estados</option>
          <option value="Registrada">Registradas</option>
          <option value="En Revisión Técnica">En Revisión Técnica</option>
          <option value="Observada / Subsanación">Observadas</option>
          <option value="Aprobada">Aprobadas</option>
          <option value="Pagada">Pagadas</option>
          <option value="Rechazada">Rechazadas</option>
        </select>
        <button class="btn-primary" @click="openCreateModal">+ Nueva Solicitud</button>
      </div>
    </div>

    <!-- Indicador visual del Workflow simplificado de 4 Pasos -->
    <div class="mb-8 grid gap-3 sm:grid-cols-4">
      <div class="rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs">
        <span class="font-bold text-brand-700">Paso 1: Registro</span>
        <p class="text-slate-600">Deportista en el padrón RUN y cuenta SIGEP</p>
      </div>
      <div class="rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs">
        <span class="font-bold text-brand-700">Paso 2: Solicitud</span>
        <p class="text-slate-600">Presentación de 6 requisitos y código de expediente</p>
      </div>
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
        <span class="font-bold text-amber-800">Paso 3: Evaluación SEDEDE</span>
        <p class="text-slate-600">Revisión Técnica/Jurídica y Aprobación</p>
      </div>
      <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
        <span class="font-bold text-emerald-800">Paso 4: Pago y Cierre</span>
        <p class="text-slate-600">Certificación presupuestaria y desembolso</p>
      </div>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando expedientes digitales...</div>
    <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="space-y-4">
      <div v-for="t in tramites" :key="t.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <div>
            <span class="font-mono text-xs font-bold text-brand-700">{{ t.codigo_tramite }}</span>
            <h2 class="font-display text-base font-bold text-slate-900">{{ t.evento_nombre }}</h2>
            <p class="text-xs text-slate-500">
              Solicitante: <strong class="text-slate-700">{{ t.deportista?.nombres }} {{ t.deportista?.apellidos }}</strong>
              ({{ t.deportista?.disciplina || 'Atleta SEDEDE' }})
            </p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span class="block text-xs font-semibold text-slate-400">Solicitado / Aprobado</span>
              <span class="font-mono text-sm font-bold text-brand-700">
                Bs {{ Number(t.monto_solicitado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}
                <span v-if="t.monto_aprobado" class="text-emerald-700"> (Bs {{ Number(t.monto_aprobado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }})</span>
              </span>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="{
                'bg-blue-100 text-blue-800': t.estado === 'Registrada',
                'bg-amber-100 text-amber-800': t.estado.includes('Observada'),
                'bg-purple-100 text-purple-800': t.estado === 'En Revisión Técnica',
                'bg-emerald-100 text-emerald-800': t.estado === 'Aprobada' || t.estado === 'Pagada',
                'bg-red-100 text-red-800': t.estado === 'Rechazada',
              }"
            >
              {{ t.estado }}
            </span>
            <button class="btn-primary py-1 px-3 text-xs bg-slate-800 hover:bg-slate-900 border-none" @click="openEvaluarModal(t)">
              Evaluar / Actualizar
            </button>
          </div>
        </div>

        <div class="mt-3 flex flex-col justify-between text-xs text-slate-600 sm:flex-row sm:items-center">
          <p>Unidad Actual: <strong class="text-slate-800">{{ t.unidad_actual }}</strong></p>
          <p v-if="t.observaciones" class="mt-1 font-medium text-amber-700 sm:mt-0">Observaciones: {{ t.observaciones }}</p>
        </div>

        <div v-if="t.documentos_adjuntos" class="mt-3 rounded bg-slate-50 p-3 text-xs">
          <p class="mb-1.5 font-bold text-slate-700">Requisitos Presentados ({{ t.documentos_adjuntos.length }} de 6):</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="(doc, idx) in t.documentos_adjuntos" :key="idx" class="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">
              ✓ {{ doc }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="!tramites.length" class="p-8 text-center text-slate-400 border border-dashed rounded-xl">
        No hay trámites de apoyo registrados.
      </div>
    </div>

    <!-- Modal para Nueva Solicitud -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-brand-700">Nueva Solicitud de Apoyo Deportivo</h3>
        
        <form class="space-y-4" @submit.prevent="crearTramite">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Deportista Solicitante *</label>
            <select v-model="form.deportista_id" class="input-field text-sm" required :disabled="saving">
              <option value="" disabled>Seleccione deportista...</option>
              <option v-for="d in deportistas" :key="d.id" :value="d.id">
                {{ d.nombres }} {{ d.apellidos }} (CI: {{ d.ci }} - {{ d.disciplina }})
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Tipo de Solicitud</label>
            <select v-model="form.tipo_solicitud" class="input-field text-sm" :disabled="saving">
              <option value="Apoyo Económico">Apoyo Económico (Competencia / Viaje)</option>
              <option value="Premio por Logro">Premio por Logro Obtenido</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Evento / Campeonato Deportivo *</label>
            <input v-model="form.evento_nombre" type="text" placeholder="Ej. Juegos Panamericanos 2026" class="input-field text-sm" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Monto Solicitado (Bs) *</label>
            <input v-model="form.monto_solicitado" type="number" placeholder="Ej. 3500.00" class="input-field text-sm" required :disabled="saving" />
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Registrando…' : 'Registrar Trámite' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Evaluar / Cambiar Estado de Trámite -->
    <div v-if="showEvaluarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-1 font-display text-lg font-bold text-brand-700">Evaluar Trámite {{ selectedTramite?.codigo_tramite }}</h3>
        <p class="mb-4 text-xs text-slate-500">{{ selectedTramite?.evento_nombre }}</p>

        <form class="space-y-4" @submit.prevent="guardarEvaluacion">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Nuevo Estado *</label>
            <select v-model="evaluarForm.estado" class="input-field text-sm" required :disabled="saving">
              <option value="En Revisión Técnica">En Revisión Técnica</option>
              <option value="Observada / Subsanación">Observada (Requiere Subsanación)</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Pagada">Pagada / Desembolsada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Archivada">Archivada</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Unidad Responsable Actual</label>
            <input v-model="evaluarForm.unidad_actual" type="text" placeholder="ej. Dirección Técnica / Unidad Financiera" class="input-field text-sm" :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Monto Aprobado (Bs)</label>
            <input v-model="evaluarForm.monto_aprobado" type="number" placeholder="Monto final aprobado" class="input-field text-sm" :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Observaciones / Dictamen</label>
            <textarea v-model="evaluarForm.observaciones" rows="3" class="input-field text-sm" placeholder="Detalle técnico o motivo de la observación..." :disabled="saving"></textarea>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Guardando…' : 'Actualizar Estado' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
