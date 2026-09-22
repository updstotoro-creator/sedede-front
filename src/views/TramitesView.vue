<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { tramiteService } from '../services/tramiteService'
import { deportistaService } from '../services/deportistaService'

const tramites = ref([])
const deportistas = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const filterEstado = ref('')

const showModal = ref(false)
const showExpedienteModal = ref(false)
const showDerivarModal = ref(false)

const selectedTramite = ref(null)
const expedienteDetalle = ref(null)
const activeTab = ref('resumen')

const saving = ref(false)
const formError = ref('')

// Formulario de Nueva Solicitud
const form = reactive({
  deportista_id: '',
  tipo_solicitud: 'Apoyo Económico',
  evento_nombre: '',
  fecha_evento: '',
  monto_solicitado: '',
  es_menor_edad: false,
  tutor_nombre: '',
  tutor_ci: '',
  cuenta_sigep: '',
  exencion_administrador: false,
})

// Formulario de Derivación
const derivarForm = reactive({
  etapa_destino: 4,
  unidad_destino: 'Deporte Competitivo',
  usuario_nombre: 'Revisor SEDEDE',
  accion: 'Derivación de Expediente',
  observaciones: '',
  monto_aprobado: '',
})

// Cálculo en vivo de la regla de los 15 días
const diasAnticipacion = computed(() => {
  if (!form.fecha_evento) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(form.fecha_evento + 'T00:00:00')
  const diffTime = fecha - hoy
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const esValido15Dias = computed(() => {
  if (diasAnticipacion.value === null) return true
  return diasAnticipacion.value >= 15 || form.exencion_administrador
})

// Observación de requisito individual
const requisitoObsForm = reactive({
  requisito_id: null,
  estado_validacion: 'Valido',
  observacion: '',
})
const showRequisitoObsModal = ref(false)

function resetForm() {
  const defaultFecha = new Date()
  defaultFecha.setDate(defaultFecha.getDate() + 20)
  
  form.deportista_id = ''
  form.tipo_solicitud = 'Apoyo Económico'
  form.evento_nombre = ''
  form.fecha_evento = defaultFecha.toISOString().split('T')[0]
  form.monto_solicitado = ''
  form.es_menor_edad = false
  form.tutor_nombre = ''
  form.tutor_ci = ''
  form.cuenta_sigep = ''
  form.exencion_administrador = false
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
    errorMessage.value = e.response?.data?.error || 'Error al cargar los trámites'
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

function onDeportistaChange() {
  const dep = deportistas.value.find(d => d.id === form.deportista_id)
  if (dep) {
    if (dep.fecha_nacimiento) {
      const hoy = new Date()
      const nac = new Date(dep.fecha_nacimiento)
      let edad = hoy.getFullYear() - nac.getFullYear()
      const m = hoy.getMonth() - nac.getMonth()
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
      form.es_menor_edad = edad < 18
    }
    form.cuenta_sigep = `SIGEP-BO-${dep.ci || '000'}`
  }
}

function openCreateModal() {
  resetForm()
  showModal.value = true
}

async function openExpediente(t) {
  selectedTramite.value = t
  activeTab.value = 'resumen'
  showExpedienteModal.value = true
  try {
    const res = await tramiteService.expediente(t.id)
    expedienteDetalle.value = res
  } catch (e) {
    console.error('Error al cargar expediente:', e)
  }
}

function openDerivarModal(t) {
  selectedTramite.value = t
  const etapaSiguiente = Math.min((t.etapa_actual || 1) + 1, 17)
  derivarForm.etapa_destino = etapaSiguiente
  derivarForm.unidad_destino = getNombreUnidadPorEtapa(etapaSiguiente)
  derivarForm.accion = 'Derivación de Expediente'
  derivarForm.observaciones = ''
  derivarForm.monto_aprobado = t.monto_aprobado || t.monto_solicitado
  formError.value = ''
  showDerivarModal.value = true
}

function getNombreUnidadPorEtapa(etapa) {
  const mapa = {
    1: 'Secretaría / Recepción',
    2: 'Secretaría / Recepción',
    3: 'Coordinación Deportiva',
    4: 'Deporte Competitivo',
    5: 'Deportista / Solicitante',
    6: 'Deporte Competitivo (Informe)',
    7: 'Dirección SEDEDE (Visto Bueno)',
    8: 'Asesoría Jurídica',
    9: 'Comisión Técnica',
    10: 'Dirección SEDEDE',
    11: 'Administración (Presupuestos)',
    12: 'Administración (Órdenes)',
    13: 'Contabilidad',
    14: 'Administración / Dirección (Firma)',
    15: 'Tesorería (Pago Priorizado)',
    16: 'Tesorería / Pagos',
    17: 'Archivo Digital SEDEDE',
  }
  return mapa[etapa] || 'Unidad Institucional'
}

function closeModals() {
  showModal.value = false
  showExpedienteModal.value = false
  showDerivarModal.value = false
  showRequisitoObsModal.value = false
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
      formError.value = e.response.data?.error || 'Verifique los datos del trámite.'
    } else {
      formError.value = e.response?.data?.error || 'Error al registrar el trámite'
    }
  } finally {
    saving.value = false
  }
}

async function ejecutarDerivacion() {
  saving.value = true
  formError.value = ''
  try {
    await tramiteService.derivar(selectedTramite.value.id, { ...derivarForm })
    closeModals()
    await fetchTramites()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Error al derivar'
  } finally {
    saving.value = false
  }
}

function openValidarRequisito(req) {
  requisitoObsForm.requisito_id = req.id
  requisitoObsForm.estado_validacion = req.estado_validacion || 'Valido'
  requisitoObsForm.observacion = req.observacion || ''
  showRequisitoObsModal.value = true
}

async function guardarValidacionRequisito() {
  saving.value = true
  try {
    await tramiteService.validarRequisito(selectedTramite.value.id, { ...requisitoObsForm })
    showRequisitoObsModal.value = false
    const res = await tramiteService.expediente(selectedTramite.value.id)
    expedienteDetalle.value = res
    await fetchTramites()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al guardar validación')
  } finally {
    saving.value = false
  }
}

const uploadingReqId = ref(null)

async function subirDocumentoRequisito(req, event) {
  const file = event.target.files[0]
  if (!file) return

  uploadingReqId.value = req.id
  try {
    await tramiteService.subirDocumento(selectedTramite.value.id, req.id, file)
    const res = await tramiteService.expediente(selectedTramite.value.id)
    expedienteDetalle.value = res
    await fetchTramites()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al subir el archivo.')
  } finally {
    uploadingReqId.value = null
  }
}

async function ejecutarSubsanacion() {
  saving.value = true
  try {
    await tramiteService.subsanar(selectedTramite.value.id, { observaciones: 'Requisitos corregidos.' })
    const res = await tramiteService.expediente(selectedTramite.value.id)
    expedienteDetalle.value = res
    await fetchTramites()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al subsanar')
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
  <div class="mt-8 space-y-6">
    <!-- Encabezado Módulo -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-brand-700">Trámites y Apoyos</h1>
        <p class="text-sm text-slate-500">Solicitudes y seguimiento de apoyos.</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="filterEstado" class="input-field text-xs w-48" @change="fetchTramites">
          <option value="">Todos los Estados</option>
          <option value="Registrada">Registradas</option>
          <option value="En Revisión Técnica">En Revisión Técnica</option>
          <option value="Observada / Subsanación">Observadas</option>
          <option value="Certificación Presupuestaria">Presupuesto</option>
          <option value="Pagada / Desembolsada">Pagadas</option>
        </select>
        <button class="btn-primary flex items-center gap-1" @click="openCreateModal">
          <span>+ Nueva Solicitud</span>
        </button>
      </div>
    </div>

    <!-- Mapa de Pasos del Procedimiento -->
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="mb-3 font-display text-xs font-bold uppercase tracking-wider text-slate-400">Pasos del Procedimiento</h3>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-6 text-center text-xs">
        <div class="rounded-lg bg-blue-50 border border-blue-200 p-2">
          <span class="block font-bold text-blue-800">1. Registro</span>
          <span class="text-[11px] text-blue-600">15 Días Antes</span>
        </div>
        <div class="rounded-lg bg-indigo-50 border border-indigo-200 p-2">
          <span class="block font-bold text-indigo-800">2. Revisión Técnica</span>
          <span class="text-[11px] text-indigo-600">Técnico SEDEDE</span>
        </div>
        <div class="rounded-lg bg-amber-50 border border-amber-200 p-2">
          <span class="block font-bold text-amber-800">3. Informe Jurídico</span>
          <span class="text-[11px] text-amber-600">Asesoría</span>
        </div>
        <div class="rounded-lg bg-purple-50 border border-purple-200 p-2">
          <span class="block font-bold text-purple-800">4. Presupuesto</span>
          <span class="text-[11px] text-purple-600">Certificación</span>
        </div>
        <div class="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
          <span class="block font-bold text-emerald-800">5. Pago</span>
          <span class="text-[11px] text-emerald-600">Tesorería</span>
        </div>
        <div class="rounded-lg bg-slate-100 border border-slate-300 p-2">
          <span class="block font-bold text-slate-800">6. Archivo</span>
          <span class="text-[11px] text-slate-600">Cierre</span>
        </div>
      </div>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando trámites...</div>
    <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <!-- Listado de Trámites -->
    <div v-else class="space-y-4">
      <div v-for="t in tramites" :key="t.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
        <div class="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800">{{ t.codigo_tramite }}</span>
              <span class="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Paso {{ t.etapa_actual }}</span>
              <span v-if="t.es_menor_edad" class="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Menor de Edad</span>
            </div>
            <h2 class="mt-1 font-display text-base font-bold text-slate-900">{{ t.evento_nombre }}</h2>
            <p class="text-xs text-slate-500">
              Solicitante: <strong class="text-slate-800">{{ t.deportista?.nombres }} {{ t.deportista?.apellidos }}</strong>
              <span v-if="t.deportista?.asociacion">({{ t.deportista.asociacion.nombre }})</span>
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-right">
              <span class="block text-xs font-semibold text-slate-400">Solicitado / Aprobado</span>
              <span class="font-mono text-sm font-bold text-brand-700">
                Bs {{ Number(t.monto_solicitado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}
                <span v-if="t.monto_aprobado" class="text-emerald-700">(Bs {{ Number(t.monto_aprobado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }})</span>
              </span>
            </div>

            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="{
                'bg-blue-100 text-blue-800': t.estado === 'Registrada',
                'bg-amber-100 text-amber-800': t.estado.includes('Observada'),
                'bg-purple-100 text-purple-800': t.estado.includes('Técnica') || t.estado.includes('Presupuestaria'),
                'bg-emerald-100 text-emerald-800': t.estado.includes('Aprobada') || t.estado.includes('Pagada'),
                'bg-red-100 text-red-800': t.estado === 'Rechazada',
              }"
            >
              {{ t.estado }}
            </span>

            <div class="flex items-center gap-2">
              <button class="btn-primary py-1 px-3 text-xs bg-brand-600 hover:bg-brand-700" @click="openExpediente(t)">
                Ver Expediente
              </button>
              <button class="btn-secondary py-1 px-3 text-xs text-slate-700 border-slate-300" @click="openDerivarModal(t)">
                Derivar →
              </button>
            </div>
          </div>
        </div>

        <div class="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
          <div>Unidad Actual: <strong class="text-slate-800">{{ t.unidad_actual }}</strong></div>
          <div>Fecha Evento: <strong class="text-slate-800">{{ t.fecha_evento ? new Date(t.fecha_evento).toLocaleDateString('es-BO') : 'N/A' }}</strong></div>
          <div v-if="t.observaciones" class="truncate font-medium text-amber-700">Obs: {{ t.observaciones }}</div>
        </div>

        <!-- Indicador de Requisitos -->
        <div v-if="t.requisitos && t.requisitos.length" class="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2 text-[11px]">
          <span class="font-semibold text-slate-500">Requisitos:</span>
          <span v-for="r in t.requisitos" :key="r.id" class="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
            :class="{
              'bg-emerald-100 text-emerald-800': r.estado_validacion === 'Valido' || r.estado_validacion === 'Subsanado',
              'bg-amber-100 text-amber-800': r.estado_validacion === 'Observado',
              'bg-slate-100 text-slate-600': r.estado_validacion === 'Pendiente'
            }"
          >
            <span>{{ r.estado_validacion === 'Valido' ? '✓' : r.estado_validacion === 'Observado' ? '⚠' : '•' }}</span>
            <span class="truncate max-w-[120px]">{{ r.requisito_nombre }}</span>
          </span>
        </div>
      </div>

      <div v-if="!tramites.length" class="p-8 text-center text-slate-400 border border-dashed rounded-xl">
        No hay trámites registrados.
      </div>
    </div>

    <!-- MODAL DE NUEVA SOLICITUD -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div class="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl my-8">
        <h3 class="mb-1 font-display text-lg font-bold text-brand-700">Nueva Solicitud</h3>
        <p class="mb-4 text-xs text-slate-500">Complete los datos de la solicitud</p>
        
        <form class="space-y-4" @submit.prevent="crearTramite">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Deportista *</label>
              <select v-model="form.deportista_id" class="input-field text-sm" required :disabled="saving" @change="onDeportistaChange">
                <option value="" disabled>Seleccione deportista...</option>
                <option v-for="d in deportistas" :key="d.id" :value="d.id">
                  {{ d.nombres }} {{ d.apellidos }} (CI: {{ d.ci }})
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Tipo de Solicitud *</label>
              <select v-model="form.tipo_solicitud" class="input-field text-sm" :disabled="saving">
                <option value="Apoyo Económico">Apoyo Económico</option>
                <option value="Premio por Logro">Premio por Logro</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Nombre del Evento *</label>
            <input v-model="form.evento_nombre" type="text" placeholder="Ej. Juegos Panamericanos" class="input-field text-sm" required :disabled="saving" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Fecha del Evento *</label>
              <input v-model="form.fecha_evento" type="date" class="input-field text-sm" required :disabled="saving" />
              
              <div v-if="diasAnticipacion !== null" class="mt-1">
                <span v-if="diasAnticipacion >= 15" class="inline-block rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  ✓ Cumple 15 días
                </span>
                <span v-else class="inline-block rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                  ⚠ Faltan {{ diasAnticipacion }} días
                </span>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Monto Solicitado (Bs) *</label>
              <input v-model="form.monto_solicitado" type="number" step="0.5" placeholder="Ej. 4500.00" class="input-field text-sm" required :disabled="saving" />
            </div>
          </div>

          <!-- Menor de edad checkbox -->
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label class="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input v-model="form.es_menor_edad" type="checkbox" class="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>Es Menor de Edad (Requiere datos de Tutor)</span>
            </label>

            <div v-if="form.es_menor_edad" class="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-[11px] font-semibold text-slate-600">Nombre del Tutor *</label>
                <input v-model="form.tutor_nombre" type="text" placeholder="Nombre completo" class="input-field text-xs" :required="form.es_menor_edad" />
              </div>
              <div>
                <label class="mb-1 block text-[11px] font-semibold text-slate-600">C.I. del Tutor *</label>
                <input v-model="form.tutor_ci" type="text" placeholder="Ej. 4512789" class="input-field text-xs" :required="form.es_menor_edad" />
              </div>
            </div>
          </div>

          <!-- Exención si incumple 15 días -->
          <div v-if="diasAnticipacion !== null && diasAnticipacion < 15" class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            <p class="font-bold">Advertencia de Plazo</p>
            <p class="mt-1">Requiere exención autorizada para continuar.</p>
            <label class="mt-2 flex items-center gap-2 font-bold text-amber-900">
              <input v-model="form.exencion_administrador" type="checkbox" />
              <span>Solicitar Exención Excepcional</span>
            </label>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving || !esValido15Dias">
              {{ saving ? 'Guardando…' : 'Registrar Trámite' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EXPEDIENTE -->
    <div v-if="showExpedienteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div class="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl my-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span class="rounded bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800">{{ selectedTramite?.codigo_tramite }}</span>
            <h2 class="font-display text-xl font-bold text-slate-900">{{ selectedTramite?.evento_nombre }}</h2>
            <p class="text-xs text-slate-500">Solicitante: {{ selectedTramite?.deportista?.nombres }} {{ selectedTramite?.deportista?.apellidos }}</p>
          </div>
          <button class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" @click="closeModals">✕</button>
        </div>

        <!-- Pestañas -->
        <div class="mt-4 flex border-b border-slate-200 text-sm font-semibold">
          <button class="px-4 py-2 border-b-2 transition-colors" :class="activeTab === 'resumen' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" @click="activeTab = 'resumen'">
            1. Avance del Trámite
          </button>
          <button class="px-4 py-2 border-b-2 transition-colors" :class="activeTab === 'requisitos' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" @click="activeTab = 'requisitos'">
            2. Requisitos ({{ expedienteDetalle?.data?.requisitos?.length || 0 }})
          </button>
          <button class="px-4 py-2 border-b-2 transition-colors" :class="activeTab === 'trazabilidad' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" @click="activeTab = 'trazabilidad'">
            3. Historial de Derivaciones
          </button>
        </div>

        <!-- TAB 1: RESUMEN -->
        <div v-if="activeTab === 'resumen'" class="mt-4 space-y-4">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Paso Actual: {{ selectedTramite?.etapa_actual }}</h4>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 max-h-60 overflow-y-auto pr-2">
              <div v-for="item in expedienteDetalle?.flujo_etapas" :key="item.etapa" class="rounded-lg p-2 text-xs border"
                :class="{
                  'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium': item.completado,
                  'bg-brand-600 border-brand-700 text-white font-bold shadow-md': item.es_actual,
                  'bg-white border-slate-200 text-slate-400': !item.completado && !item.es_actual
                }"
              >
                <div class="flex items-center justify-between">
                  <span>Paso {{ item.etapa }}</span>
                  <span>{{ item.completado ? '✓' : item.es_actual ? '➔' : '' }}</span>
                </div>
                <div class="font-bold">{{ item.nombre }}</div>
                <div class="text-[10px] opacity-80">{{ item.responsable }}</div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button v-if="selectedTramite?.estado.includes('Observada')" class="btn-primary bg-amber-600 hover:bg-amber-700" @click="ejecutarSubsanacion">
              Subsanar Observaciones
            </button>
            <button class="btn-primary bg-slate-800 hover:bg-slate-900" @click="openDerivarModal(selectedTramite)">
              Derivar a Siguiente Paso →
            </button>
          </div>
        </div>

        <!-- TAB 2: REQUISITOS -->
        <div v-if="activeTab === 'requisitos'" class="mt-4 space-y-3">
          <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            <div v-for="req in expedienteDetalle?.data?.requisitos" :key="req.id" class="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3">
              <div class="space-y-1">
                <span class="font-bold text-xs text-slate-800">{{ req.requisito_nombre }}</span>
                
                <div v-if="req.archivo_nombre" class="flex items-center gap-2">
                  <a :href="req.archivo_path" target="_blank" rel="noopener noreferrer" class="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1">
                    <span>📄 {{ req.archivo_nombre }}</span>
                    <span class="text-[10px] text-slate-400">(Ver Documento)</span>
                  </a>
                </div>
                <div v-else class="text-[11px] text-slate-400 italic">
                  Sin documento adjunto.
                </div>

                <p v-if="req.observacion" class="text-[11px] font-semibold text-amber-700">Obs: {{ req.observacion }}</p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <!-- Botón Subir Archivo -->
                <label class="btn-secondary py-1 px-2.5 text-[11px] cursor-pointer flex items-center gap-1 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                  <span v-if="uploadingReqId === req.id">Subiendo...</span>
                  <span v-else>📎 Subir Documento</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" class="hidden" :disabled="uploadingReqId === req.id" @change="subirDocumentoRequisito(req, $event)" />
                </label>

                <span class="rounded px-2.5 py-1 text-xs font-bold"
                  :class="{
                    'bg-emerald-100 text-emerald-800': req.estado_validacion === 'Valido' || req.estado_validacion === 'Subsanado',
                    'bg-amber-100 text-amber-800': req.estado_validacion === 'Observado',
                    'bg-slate-100 text-slate-600': req.estado_validacion === 'Pendiente'
                  }"
                >
                  {{ req.estado_validacion }}
                </span>
                <button class="btn-secondary py-1 px-2.5 text-[11px]" @click="openValidarRequisito(req)">
                  Evaluar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: DERIVACIONES -->
        <div v-if="activeTab === 'trazabilidad'" class="mt-4 space-y-3">
          <div class="relative border-l-2 border-brand-200 ml-4 space-y-4 pl-4 text-xs">
            <div v-for="d in expedienteDetalle?.data?.derivaciones" :key="d.id" class="relative">
              <span class="absolute -left-[23px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white font-bold">•</span>
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div class="flex items-center justify-between font-bold text-slate-800">
                  <span>{{ d.unidad_origen }} → {{ d.unidad_destino }}</span>
                  <span class="text-slate-400 font-mono text-[11px]">{{ new Date(d.created_at).toLocaleString('es-BO') }}</span>
                </div>
                <div class="text-slate-600 mt-1 font-semibold">{{ d.accion }} ({{ d.usuario_nombre }})</div>
                <p v-if="d.observacion" class="mt-1 text-slate-500 italic">"{{ d.observacion }}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DERIVAR -->
    <div v-if="showDerivarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-1 font-display text-lg font-bold text-brand-700">Derivar Trámite</h3>
        <p class="mb-4 text-xs text-slate-500">Trámite: {{ selectedTramite?.codigo_tramite }}</p>

        <form class="space-y-4" @submit.prevent="ejecutarDerivacion">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Paso Destino *</label>
            <select v-model="derivarForm.etapa_destino" class="input-field text-sm" required :disabled="saving" @change="derivarForm.unidad_destino = getNombreUnidadPorEtapa(derivarForm.etapa_destino)">
              <option :value="2">2. Recepción (Secretaría)</option>
              <option :value="3">3. Coordinación Deportivo</option>
              <option :value="4">4. Revisión Técnica</option>
              <option :value="5">5. Observación (Deportista)</option>
              <option :value="6">6. Emisión Informe Técnico</option>
              <option :value="7">7. Visto Bueno (Dirección)</option>
              <option :value="8">8. Asesoría Jurídica</option>
              <option :value="11">11. Presupuestos</option>
              <option :value="15">15. Tesorería (Pago)</option>
              <option :value="16">16. Desembolsado</option>
              <option :value="17">17. Archivo</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Unidad Destino *</label>
            <input v-model="derivarForm.unidad_destino" type="text" class="input-field text-sm" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Monto Aprobado (Bs)</label>
            <input v-model="derivarForm.monto_aprobado" type="number" step="0.5" class="input-field text-sm" :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Acción *</label>
            <input v-model="derivarForm.accion" type="text" placeholder="Ej. Informe Técnico Favorable" class="input-field text-sm" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Observaciones</label>
            <textarea v-model="derivarForm.observaciones" rows="2" class="input-field text-sm" placeholder="Detalle adicional..." :disabled="saving"></textarea>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Derivando…' : 'Derivar' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EVALUAR REQUISITO -->
    <div v-if="showRequisitoObsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-3 font-display text-base font-bold text-slate-800">Validar Documento</h3>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Estado *</label>
            <select v-model="requisitoObsForm.estado_validacion" class="input-field text-xs">
              <option value="Valido">✓ Válido</option>
              <option value="Observado">⚠ Observado</option>
              <option value="Subsanado">🔄 Subsanado</option>
              <option value="Pendiente">⏳ Pendiente</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Observación</label>
            <textarea v-model="requisitoObsForm.observacion" rows="2" class="input-field text-xs" placeholder="Motivo de la observación..."></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-secondary text-xs" @click="showRequisitoObsModal = false">Cancelar</button>
            <button type="button" class="btn-primary text-xs" @click="guardarValidacionRequisito">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
