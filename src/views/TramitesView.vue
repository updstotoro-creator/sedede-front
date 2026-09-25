<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { tramiteService } from '../services/tramiteService'
import { deportistaService } from '../services/deportistaService'
import { calendarioAnualService } from '../services/calendarioAnualService'

const auth = useAuthStore()
const isDeportista = computed(() => auth.user?.role?.nombre === 'deportista')

const tramites = ref([])
const deportistas = ref([])
const eventosCalendario = ref([])
const selectedEventoId = ref('')

const miPerfilDeportista = ref(null)

const isLoading = ref(true)
const errorMessage = ref('')
const filterEtapa = ref('')

const showModal = ref(false)
const showExpedienteModal = ref(false)
const showDerivarModal = ref(false)

const selectedTramite = ref(null)
const expedienteDetalle = ref(null)
const activeTab = ref('resumen')

const saving = ref(false)
const formError = ref('')

// Las 17 etapas oficiales del procedimiento SEDEDE
const ETAPAS_PROCEDIMIENTO = [
  { numero: 1, nombre: 'Registro Solicitud', responsable: 'Deportista (15 días antes)', icon: '📝', color: 'blue' },
  { numero: 2, nombre: 'Recepción y Verificación', responsable: 'Ventanilla SEDEDE', icon: '📥', color: 'blue' },
  { numero: 3, nombre: 'Derivación a Deportes', responsable: 'Coordinación', icon: '↗️', color: 'blue' },
  { numero: 4, nombre: 'Revisión Técnica', responsable: 'Comisión Técnica', icon: '🔍', color: 'indigo' },
  { numero: 5, nombre: 'Subsanación Observaciones', responsable: 'Deportista (48 hrs)', icon: '⚠️', color: 'amber' },
  { numero: 6, nombre: 'Informe Viabilidad', responsable: 'Técnico Evaluador', icon: '📋', color: 'indigo' },
  { numero: 7, nombre: 'Vo.Bo. Dirección', responsable: 'Jefatura Unidad', icon: '✔️', color: 'indigo' },
  { numero: 8, nombre: 'Análisis Jurídico', responsable: 'Asesoría Jurídica', icon: '⚖️', color: 'violet' },
  { numero: 9, nombre: 'Dictamen Comisión', responsable: 'Comisión Interdisciplinaria', icon: '🏛️', color: 'violet' },
  { numero: 10, nombre: 'Resolución Deptal.', responsable: 'Dirección SEDEDE', icon: '📜', color: 'violet' },
  { numero: 11, nombre: 'Certif. Presupuestaria', responsable: 'Presupuestos / DAF', icon: '💰', color: 'emerald' },
  { numero: 12, nombre: 'Orden de Servicio', responsable: 'Administración', icon: '📄', color: 'emerald' },
  { numero: 13, nombre: 'Devengado y Planilla', responsable: 'Contabilidad', icon: '📊', color: 'emerald' },
  { numero: 14, nombre: 'Aprobación Firma C-31', responsable: 'DAF / Dirección', icon: '✍️', color: 'emerald' },
  { numero: 15, nombre: 'Priorización SIGEP', responsable: 'Tesorería Deptal.', icon: '🏦', color: 'teal' },
  { numero: 16, nombre: 'Desembolso / Pago', responsable: 'Tesorería (Abono)', icon: '💵', color: 'teal' },
  { numero: 17, nombre: 'Archivo & Rendición', responsable: 'Archivo Central', icon: '🗄️', color: 'slate' },
]

// Formulario de Nueva Solicitud (Etapa 1: Registro)
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
  observaciones: '',
  exencion_administrador: false,
})

// Archivos subidos directamente en Etapa 1: Registro
const archivos = reactive({
  doc_nota_director: null,
  doc_ci_deportista: null,
  doc_curriculum: null,
  doc_convocatoria: null,
  doc_certificacion_federacion: null,
  doc_sigep: null,
  doc_tutor_ci: null,
  doc_material: null,
  doc_resultados: null,
})

// Formulario de Derivación (para administrativos)
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

const activeAsociacionId = computed(() => {
  if (isDeportista.value) {
    const id = miPerfilDeportista.value?.asociacion_id || miPerfilDeportista.value?.asociacion?.id
    return id ? Number(id) : null
  }
  if (form.deportista_id) {
    const dep = deportistas.value.find(d => d.id === Number(form.deportista_id))
    const id = dep?.asociacion_id || dep?.asociacion?.id
    return id ? Number(id) : null
  }
  return null
})

const activeAsociacionNombre = computed(() => {
  if (isDeportista.value) {
    return miPerfilDeportista.value?.asociacion?.nombre || miPerfilDeportista.value?.disciplina || 'Tu Asociación'
  }
  if (form.deportista_id) {
    const dep = deportistas.value.find(d => d.id === Number(form.deportista_id))
    return dep?.asociacion?.nombre || dep?.disciplina || 'Asociación del Deportista'
  }
  return ''
})

const eventosFiltradosPorAsociacion = computed(() => {
  const asocId = activeAsociacionId.value
  if (!asocId) return []
  return eventosCalendario.value.filter(e => Number(e.asociacion_id) === asocId)
})

const selectedEventoObj = computed(() => {
  if (!selectedEventoId.value) return null
  return eventosCalendario.value.find(e => e.id === Number(selectedEventoId.value)) || null
})

function onFileSelect(key, event) {
  const file = event.target.files[0]
  archivos[key] = file || null
}

function onEventoSelectChange() {
  const ev = selectedEventoObj.value
  if (ev) {
    form.evento_nombre = ev.nombre_evento
    if (ev.fecha_inicio) {
      form.fecha_evento = String(ev.fecha_inicio).split('T')[0].split(' ')[0]
    }
  } else {
    form.evento_nombre = ''
    form.fecha_evento = ''
  }
}

function resetForm() {
  form.deportista_id = isDeportista.value ? (miPerfilDeportista.value?.id || '') : ''
  form.tipo_solicitud = 'Apoyo Económico'
  form.evento_nombre = ''
  form.fecha_evento = ''
  form.monto_solicitado = ''
  form.es_menor_edad = miPerfilDeportista.value?.es_menor_de_edad || false
  form.tutor_nombre = miPerfilDeportista.value?.tutor_nombre || ''
  form.tutor_ci = miPerfilDeportista.value?.tutor_ci || ''
  form.cuenta_sigep = miPerfilDeportista.value?.sigep_cuenta || ''
  form.observaciones = ''
  form.exencion_administrador = false
  formError.value = ''

  selectedEventoId.value = ''

  archivos.doc_nota_director = null
  archivos.doc_ci_deportista = null
  archivos.doc_curriculum = null
  archivos.doc_convocatoria = null
  archivos.doc_certificacion_federacion = null
  archivos.doc_sigep = null
  archivos.doc_tutor_ci = null
  archivos.doc_material = null
  archivos.doc_resultados = null
}

async function fetchTramites() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (isDeportista.value) {
      const res = await tramiteService.misTramites()
      let list = res.data || []
      if (filterEtapa.value) {
        list = list.filter(t => matchesFilter(t, filterEtapa.value))
      }
      tramites.value = list
    } else {
      const params = {}
      if (filterEtapa.value) {
        params.estado = filterEtapa.value
      }
      const res = await tramiteService.list(params)
      let list = res.items || res || []
      if (filterEtapa.value && !isNaN(Number(filterEtapa.value))) {
        list = list.filter(t => t.etapa_actual === Number(filterEtapa.value))
      }
      tramites.value = list
    }
  } catch (e) {
    errorMessage.value = e.response?.data?.error || 'Error al cargar los trámites'
  } finally {
    isLoading.value = false
  }
}

function matchesFilter(tramite, filter) {
  if (!filter) return true
  if (filter === 'observadas') return tramite.estado.includes('Observada') || tramite.etapa_actual === 5
  if (filter === 'pagadas') return tramite.estado.includes('Pagada') || tramite.etapa_actual >= 16
  if (filter === 'en_curso') return !tramite.estado.includes('Pagada') && !tramite.estado.includes('Observada')
  const etapaNum = Number(filter)
  if (!isNaN(etapaNum)) return tramite.etapa_actual === etapaNum
  return true
}

async function fetchDeportistas() {
  if (isDeportista.value) return
  try {
    const res = await deportistaService.list()
    deportistas.value = res.items || []
  } catch (e) {
    console.error('Error cargando deportistas:', e)
  }
}

async function fetchEventosCalendario() {
  try {
    const res = await calendarioAnualService.list()
    eventosCalendario.value = res.items || []
  } catch (e) {
    console.error('Error cargando eventos del calendario:', e)
  }
}

async function fetchMiPerfil() {
  if (!isDeportista.value) return
  try {
    const res = await deportistaService.getMiPerfil()
    miPerfilDeportista.value = res.data || res.deportista || null
  } catch (e) {
    console.error('Error cargando mi perfil:', e)
  }
}

function onDeportistaChange() {
  selectedEventoId.value = ''
  form.evento_nombre = ''
  form.fecha_evento = ''
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
    form.cuenta_sigep = dep.sigep_cuenta || `SIGEP-BO-${dep.ci || '000'}`
    form.tutor_nombre = dep.tutor_nombre || ''
    form.tutor_ci = dep.tutor_ci || ''
  }
}

async function openCreateModal() {
  if (isDeportista.value && !miPerfilDeportista.value) {
    await fetchMiPerfil()
  }
  if (!eventosCalendario.value || eventosCalendario.value.length === 0) {
    await fetchEventosCalendario()
  }
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
  const item = ETAPAS_PROCEDIMIENTO.find(e => e.numero === etapa)
  return item ? item.responsable : 'Unidad Institucional SEDEDE'
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

  if (!form.evento_nombre || !form.fecha_evento) {
    formError.value = 'Debe seleccionar un evento oficial aprobado del calendario deportivo de su asociación.'
    saving.value = false
    return
  }

  if (!esValido15Dias.value) {
    formError.value = `La solicitud debe registrarse con al menos 15 días calendario de anticipación a la fecha del evento según normativa SEDEDE (días calculados: ${diasAnticipacion.value} días).`
    saving.value = false
    return
  }

  try {
    const formData = new FormData()
    if (form.deportista_id) formData.append('deportista_id', form.deportista_id)
    formData.append('tipo_solicitud', form.tipo_solicitud)
    formData.append('evento_nombre', form.evento_nombre)
    formData.append('fecha_evento', form.fecha_evento)
    formData.append('monto_solicitado', form.monto_solicitado)
    formData.append('es_menor_edad', form.es_menor_edad ? '1' : '0')
    if (form.tutor_nombre) formData.append('tutor_nombre', form.tutor_nombre)
    if (form.tutor_ci) formData.append('tutor_ci', form.tutor_ci)
    if (form.cuenta_sigep) formData.append('cuenta_sigep', form.cuenta_sigep)
    if (form.observaciones) formData.append('observaciones', form.observaciones)
    if (form.exencion_administrador) formData.append('exencion_administrador', '1')

    // Adjuntar archivos de requisitos cargados directamente en el registro
    for (const [key, file] of Object.entries(archivos)) {
      if (file) {
        formData.append(key, file)
      }
    }

    await tramiteService.create(formData)
    closeModals()
    await fetchTramites()
  } catch (e) {
    if (e.response?.status === 422) {
      formError.value = e.response.data?.error || 'Verifique los datos del trámite y requisitos.'
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
    formError.value = e.response?.data?.error || 'Error al derivar expediente'
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
    await tramiteService.subsanar(selectedTramite.value.id, {
      observaciones: 'Requisitos y documentación corregidos por el deportista para reingreso a Revisión Técnica.',
    })
    const res = await tramiteService.expediente(selectedTramite.value.id)
    expedienteDetalle.value = res
    await fetchTramites()
    alert('✓ Expediente subsanado exitosamente. Ha sido derivado nuevamente a Revisión Técnica.')
  } catch (e) {
    alert(e.response?.data?.error || 'Error al subsanar observaciones.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchMiPerfil()
  await fetchEventosCalendario()
  await fetchTramites()
  await fetchDeportistas()
})
</script>

<template>
  <div class="mt-8 space-y-6">
    <!-- Encabezado Módulo -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span class="rounded bg-brand-100 px-2 py-0.5 font-bold text-brand-800 text-[11px]">
            {{ isDeportista ? 'Portal del Atleta' : 'Gestión Departamental' }}
          </span>
          <span class="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
            17 Etapas Normativas
          </span>
        </div>
        <h1 class="font-display text-2xl font-bold text-brand-700 mt-1">
          {{ isDeportista ? 'Mis Trámites y Solicitudes de Apoyo' : 'Trámites y Apoyos a Deportistas' }}
        </h1>
        <p class="text-xs text-slate-500">
          {{ isDeportista ? 'Consulta el avance en vivo de tus solicitudes o registra una nueva con requisitos digitales.' : 'Administración y seguimiento del flujo oficial de apoyos deportivos.' }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Selector de Filtro de Etapas -->
        <select v-model="filterEtapa" class="input-field text-xs w-56 font-semibold" @change="fetchTramites">
          <option value="">Todas las Etapas (1 - 17)</option>
          <option value="1">Etapa 1: Registradas (Deportista)</option>
          <option value="4">Etapa 4: En Revisión Técnica</option>
          <option value="5">Etapa 5: Observadas / Subsanación</option>
          <option value="8">Etapa 8: Asesoría Jurídica</option>
          <option value="10">Etapa 10: Resolución Departamental</option>
          <option value="11">Etapa 11: Certif. Presupuestaria</option>
          <option value="15">Etapa 15: Priorización SIGEP</option>
          <option value="16">Etapa 16: Pagada / Desembolsada</option>
          <option value="17">Etapa 17: Archivo Digital y Rendición</option>
        </select>

        <button class="btn-primary flex items-center gap-1.5 shadow-sm" @click="openCreateModal">
          <span class="text-base font-bold">+</span>
          <span>Nueva Solicitud de Apoyo</span>
        </button>
      </div>
    </div>

    <!-- MAPA VISUAL COMPLETO: LAS 17 ETAPAS DEL PROCEDIMIENTO SEDEDE -->
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h2 class="font-display text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span>🗺️ Flujo Oficial Completo del Procedimiento (17 Etapas Digitales)</span>
          </h2>
          <p class="text-[11px] text-slate-400">
            Cada solicitud avanza secuencialmente a través de las unidades de revisión, aprobación y desembolso.
          </p>
        </div>
        <div class="flex items-center gap-2 text-[10px] font-bold">
          <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
            🟢 Punto 1: Registro (Portal Atleta)
          </span>
          <span class="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
            ⚠️ Punto 5: Subsanación 48h
          </span>
        </div>
      </div>

      <!-- Barra de etapas con scroll horizontal suave -->
      <div class="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <div
          v-for="et in ETAPAS_PROCEDIMIENTO"
          :key="et.numero"
          class="shrink-0 w-36 rounded-xl border p-2.5 transition-all text-left flex flex-col justify-between"
          :class="{
            'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20': et.numero === 1,
            'bg-amber-50/70 border-amber-300': et.numero === 5,
            'bg-slate-50 border-slate-200 hover:border-slate-300': et.numero !== 1 && et.numero !== 5
          }"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded"
                :class="et.numero === 1 ? 'bg-emerald-600 text-white' : (et.numero === 5 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700')"
              >
                Paso {{ et.numero }}
              </span>
              <span class="text-xs">{{ et.icon }}</span>
            </div>
            <p class="font-bold text-[11px] text-slate-800 mt-1 leading-tight line-clamp-2">
              {{ et.nombre }}
            </p>
          </div>
          <p class="text-[9px] text-slate-500 mt-2 font-medium">
            {{ et.responsable }}
          </p>
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
      <div v-if="tramites.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p class="text-slate-400 text-sm">No se encontraron trámites registrados con el filtro seleccionado.</p>
        <button class="btn-primary mt-4 text-xs font-bold" @click="openCreateModal">
          + Iniciar Primera Solicitud de Apoyo
        </button>
      </div>

      <div
        v-for="t in tramites"
        :key="t.id"
        class="rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md"
        :class="t.estado.includes('Observada') ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 hover:border-brand-300'"
      >
        <div class="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800">{{ t.codigo_tramite }}</span>
              <span class="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                Etapa {{ t.etapa_actual }} de 17: {{ getNombreUnidadPorEtapa(t.etapa_actual) }}
              </span>
              <span v-if="t.es_menor_edad" class="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Menor de Edad</span>
              <span class="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">{{ t.tipo_solicitud }}</span>
            </div>

            <h2 class="mt-1.5 font-display text-base font-bold text-slate-900">{{ t.evento_nombre }}</h2>
            <p class="text-xs text-slate-500">
              Solicitante: <strong class="text-slate-800">{{ t.deportista?.nombres }} {{ t.deportista?.apellidos }}</strong>
              <span v-if="t.deportista?.asociacion">({{ t.deportista.asociacion.nombre }})</span>
              <span v-if="t.deportista?.club" class="ml-1 text-slate-400">· Club {{ t.deportista.club.nombre }}</span>
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-right">
              <span class="block text-xs font-semibold text-slate-400">Monto Solicitado</span>
              <span class="font-mono text-sm font-bold text-brand-700">
                Bs {{ Number(t.monto_solicitado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}
                <span v-if="t.monto_aprobado" class="text-emerald-700 font-bold block text-xs">
                  Aprobado: Bs {{ Number(t.monto_aprobado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}
                </span>
              </span>
            </div>

            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="{
                'bg-blue-100 text-blue-800': t.estado === 'Registrada',
                'bg-amber-100 text-amber-800 border border-amber-300': t.estado.includes('Observada') || t.etapa_actual === 5,
                'bg-purple-100 text-purple-800': t.estado.includes('Técnica') || t.estado.includes('Presupuestaria'),
                'bg-emerald-100 text-emerald-800': t.estado.includes('Aprobada') || t.estado.includes('Pagada'),
                'bg-red-100 text-red-800': t.estado === 'Rechazada',
                'bg-slate-100 text-slate-700': !t.estado.includes('Observada') && !t.estado.includes('Pagada') && !t.estado.includes('Aprobada')
              }"
            >
              {{ t.estado }}
            </span>

            <div class="flex items-center gap-2">
              <button
                class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 shadow-sm"
                @click="openExpediente(t)"
              >
                Ver Expediente
              </button>

              <button
                v-if="!isDeportista"
                class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                @click="openDerivarModal(t)"
              >
                Derivar →
              </button>
            </div>
          </div>
        </div>

        <!-- Fila de Detalles y Requisitos -->
        <div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex flex-wrap items-center gap-4 text-slate-600">
            <div>
              <span class="text-slate-400">Unidad Responsable:</span>
              <strong class="ml-1 text-slate-800">{{ t.unidad_actual }}</strong>
            </div>
            <div>
              <span class="text-slate-400">Fecha del Evento:</span>
              <strong class="ml-1 text-slate-800">{{ t.fecha_evento ? t.fecha_evento.split('T')[0] : 'N/A' }}</strong>
            </div>
            <div v-if="t.cuenta_sigep">
              <span class="text-slate-400">Cuenta SIGEP:</span>
              <strong class="ml-1 font-mono text-slate-800">{{ t.cuenta_sigep }}</strong>
            </div>
          </div>

          <!-- Alerta de Subsanación en tarjeta si aplica -->
          <div v-if="t.estado.includes('Observada') || t.etapa_actual === 5" class="w-full mt-2 rounded-lg bg-amber-100/80 border border-amber-300 p-2.5 flex items-center justify-between text-amber-900">
            <span class="font-semibold text-xs flex items-center gap-1.5">
              <span>⚠️ Observación:</span>
              <span>{{ t.observaciones || 'Se requiere corregir la documentación para continuar el trámite.' }}</span>
            </span>
            <button class="px-3 py-1 bg-amber-700 text-white rounded text-xs font-bold hover:bg-amber-800 shrink-0" @click="openExpediente(t)">
              Subsanar en Expediente →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 1: REGISTRO DE NUEVA SOLICITUD (ETAPA 1: REGISTRO)  -->
    <!-- ======================================================== -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div class="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span class="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
              Etapa 1: Registro Oficial
            </span>
            <h2 class="font-display text-xl font-bold text-slate-900 mt-1">Nueva Solicitud de Apoyo</h2>
            <p class="text-xs text-slate-500">
              Registra los datos del evento, tipo de solicitud y carga los requisitos digitales normativos.
            </p>
          </div>
          <button class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" @click="closeModals">✕</button>
        </div>

        <form @submit.prevent="crearTramite" class="mt-5 space-y-4">

          <!-- Fila 1: Solicitante (si es admin) y Tipo de Solicitud -->
          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Si es deportista NO se muestra el selector de deportista, se auto-asigna -->
            <div v-if="!isDeportista">
              <label class="mb-1 block text-xs font-semibold text-slate-700">Deportista Solicitante *</label>
              <select v-model="form.deportista_id" class="input-field text-xs font-semibold" required :disabled="saving" @change="onDeportistaChange">
                <option value="" disabled>Seleccione deportista...</option>
                <option v-for="d in deportistas" :key="d.id" :value="d.id">
                  {{ d.apellidos }} {{ d.nombres }} ({{ d.ci }}) - {{ d.disciplina }}
                </option>
              </select>
            </div>

            <div :class="isDeportista ? 'sm:col-span-2' : ''">
              <label class="mb-1 block text-xs font-semibold text-slate-700">Tipo de Apoyo o Trámite *</label>
              <select v-model="form.tipo_solicitud" class="input-field text-xs font-semibold" required :disabled="saving">
                <option value="Apoyo Económico">Apoyo Económico (Pasajes, Viáticos, Inscripción)</option>
                <option value="Material Deportivo / Equipamiento">Material Deportivo / Equipamiento (Mochilas, Indumentaria, Ropa)</option>
                <option value="Premio por Logro">Premio por Logro Deportivo (Mérito y Reconocimiento)</option>
              </select>
            </div>
          </div>

          <!-- Fila 2: Selector de Evento desde el Calendario Oficial de la Asociación -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-800">
                Seleccione Evento del Calendario Deportivo Aprobado *
              </label>
              <span v-if="activeAsociacionNombre" class="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800 truncate max-w-[220px]">
                {{ activeAsociacionNombre }}
              </span>
            </div>

            <!-- Si no hay deportista seleccionado aún (modo admin) -->
            <div v-if="!activeAsociacionId" class="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-center text-xs text-slate-500">
              ℹ Seleccione primero el deportista solicitante en el paso anterior para cargar los eventos aprobados de su asociación.
            </div>

            <!-- Si la asociación no tiene eventos cargados en el calendario -->
            <div v-else-if="eventosFiltradosPorAsociacion.length === 0" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p class="font-bold">⚠️ No existen eventos aprobados en el calendario</p>
              <p class="mt-1 text-[11px] text-amber-700">
                La asociación <strong>{{ activeAsociacionNombre }}</strong> aún no tiene eventos deportivos aprobados por el SEDEDE registrados en el Calendario Oficial. Para solicitar apoyo, la directiva de la asociación debe programar y registrar primero el evento oficial.
              </p>
            </div>

            <!-- Selector de Eventos de la Asociación -->
            <div v-else>
              <select
                v-model="selectedEventoId"
                @change="onEventoSelectChange"
                class="input-field text-xs font-semibold text-slate-900 bg-white"
                required
                :disabled="saving"
              >
                <option value="" disabled>Seleccione el evento deportivo aprobado de su asociación...</option>
                <option v-for="ev in eventosFiltradosPorAsociacion" :key="ev.id" :value="ev.id">
                  [{{ ev.tipo_evento || 'Oficial' }}] {{ ev.nombre_evento }} — ({{ ev.fecha_inicio ? String(ev.fecha_inicio).split('T')[0].split(' ')[0] : 'S/F' }})
                </option>
              </select>
            </div>

            <!-- Ficha de Confirmación del Evento Seleccionado (Sin campo de texto libre) -->
            <div v-if="selectedEventoObj" class="rounded-lg border border-brand-200 bg-white p-3 space-y-2 shadow-sm">
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ✓ Evento Oficial Aprobado SEDEDE
                </span>
                <span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {{ selectedEventoObj.tipo_evento }}
                </span>
              </div>
              <h4 class="font-display text-sm font-bold text-brand-950">
                {{ selectedEventoObj.nombre_evento }}
              </h4>
              <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                <div>
                  <span class="font-semibold text-slate-500">Asociación:</span>
                  <p class="font-bold text-slate-800 truncate">{{ selectedEventoObj.asociacion?.nombre || activeAsociacionNombre }}</p>
                </div>
                <div>
                  <span class="font-semibold text-slate-500">Disciplina / Cat.:</span>
                  <p class="font-bold text-slate-800">{{ selectedEventoObj.disciplina }} · {{ selectedEventoObj.categoria || 'Oficial' }}</p>
                </div>
                <div>
                  <span class="font-semibold text-slate-500">Fechas Oficiales:</span>
                  <p class="font-bold text-slate-800">
                    {{ selectedEventoObj.fecha_inicio ? String(selectedEventoObj.fecha_inicio).split('T')[0].split(' ')[0] : '' }}
                    <span v-if="selectedEventoObj.fecha_fin && selectedEventoObj.fecha_fin !== selectedEventoObj.fecha_inicio">
                      al {{ String(selectedEventoObj.fecha_fin).split('T')[0].split(' ')[0] }}
                    </span>
                  </p>
                </div>
                <div>
                  <span class="font-semibold text-slate-500">Escenario:</span>
                  <p class="font-bold text-slate-800 truncate">{{ selectedEventoObj.escenario?.nombre || 'Escenario Departamental' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Fila 3: Fecha del Evento (Solo lectura, fijada por calendario) y Regla de 15 Días -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">
                Fecha del Evento *
                <span class="text-[10px] font-normal text-slate-500">(Fijada por Calendario Oficial)</span>
              </label>
              <input
                v-model="form.fecha_evento"
                type="date"
                class="input-field text-xs bg-slate-100 cursor-not-allowed font-semibold text-slate-700"
                readonly
                required
                :disabled="saving"
              />

              <div v-if="diasAnticipacion !== null" class="mt-1.5">
                <span v-if="diasAnticipacion >= 15" class="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  ✓ Cumple 15 días de anticipación ({{ diasAnticipacion }} días)
                </span>
                <span v-else class="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                  ⚠ Faltan solo {{ diasAnticipacion }} días (requiere mínimo 15 días)
                </span>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">
                {{ form.tipo_solicitud === 'Material Deportivo / Equipamiento' ? 'Presupuesto Estimado / Valor (Bs) *' : 'Monto Solicitado (Bs) *' }}
              </label>
              <input v-model="form.monto_solicitado" type="number" step="0.5" placeholder="Ej. 4500.00" class="input-field text-xs" required :disabled="saving" />
            </div>
          </div>

          <!-- Si solicita material, detalle del pedido -->
          <div v-if="form.tipo_solicitud === 'Material Deportivo / Equipamiento'">
            <label class="mb-1 block text-xs font-semibold text-slate-700">
              Detalle del Material Deportivo (Mochilas, Ropa, Tallas, Unidades)
            </label>
            <textarea
              v-model="form.observaciones"
              rows="2"
              placeholder="Ej. 1 Mochila institucional de viaje, 2 juegos de uniforme deportivo de competencia talla M..."
              class="input-field text-xs"
            ></textarea>
          </div>

          <!-- Menor de edad checkbox y tutor -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-800">
              <input v-model="form.es_menor_edad" type="checkbox" class="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>Es Menor de Edad (Requiere datos y C.I. del Tutor Legal)</span>
            </label>

            <div v-if="form.es_menor_edad" class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-[11px] font-semibold text-slate-600">Nombre Completo del Tutor *</label>
                <input v-model="form.tutor_nombre" type="text" placeholder="Nombre completo" class="input-field text-xs bg-white" :required="form.es_menor_edad" />
              </div>
              <div>
                <label class="mb-1 block text-[11px] font-semibold text-slate-600">C.I. del Tutor *</label>
                <input v-model="form.tutor_ci" type="text" placeholder="Ej. 4512789 CH" class="input-field text-xs bg-white" :required="form.es_menor_edad" />
              </div>
            </div>
          </div>

          <!-- CARGA DE DOCUMENTACIÓN Y REQUISITOS DIRECTA (PUNTO 1: REGISTRO) -->
          <div class="rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-brand-100 pb-2">
              <div>
                <h3 class="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📎 Requisitos y Documentación Obligatoria (Subida Directa)</span>
                </h3>
                <p class="text-[10px] text-slate-500">
                  Adjunta los documentos en PDF o imagen para agilizar la Revisión Técnica preliminar.
                </p>
              </div>
              <span class="rounded bg-brand-100 text-brand-800 text-[10px] font-bold px-2 py-0.5">Etapa 1</span>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 text-xs">
              <!-- Requisito 1: Nota al Director -->
              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  1. Nota dirigida al Director del SEDEDE
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_nota_director', $event)" class="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
              </div>

              <!-- Requisito 2: Cédula de Identidad Deportista -->
              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  2. Cédula de Identidad del Deportista
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_ci_deportista', $event)" class="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
              </div>

              <!-- Requisito 3: Currículum Deportivo visado por Asociación -->
              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  3. Currículum Deportivo (visado por la Asociación)
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_curriculum', $event)" class="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
              </div>

              <!-- Requisito 4: Convocatoria Oficial -->
              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  4. Convocatoria Oficial del Evento
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_convocatoria', $event)" class="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
              </div>

              <!-- Requisito 5: Certificación / Nominación de Federación -->
              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  5. Certificación / Nominación de Federación
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_certificacion_federacion', $event)" class="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
              </div>

              <!-- Requisito 6: Certificación Cuenta SIGEP -->
              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  6. Certificación de Cuenta SIGEP Activa
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_sigep', $event)" class="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
              </div>

              <!-- Requisito Condicional: C.I. de Tutor si es menor -->
              <div v-if="form.es_menor_edad" class="bg-amber-50/80 p-2.5 rounded-lg border border-amber-300 sm:col-span-2">
                <label class="block font-bold text-amber-900 text-[11px] mb-1">
                  7. Cédula de Identidad del Padre / Madre o Tutor Legal *
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_tutor_ci', $event)" class="text-[11px] text-amber-800 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-amber-200 file:text-amber-900 hover:file:bg-amber-300" />
              </div>

              <!-- Requisito Condicional: Especificación de Material -->
              <div v-if="form.tipo_solicitud === 'Material Deportivo / Equipamiento'" class="bg-blue-50/80 p-2.5 rounded-lg border border-blue-300 sm:col-span-2">
                <label class="block font-bold text-blue-900 text-[11px] mb-1">
                  Especificación Técnica / Cotización de Indumentaria o Equipamiento
                </label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="onFileSelect('doc_material', $event)" class="text-[11px] text-blue-800 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-200 file:text-blue-900 hover:file:bg-blue-300" />
              </div>
            </div>
          </div>

          <!-- Exención si incumple 15 días -->
          <div v-if="diasAnticipacion !== null && diasAnticipacion < 15" class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            <p class="font-bold">Advertencia de Plazo de Presentación</p>
            <p class="mt-1">El evento está programado a menos de 15 días calendario.</p>
            <label class="mt-2 flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
              <input v-model="form.exencion_administrador" type="checkbox" />
              <span>Solicitar Exención Excepcional por Calendario de Urgencia</span>
            </label>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving || !esValido15Dias">
              {{ saving ? 'Registrando y Subiendo Requisitos...' : 'Registrar Solicitud en Etapa 1' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 2: EXPEDIENTE DIGITAL Y REQUISITOS (17 ETAPAS)      -->
    <!-- ======================================================== -->
    <div v-if="showExpedienteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div class="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800">{{ selectedTramite?.codigo_tramite }}</span>
              <span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                Paso {{ selectedTramite?.etapa_actual }} de 17: {{ getNombreUnidadPorEtapa(selectedTramite?.etapa_actual) }}
              </span>
            </div>
            <h2 class="font-display text-xl font-bold text-slate-900 mt-1">{{ selectedTramite?.evento_nombre }}</h2>
            <p class="text-xs text-slate-500">Solicitante: {{ selectedTramite?.deportista?.nombres }} {{ selectedTramite?.deportista?.apellidos }}</p>
          </div>
          <button class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" @click="closeModals">✕</button>
        </div>

        <!-- Pestañas del Expediente -->
        <div class="mt-4 flex border-b border-slate-200 text-sm font-semibold">
          <button class="px-4 py-2 border-b-2 transition-colors" :class="activeTab === 'resumen' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" @click="activeTab = 'resumen'">
            1. Avance del Procedimiento (17 Etapas)
          </button>
          <button class="px-4 py-2 border-b-2 transition-colors" :class="activeTab === 'requisitos' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" @click="activeTab = 'requisitos'">
            2. Requisitos y Documentos Digitales ({{ expedienteDetalle?.data?.requisitos?.length || 0 }})
          </button>
          <button class="px-4 py-2 border-b-2 transition-colors" :class="activeTab === 'trazabilidad' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" @click="activeTab = 'trazabilidad'">
            3. Historial de Derivaciones
          </button>
        </div>

        <!-- TAB 1: AVANCE DEL PROCEDIMIENTO -->
        <div v-if="activeTab === 'resumen'" class="mt-4 space-y-4">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Estado Actual: Etapa {{ selectedTramite?.etapa_actual }} · {{ selectedTramite?.estado }}
            </h4>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 max-h-72 overflow-y-auto pr-2">
              <div
                v-for="item in expedienteDetalle?.flujo_etapas"
                :key="item.etapa"
                class="rounded-lg p-2.5 text-xs border"
                :class="{
                  'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium': item.completado,
                  'bg-brand-600 border-brand-700 text-white font-bold shadow-md': item.es_actual,
                  'bg-white border-slate-200 text-slate-400': !item.completado && !item.es_actual
                }"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold">Etapa {{ item.etapa }}</span>
                  <span>{{ item.completado ? '✓' : item.es_actual ? '➔' : '' }}</span>
                </div>
                <div class="font-bold mt-0.5">{{ item.nombre }}</div>
                <div class="text-[10px] opacity-80">{{ item.responsable }}</div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
            <!-- Botón Subsanación para el Deportista -->
            <button
              v-if="selectedTramite?.estado.includes('Observada') || selectedTramite?.etapa_actual === 5"
              class="btn-primary bg-amber-600 hover:bg-amber-700 text-xs font-bold"
              @click="ejecutarSubsanacion"
            >
              ✓ Enviar Subsanación a Revisión Técnica (Etapa 4)
            </button>

            <!-- Botón Derivación para Staff/Admin -->
            <button
              v-if="!isDeportista"
              class="btn-primary bg-slate-800 hover:bg-slate-900 text-xs font-bold"
              @click="openDerivarModal(selectedTramite)"
            >
              Derivar a Siguiente Etapa →
            </button>
          </div>
        </div>

        <!-- TAB 2: REQUISITOS Y SUBSANACIÓN DE DOCUMENTOS -->
        <div v-if="activeTab === 'requisitos'" class="mt-4 space-y-3">
          <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            <div
              v-for="req in expedienteDetalle?.data?.requisitos"
              :key="req.id"
              class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3"
            >
              <div class="space-y-1">
                <span class="font-bold text-xs text-slate-800">{{ req.requisito_nombre }}</span>

                <div v-if="req.archivo_nombre" class="flex items-center gap-2">
                  <a :href="req.archivo_path" target="_blank" rel="noopener noreferrer" class="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1">
                    <span>📄 {{ req.archivo_nombre }}</span>
                    <span class="text-[10px] text-slate-400">(Abrir Documento)</span>
                  </a>
                </div>
                <div v-else class="text-[11px] text-slate-400 italic">
                  Sin documento adjunto aún.
                </div>

                <p v-if="req.observacion" class="text-[11px] font-semibold text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                  Obs: {{ req.observacion }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <!-- Botón Subir / Subsanar Archivo -->
                <label class="btn-secondary py-1 px-2.5 text-[11px] cursor-pointer flex items-center gap-1 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                  <span v-if="uploadingReqId === req.id">Subiendo...</span>
                  <span v-else>📎 Cargar / Cambiar</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    class="hidden"
                    :disabled="uploadingReqId === req.id"
                    @change="subirDocumentoRequisito(req, $event)"
                  />
                </label>

                <!-- Estado del Requisito -->
                <span
                  class="rounded px-2.5 py-1 text-xs font-bold"
                  :class="{
                    'bg-emerald-100 text-emerald-800': req.estado_validacion === 'Valido' || req.estado_validacion === 'Subsanado',
                    'bg-amber-100 text-amber-800': req.estado_validacion === 'Observado',
                    'bg-slate-100 text-slate-600': req.estado_validacion === 'Pendiente'
                  }"
                >
                  {{ req.estado_validacion }}
                </span>

                <!-- Botón de Evaluación de Requisito para Personal Administrativo -->
                <button
                  v-if="!isDeportista"
                  class="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  @click="openValidarRequisito(req)"
                >
                  Evaluar
                </button>
              </div>
            </div>
          </div>

          <!-- Si el trámite está observado, botón de reingreso -->
          <div v-if="selectedTramite?.estado.includes('Observada') || selectedTramite?.etapa_actual === 5" class="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <div>
              <p class="font-bold text-xs text-amber-900">¿Terminaste de cargar los documentos observados?</p>
              <p class="text-[11px] text-amber-800">Haz clic en subsanar para notificar a la Comisión Técnica y reanudar el trámite.</p>
            </div>
            <button class="btn-primary bg-amber-600 hover:bg-amber-700 text-xs font-bold shrink-0" @click="ejecutarSubsanacion">
              ✓ Subsanar y Enviar a Revisión Técnica
            </button>
          </div>
        </div>

        <!-- TAB 3: HISTORIAL DE DERIVACIONES -->
        <div v-if="activeTab === 'trazabilidad'" class="mt-4 space-y-3">
          <div class="space-y-2">
            <div
              v-for="d in expedienteDetalle?.data?.derivaciones"
              :key="d.id"
              class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-800">Paso {{ d.etapa_origen }} ➔ Paso {{ d.etapa_destino }}</span>
                  <span class="text-slate-400">·</span>
                  <span class="text-slate-600">{{ d.accion }}</span>
                </div>
                <p class="text-slate-500 mt-0.5">
                  De: <strong>{{ d.unidad_origen }}</strong> a <strong>{{ d.unidad_destino }}</strong>
                  <span v-if="d.usuario_nombre">({{ d.usuario_nombre }})</span>
                </p>
                <p v-if="d.observacion" class="text-slate-700 italic mt-1 bg-white p-2 rounded border border-slate-200">
                  "{{ d.observacion }}"
                </p>
              </div>
              <span class="text-[11px] text-slate-400 shrink-0 font-mono">
                {{ d.created_at ? d.created_at.split('T')[0] : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 3: EVALUAR REQUISITO (ADMIN)                       -->
    <!-- ======================================================== -->
    <div v-if="showRequisitoObsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="font-display text-base font-bold text-slate-900">Validar Requisito Digital</h3>
        <p class="text-xs text-slate-500 mt-1">Califica el cumplimiento del documento adjunto.</p>

        <form @submit.prevent="guardarValidacionRequisito" class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
            <select v-model="requisitoObsForm.estado_validacion" class="input-field text-xs font-semibold">
              <option value="Valido">Válido (Cumple requisito)</option>
              <option value="Observado">Observado (Requiere subsanación)</option>
              <option value="Pendiente">Pendiente de Revisión</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Observación o Instrucción</label>
            <textarea v-model="requisitoObsForm.observacion" rows="3" class="input-field text-xs" placeholder="Detalle qué falta o qué debe subsanar el deportista..."></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" class="btn-secondary" @click="showRequisitoObsModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">Guardar Calificación</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 4: DERIVACIÓN (ADMIN)                              -->
    <!-- ======================================================== -->
    <div v-if="showDerivarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="font-display text-base font-bold text-slate-900">Derivar Expediente</h3>
        <p class="text-xs text-slate-500 mt-1">Trámite: {{ selectedTramite?.codigo_tramite }} · {{ selectedTramite?.evento_nombre }}</p>

        <form @submit.prevent="ejecutarDerivacion" class="mt-4 space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Etapa de Destino *</label>
              <select v-model="derivarForm.etapa_destino" class="input-field text-xs font-semibold">
                <option v-for="e in ETAPAS_PROCEDIMIENTO" :key="e.numero" :value="e.numero">
                  Paso {{ e.numero }}: {{ e.nombre }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Monto Aprobado (Bs)</label>
              <input v-model="derivarForm.monto_aprobado" type="number" step="0.5" class="input-field text-xs font-mono" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Acción</label>
            <input v-model="derivarForm.accion" type="text" class="input-field text-xs" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Observaciones / Dictamen</label>
            <textarea v-model="derivarForm.observaciones" rows="3" class="input-field text-xs" placeholder="Instrucción u observaciones sobre el expediente..."></textarea>
          </div>

          <div v-if="formError" class="text-xs text-red-600">{{ formError }}</div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" class="btn-secondary" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Derivando...' : 'Confirmar Derivación' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
