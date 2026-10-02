<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { mancomunidadService } from '../services/mancomunidadService'
import { escenarioService } from '../services/escenarioService'

const auth = useAuthStore()

// Pestañas activas: 'mancomunidades' | 'solicitudes' | 'recursos' | 'municipios'
const activeTab = ref('mancomunidades')
const isLoading = ref(false)
const notification = ref(null)

// Datos principales
const mancomunidades = ref([])
const solicitudes = ref([])
const recursos = ref([])
const municipios = ref([])
const escenarios = ref([])

// Filtros y búsquedas
const searchMancomunidad = ref('')
const filterEstadoLegal = ref('TODOS')
const searchSolicitud = ref('')
const filterEstadoSolicitud = ref('TODOS')
const filterTipoSolicitud = ref('TODOS')

// Modales
const showMancomunidadModal = ref(false)
const isEditingMancomunidad = ref(false)
const selectedMancomunidad = ref(null)

const showExpedienteModal = ref(false)
const expedienteDocs = ref([])
const expedienteRequisitos = ref(null)
const uploadingDoc = ref(false)
const newDocType = ref('convenio_constitucion')
const newDocFile = ref(null)

const showMiembrosModal = ref(false)
const miembrosList = ref([])
const nuevoMiembro = reactive({
  municipio_id: '',
  cargo: 'alcalde',
})

const showSolicitudModal = ref(false)
const solicitudForm = reactive({
  tipo: 'recursos',
  solicitante_id: '',
  solicitante_tipo: 'mancomunidad',
  titulo: '',
  descripcion: '',
  // Tipo recursos:
  recursos: [{ recurso_id: '', cantidad_solicitada: 1 }],
  // Tipo espacio:
  espacio_id: '',
  actividad: '',
  fecha_uso: '',
  hora_inicio: '08:00',
  hora_fin: '12:00',
  numero_personas: 50,
})

const showRecursoModal = ref(false)
const recursoForm = reactive({
  id: null,
  codigo: '',
  nombre: '',
  categoria: 'implemento',
  unidad: 'unidad',
  descripcion: '',
  cantidad_disponible: 10,
})

const showMunicipioModal = ref(false)
const municipioForm = reactive({
  codigo: '',
  nombre: '',
  provincia: 'Oropeza',
})

const showTransicionModal = ref(false)
const transicionData = reactive({
  solicitudId: null,
  accion: '',
  decision: 'aprobar',
  motivo: '',
  titulo: '',
})

const mancomunidadForm = reactive({
  id: null,
  nombre: '',
  sigla: '',
  nit: '',
  fecha_constitucion: '',
  direccion: '',
  telefono: '',
  correo: '',
})

// Tipos fijos de documentos
const tiposDocumentos = [
  { value: 'convenio_constitucion', label: 'Convenio de Constitución' },
  { value: 'estatutos', label: 'Estatutos Orgánicos' },
  { value: 'acta_fundacion', label: 'Acta de Fundación' },
  { value: 'nit', label: 'Número de Identificación Tributaria (NIT)' },
  { value: 'certificado_alcaldes', label: 'Certificado de Alcaldes Integrantes' },
]

function showNotice(msg, type = 'success') {
  notification.value = { msg, type }
  setTimeout(() => {
    notification.value = null
  }, 4500)
}

// Cargas de datos
async function loadAll() {
  isLoading.value = true
  try {
    const [mancomRes, solRes, recRes, munRes, escRes] = await Promise.allSettled([
      mancomunidadService.listMancomunidades(),
      mancomunidadService.listSolicitudes(),
      mancomunidadService.listRecursos(),
      mancomunidadService.listMunicipios(),
      escenarioService.listEscenarios(),
    ])

    if (mancomRes.status === 'fulfilled') mancomunidades.value = mancomRes.value.data || []
    if (solRes.status === 'fulfilled') solicitudes.value = solRes.value.data || []
    if (recRes.status === 'fulfilled') recursos.value = recRes.value.data || []
    if (munRes.status === 'fulfilled') municipios.value = munRes.value || []
    if (escRes.status === 'fulfilled') escenarios.value = escRes.value || []
  } catch (err) {
    console.error('Error cargando módulo mancomunidades:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAll()
})

// Métricas
const stats = computed(() => {
  const totalManc = mancomunidades.value.length
  const vigentes = mancomunidades.value.filter((m) => m.estado_legal === 'Vigente').length
  const solActivas = solicitudes.value.filter((s) => !['Completada', 'Rechazada', 'Anulada'].includes(s.estado)).length
  const totalStock = recursos.value.reduce((acc, r) => acc + (r.cantidad_disponible || 0), 0)
  return { totalManc, vigentes, solActivas, totalStock }
})

// Filtrados
const filteredMancomunidades = computed(() => {
  return mancomunidades.value.filter((m) => {
    if (filterEstadoLegal.value !== 'TODOS' && m.estado_legal !== filterEstadoLegal.value) return false
    if (searchMancomunidad.value.trim() !== '') {
      const q = searchMancomunidad.value.toLowerCase().trim()
      const matchN = m.nombre?.toLowerCase().includes(q)
      const matchS = m.sigla?.toLowerCase().includes(q)
      const matchNit = m.nit?.toLowerCase().includes(q)
      if (!matchN && !matchS && !matchNit) return false
    }
    return true
  })
})

const filteredSolicitudes = computed(() => {
  return solicitudes.value.filter((s) => {
    if (filterEstadoSolicitud.value !== 'TODOS' && s.estado !== filterEstadoSolicitud.value) return false
    if (filterTipoSolicitud.value !== 'TODOS' && s.tipo !== filterTipoSolicitud.value) return false
    if (searchSolicitud.value.trim() !== '') {
      const q = searchSolicitud.value.toLowerCase().trim()
      const matchCod = s.codigo?.toLowerCase().includes(q)
      const matchTit = s.titulo?.toLowerCase().includes(q)
      if (!matchCod && !matchTit) return false
    }
    return true
  })
})

// --- ACCIONES MANCOMUNIDAD ---
function openCreateMancomunidad() {
  isEditingMancomunidad.value = false
  Object.assign(mancomunidadForm, {
    id: null,
    nombre: '',
    sigla: '',
    nit: '',
    fecha_constitucion: new Date().toISOString().split('T')[0],
    direccion: '',
    telefono: '',
    correo: '',
  })
  showMancomunidadModal.value = true
}

function openEditMancomunidad(m) {
  isEditingMancomunidad.value = true
  Object.assign(mancomunidadForm, {
    id: m.id,
    nombre: m.nombre,
    sigla: m.sigla || '',
    nit: m.nit,
    fecha_constitucion: m.fecha_constitucion ? m.fecha_constitucion.substring(0, 10) : '',
    direccion: m.direccion || '',
    telefono: m.telefono || '',
    correo: m.correo || '',
  })
  showMancomunidadModal.value = true
}

async function saveMancomunidad() {
  try {
    if (isEditingMancomunidad.value) {
      await mancomunidadService.updateMancomunidad(mancomunidadForm.id, mancomunidadForm)
      showNotice('Mancomunidad actualizada correctamente')
    } else {
      await mancomunidadService.createMancomunidad(mancomunidadForm)
      showNotice('Mancomunidad creada exitosamente')
    }
    showMancomunidadModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al guardar mancomunidad', 'error')
  }
}

async function suspenderMancomunidad(id) {
  if (!confirm('¿Confirma que desea suspender legalmente esta mancomunidad? Sus solicitudes en curso se congelarán.')) return
  try {
    await mancomunidadService.suspenderMancomunidad(id)
    showNotice('Mancomunidad suspendida')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al suspender', 'error')
  }
}

async function reactivarMancomunidad(id) {
  try {
    await mancomunidadService.reactivarMancomunidad(id)
    showNotice('Mancomunidad reactivada (Estado: Pendiente de expediente)')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al reactivar', 'error')
  }
}

// --- EXPEDIENTE DOCUMENTAL ---
async function openExpediente(m) {
  selectedMancomunidad.value = m
  try {
    const [docs, reqs] = await Promise.all([
      mancomunidadService.getDocumentos(m.id),
      mancomunidadService.getRequisitos(m.id),
    ])
    expedienteDocs.value = docs || []
    expedienteRequisitos.value = reqs || null
    showExpedienteModal.value = true
  } catch (err) {
    showNotice('Error cargando expediente documental', 'error')
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) newDocFile.value = file
}

async function uploadDocumento() {
  if (!newDocFile.value) {
    alert('Seleccione un archivo primero (PDF, JPG, PNG)')
    return
  }
  uploadingDoc.value = true
  try {
    const formData = new FormData()
    formData.append('tipo', newDocType.value)
    formData.append('archivo', newDocFile.value)

    await mancomunidadService.uploadDocumento(selectedMancomunidad.value.id, formData)
    showNotice('Documento subido con éxito al expediente')
    newDocFile.value = null
    // Refrescar expediente
    openExpediente(selectedMancomunidad.value)
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error subiendo archivo', 'error')
  } finally {
    uploadingDoc.value = false
  }
}

async function aprobarDoc(doc) {
  try {
    await mancomunidadService.aprobarDocumento(selectedMancomunidad.value.id, doc.id)
    showNotice('Documento aprobado oficialmente')
    openExpediente(selectedMancomunidad.value)
  } catch (err) {
    showNotice('Error al aprobar documento', 'error')
  }
}

async function rechazarDoc(doc) {
  const obs = prompt('Ingrese las observaciones del rechazo para subsanación:')
  if (!obs) return
  try {
    await mancomunidadService.rechazarDocumento(selectedMancomunidad.value.id, doc.id, obs)
    showNotice('Documento rechazado con observaciones')
    openExpediente(selectedMancomunidad.value)
  } catch (err) {
    showNotice('Error al rechazar documento', 'error')
  }
}

async function verificarYOficializarExpediente() {
  try {
    await mancomunidadService.verificarExpediente(selectedMancomunidad.value.id)
    showNotice('¡Expediente verificado! La mancomunidad ahora está en estado VIGENTE.')
    showExpedienteModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Requisitos incompletos para oficializar expediente', 'error')
  }
}

// --- MIEMBROS ---
async function openMiembros(m) {
  selectedMancomunidad.value = m
  try {
    const miembros = await mancomunidadService.getMiembros(m.id)
    miembrosList.value = miembros || []
    showMiembrosModal.value = true
  } catch (err) {
    showNotice('Error al cargar municipios miembros', 'error')
  }
}

async function addMiembroToMancomunidad() {
  if (!nuevoMiembro.municipio_id) {
    alert('Seleccione un municipio integrante')
    return
  }
  try {
    await mancomunidadService.addMiembro(selectedMancomunidad.value.id, nuevoMiembro)
    showNotice('Municipio afiliado exitosamente')
    openMiembros(selectedMancomunidad.value)
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al agregar miembro', 'error')
  }
}

async function deleteMiembroFromMancomunidad(miembroId) {
  if (!confirm('¿Desafiliar este municipio de la mancomunidad?')) return
  try {
    await mancomunidadService.deleteMiembro(selectedMancomunidad.value.id, miembroId)
    showNotice('Municipio desafiliado')
    openMiembros(selectedMancomunidad.value)
  } catch (err) {
    showNotice('Error al desafiliar miembro', 'error')
  }
}

// --- SOLICITUDES Y TRANSICIONES ---
function openNewSolicitud() {
  solicitudForm.tipo = 'recursos'
  solicitudForm.solicitante_id = mancomunidades.value[0]?.id || ''
  solicitudForm.titulo = ''
  solicitudForm.descripcion = ''
  solicitudForm.recursos = [{ recurso_id: recursos.value[0]?.id || '', cantidad_solicitada: 5 }]
  solicitudForm.espacio_id = escenarios.value[0]?.id || ''
  solicitudForm.actividad = ''
  solicitudForm.fecha_uso = new Date().toISOString().split('T')[0]
  solicitudForm.hora_inicio = '08:00'
  solicitudForm.hora_fin = '14:00'
  solicitudForm.numero_personas = 50
  showSolicitudModal.value = true
}

function addRenglonRecurso() {
  solicitudForm.recursos.push({ recurso_id: recursos.value[0]?.id || '', cantidad_solicitada: 1 })
}

function removeRenglonRecurso(idx) {
  if (solicitudForm.recursos.length > 1) {
    solicitudForm.recursos.splice(idx, 1)
  }
}

async function saveSolicitud() {
  try {
    const payload = {
      tipo: solicitudForm.tipo,
      solicitante_id: solicitudForm.solicitante_id,
      solicitante_tipo: 'mancomunidad',
      titulo: solicitudForm.titulo,
      descripcion: solicitudForm.descripcion,
    }

    if (solicitudForm.tipo === 'recursos') {
      payload.recursos = solicitudForm.recursos.map((r) => ({
        recurso_id: parseInt(r.recurso_id, 10),
        cantidad_solicitada: parseInt(r.cantidad_solicitada, 10),
      }))
    } else {
      payload.espacio_id = parseInt(solicitudForm.espacio_id, 10)
      payload.actividad = solicitudForm.actividad
      payload.fecha_uso = solicitudForm.fecha_uso
      payload.hora_inicio = solicitudForm.hora_inicio
      payload.hora_fin = solicitudForm.hora_fin
      payload.numero_personas = parseInt(solicitudForm.numero_personas, 10)
    }

    await mancomunidadService.createSolicitud(payload)
    showNotice('Solicitud registrada en borrador exitosamente')
    showSolicitudModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al registrar solicitud', 'error')
  }
}

// Transiciones de Solicitud
async function enviarSol(sol) {
  try {
    await mancomunidadService.enviarSolicitud(sol.id)
    showNotice('Solicitud enviada a revisión técnica')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al enviar solicitud', 'error')
  }
}

async function pasarRevisionSol(sol) {
  try {
    await mancomunidadService.revisarSolicitud(sol.id)
    showNotice('Solicitud puesta En Revisión por la unidad técnica')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al poner en revisión', 'error')
  }
}

function openResolverModal(sol, accion) {
  transicionData.solicitudId = sol.id
  transicionData.accion = accion
  transicionData.decision = 'aprobar'
  transicionData.motivo = ''
  transicionData.titulo = accion === 'resolver' ? 'Resolver Solicitud (Aprobar / Rechazar)' : 'Anular Solicitud'
  showTransicionModal.value = true
}

async function executeTransicion() {
  try {
    if (transicionData.accion === 'resolver') {
      await mancomunidadService.resolverSolicitud(
        transicionData.solicitudId,
        transicionData.decision,
        transicionData.decision === 'rechazar' ? transicionData.motivo : null
      )
      showNotice(`Solicitud ${transicionData.decision === 'aprobar' ? 'Aprobada' : 'Rechazada'} con éxito`)
    } else if (transicionData.accion === 'anular') {
      if (!transicionData.motivo.trim()) {
        alert('Debe especificar el motivo de anulación')
        return
      }
      await mancomunidadService.anularSolicitud(transicionData.solicitudId, transicionData.motivo)
      showNotice('Solicitud Anulada correctamente')
    }
    showTransicionModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al ejecutar transición', 'error')
  }
}

async function asignarStockSol(sol) {
  try {
    await mancomunidadService.asignarSolicitud(sol.id)
    showNotice('Recursos asignados y descontados del inventario comunitario')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al asignar stock', 'error')
  }
}

async function completarSol(sol) {
  try {
    await mancomunidadService.completarSolicitud(sol.id)
    showNotice('Solicitud marcada como Completada (Entrega y uso finalizados)')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al completar solicitud', 'error')
  }
}

// --- RECURSOS ---
function openCreateRecurso() {
  Object.assign(recursoForm, {
    id: null,
    codigo: 'REC-' + Math.floor(100 + Math.random() * 900),
    nombre: '',
    categoria: 'implemento',
    unidad: 'unidad',
    descripcion: '',
    cantidad_disponible: 20,
  })
  showRecursoModal.value = true
}

async function saveRecurso() {
  try {
    if (recursoForm.id) {
      await mancomunidadService.updateRecurso(recursoForm.id, recursoForm)
      showNotice('Recurso actualizado')
    } else {
      await mancomunidadService.createRecurso(recursoForm)
      showNotice('Recurso creado en catálogo')
    }
    showRecursoModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al guardar recurso', 'error')
  }
}

// --- MUNICIPIOS ---
function openCreateMunicipio() {
  municipioForm.codigo = '0' + Math.floor(100 + Math.random() * 900)
  municipioForm.nombre = ''
  municipioForm.provincia = 'Oropeza'
  showMunicipioModal.value = true
}

async function saveMunicipio() {
  try {
    await mancomunidadService.createMunicipio(municipioForm)
    showNotice('Municipio registrado')
    showMunicipioModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al guardar municipio', 'error')
  }
}

const getEstadoBadgeClass = (estado) => {
  switch (estado) {
    case 'Vigente':
    case 'Aprobada':
    case 'Aprobado':
    case 'Completada':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Pendiente':
    case 'Borrador':
    case 'EnRevision':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'Enviada':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Asignada':
      return 'bg-indigo-50 text-navyflag border-indigo-200'
    case 'Suspendido':
    case 'Rechazada':
    case 'Rechazado':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'Cancelado':
    case 'Anulada':
      return 'bg-slate-100 text-slate-600 border-slate-300'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Notificación emergente -->
    <div
      v-if="notification"
      :class="[
        'fixed top-6 right-6 z-50 rounded-xl p-4 shadow-lg border transition-all text-sm font-semibold flex items-center gap-3',
        notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      ]"
    >
      <span>{{ notification.msg }}</span>
    </div>

    <!-- Encabezado de Sección -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-0.5 text-xs font-bold text-brand-700 mb-1">
          Unidad de Coordinación Intermunicipal SEDEDE
        </div>
        <h1 class="font-display text-2xl font-bold text-ink sm:text-3xl">
          Apoyo a Mancomunidades y Comunidades Rurales
        </h1>
        <p class="text-sm text-slate-500">
          Gestión del padrón de mancomunidades, verificación legal de expedientes y solicitudes de recursos deportivos rurales.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          v-if="activeTab === 'mancomunidades'"
          type="button"
          @click="openCreateMancomunidad"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Mancomunidad
        </button>

        <button
          v-if="activeTab === 'solicitudes'"
          type="button"
          @click="openNewSolicitud"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Solicitud de Apoyo
        </button>

        <button
          v-if="activeTab === 'recursos'"
          type="button"
          @click="openCreateRecurso"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Recurso
        </button>

        <button
          v-if="activeTab === 'municipios'"
          type="button"
          @click="openCreateMunicipio"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Municipio
        </button>
      </div>
    </div>

    <!-- Indicadores Numéricos -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p class="text-xs font-semibold text-slate-500 uppercase">Mancomunidades</p>
        <p class="font-display text-2xl font-bold text-ink mt-1">{{ stats.totalManc }}</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
        <p class="text-xs font-semibold text-emerald-800 uppercase">Expediente Vigente</p>
        <p class="font-display text-2xl font-bold text-emerald-900 mt-1">{{ stats.vigentes }}</p>
      </div>
      <div class="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-xs">
        <p class="text-xs font-semibold text-navyflag uppercase">Solicitudes en Curso</p>
        <p class="font-display text-2xl font-bold text-navyflag mt-1">{{ stats.solActivas }}</p>
      </div>
      <div class="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
        <p class="text-xs font-semibold text-amber-800 uppercase">Stock Comunitario</p>
        <p class="font-display text-2xl font-bold text-amber-900 mt-1">{{ stats.totalStock }} <span class="text-xs font-normal">unid.</span></p>
      </div>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="border-b border-slate-200">
      <nav class="-mb-px flex space-x-6">
        <button
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'mancomunidades'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'mancomunidades'"
        >
          🏛️ Padrón de Mancomunidades
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ mancomunidades.length }}</span>
        </button>

        <button
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'solicitudes'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'solicitudes'"
        >
          📋 Solicitudes y Apoyo Deportivo
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ solicitudes.length }}</span>
        </button>

        <button
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'recursos'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'recursos'"
        >
          📦 Catálogo de Recursos Prestables
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ recursos.length }}</span>
        </button>

        <button
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'municipios'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'municipios'"
        >
          🗺️ Municipios Integrantes
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ municipios.length }}</span>
        </button>
      </nav>
    </div>

    <!-- 1. PESTAÑA: MANCOMUNIDADES -->
    <div v-if="activeTab === 'mancomunidades'" class="space-y-4">
      <!-- Filtros -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div class="flex-1 max-w-md relative">
          <input
            v-model="searchMancomunidad"
            type="text"
            placeholder="Buscar por nombre, sigla o NIT..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
          />
        </div>

        <div class="flex items-center gap-3">
          <label class="text-xs font-semibold text-slate-500">Estado Legal:</label>
          <select
            v-model="filterEstadoLegal"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-brand-600 focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Pendiente">Pendiente de Expediente</option>
            <option value="Vigente">Vigente (Acreditada)</option>
            <option value="Suspendido">Suspendido</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <!-- Tabla Mancomunidades -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Mancomunidad</th>
              <th class="px-5 py-3">NIT & Constitución</th>
              <th class="px-5 py-3">Estado Legal</th>
              <th class="px-5 py-3">Contacto / Sede</th>
              <th class="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredMancomunidades.length === 0">
              <td colspan="5" class="px-5 py-8 text-center text-slate-500">
                No hay mancomunidades registradas o no coinciden con los filtros.
              </td>
            </tr>
            <tr v-for="m in filteredMancomunidades" :key="m.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4">
                <div class="font-bold text-ink">{{ m.nombre }}</div>
                <div class="text-xs text-slate-500 font-mono">Sigla: {{ m.sigla || 'S/S' }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="font-mono text-xs text-slate-700 font-semibold">{{ m.nit }}</div>
                <div class="text-xs text-slate-500">{{ m.fecha_constitucion ? m.fecha_constitucion.substring(0, 10) : 'Sin fecha' }}</div>
              </td>
              <td class="px-5 py-4">
                <span :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', getEstadoBadgeClass(m.estado_legal)]">
                  {{ m.estado_legal }}
                </span>
              </td>
              <td class="px-5 py-4 text-xs text-slate-600">
                <div>📍 {{ m.direccion || 'No especificada' }}</div>
                <div v-if="m.telefono">📞 {{ m.telefono }}</div>
                <div v-if="m.correo" class="text-slate-400">✉️ {{ m.correo }}</div>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openExpediente(m)"
                    class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Ver expediente documental requerido"
                  >
                    📁 Expediente
                  </button>
                  <button
                    type="button"
                    @click="openMiembros(m)"
                    class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Ver municipios miembros"
                  >
                    👥 Miembros
                  </button>
                  <button
                    type="button"
                    @click="openEditMancomunidad(m)"
                    class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    title="Editar datos"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="m.estado_legal === 'Vigente'"
                    type="button"
                    @click="suspenderMancomunidad(m.id)"
                    class="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    title="Suspender mancomunidad"
                  >
                    ⏸️
                  </button>
                  <button
                    v-if="m.estado_legal === 'Suspendido'"
                    type="button"
                    @click="reactivarMancomunidad(m.id)"
                    class="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    title="Reactivar mancomunidad"
                  >
                    ▶️ Reactivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2. PESTAÑA: SOLICITUDES -->
    <div v-if="activeTab === 'solicitudes'" class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div class="flex-1 max-w-md relative">
          <input
            v-model="searchSolicitud"
            type="text"
            placeholder="Buscar por código (SOL-2026-...) o título..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <select
            v-model="filterTipoSolicitud"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-brand-600 focus:outline-none"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="recursos">Recursos / Implementos</option>
            <option value="espacio">Uso de Escenario / Espacio</option>
          </select>

          <select
            v-model="filterEstadoSolicitud"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-brand-600 focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Borrador">Borrador</option>
            <option value="Enviada">Enviada</option>
            <option value="EnRevision">En Revisión</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Asignada">Asignada (Stock reservado)</option>
            <option value="Completada">Completada</option>
            <option value="Rechazada">Rechazada</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Código</th>
              <th class="px-5 py-3">Título & Tipo</th>
              <th class="px-5 py-3">Detalle del Pedido</th>
              <th class="px-5 py-3">Estado</th>
              <th class="px-5 py-3 text-right">Flujo y Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredSolicitudes.length === 0">
              <td colspan="5" class="px-5 py-8 text-center text-slate-500">
                No hay solicitudes de apoyo deportivo registradas.
              </td>
            </tr>
            <tr v-for="sol in filteredSolicitudes" :key="sol.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4 font-mono font-bold text-xs text-brand-700">
                {{ sol.codigo }}
              </td>
              <td class="px-5 py-4">
                <div class="font-bold text-ink">{{ sol.titulo }}</div>
                <div class="text-xs text-slate-500">
                  Tipo:
                  <span class="font-semibold uppercase text-slate-700">{{ sol.tipo }}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-xs text-slate-600">
                <div v-if="sol.tipo === 'recursos'">
                  <span class="font-semibold">Implementos deportivos solicitados</span>
                </div>
                <div v-else>
                  <div>🏟️ {{ sol.espacio?.nombre || 'Escenario Municipal' }}</div>
                  <div>📅 {{ sol.fecha_uso }} ({{ sol.hora_inicio }} - {{ sol.hora_fin }})</div>
                </div>
                <div v-if="sol.motivo_rechazo" class="text-red-600 mt-1">
                  Rechazo: {{ sol.motivo_rechazo }}
                </div>
                <div v-if="sol.motivo_anulacion" class="text-slate-500 mt-1 italic">
                  Anulada: {{ sol.motivo_anulacion }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', getEstadoBadgeClass(sol.estado)]">
                  {{ sol.estado }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5 flex-wrap">
                  <!-- Botón Enviar (solo Borrador) -->
                  <button
                    v-if="sol.estado === 'Borrador'"
                    type="button"
                    @click="enviarSol(sol)"
                    class="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Enviar
                  </button>

                  <!-- Botón Poner en Revisión (solo Enviada) -->
                  <button
                    v-if="sol.estado === 'Enviada'"
                    type="button"
                    @click="pasarRevisionSol(sol)"
                    class="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Revisar
                  </button>

                  <!-- Botón Resolver (solo EnRevision) -->
                  <button
                    v-if="sol.estado === 'EnRevision'"
                    type="button"
                    @click="openResolverModal(sol, 'resolver')"
                    class="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Resolver
                  </button>

                  <!-- Botón Asignar Stock (solo Aprobada y tipo recursos) -->
                  <button
                    v-if="sol.estado === 'Aprobada' && sol.tipo === 'recursos'"
                    type="button"
                    @click="asignarStockSol(sol)"
                    class="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Asignar Stock
                  </button>

                  <!-- Botón Completar (Asignada o Aprobada) -->
                  <button
                    v-if="['Asignada', 'Aprobada'].includes(sol.estado)"
                    type="button"
                    @click="completarSol(sol)"
                    class="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    Completar
                  </button>

                  <!-- Botón Anular (cualquier estado no terminal) -->
                  <button
                    v-if="!['Completada', 'Rechazada', 'Anulada'].includes(sol.estado)"
                    type="button"
                    @click="openResolverModal(sol, 'anular')"
                    class="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    title="Anular solicitud con motivo"
                  >
                    Anular
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. PESTAÑA: RECURSOS PRESTABLES -->
    <div v-if="activeTab === 'recursos'" class="space-y-4">
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Código</th>
              <th class="px-5 py-3">Nombre del Recurso</th>
              <th class="px-5 py-3">Categoría</th>
              <th class="px-5 py-3">Unidad</th>
              <th class="px-5 py-3">Stock Disponible</th>
              <th class="px-5 py-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="rec in recursos" :key="rec.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4 font-mono font-bold text-xs text-brand-700">{{ rec.codigo }}</td>
              <td class="px-5 py-4 font-bold text-ink">{{ rec.nombre }}</td>
              <td class="px-5 py-4 text-xs">
                <span class="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 uppercase">
                  {{ rec.categoria }}
                </span>
              </td>
              <td class="px-5 py-4 text-xs text-slate-500">{{ rec.unidad }}</td>
              <td class="px-5 py-4 font-mono font-bold text-base text-ink">
                {{ rec.cantidad_disponible }}
              </td>
              <td class="px-5 py-4 text-right">
                <span class="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Habilitado
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. PESTAÑA: MUNICIPIOS -->
    <div v-if="activeTab === 'municipios'" class="space-y-4">
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Código INE</th>
              <th class="px-5 py-3">Nombre del Municipio</th>
              <th class="px-5 py-3">Provincia</th>
              <th class="px-5 py-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="mun in municipios" :key="mun.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4 font-mono text-xs font-bold text-slate-700">{{ mun.codigo }}</td>
              <td class="px-5 py-4 font-bold text-ink">{{ mun.nombre }}</td>
              <td class="px-5 py-4 text-xs text-slate-600">{{ mun.provincia }}</td>
              <td class="px-5 py-4 text-right">
                <span class="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Activo
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL ALTA / EDICIÓN MANCOMUNIDAD -->
    <div v-if="showMancomunidadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 class="font-display text-lg font-bold text-ink mb-4">
          {{ isEditingMancomunidad ? 'Editar Mancomunidad' : 'Registrar Nueva Mancomunidad' }}
        </h3>
        <form @submit.prevent="saveMancomunidad" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nombre Oficial</label>
            <input v-model="mancomunidadForm.nombre" required type="text" placeholder="Ej: Mancomunidad de Municipios del Chaco Chuquisaqueño" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Sigla</label>
              <input v-model="mancomunidadForm.sigla" type="text" placeholder="Ej: MMCH" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">NIT</label>
              <input v-model="mancomunidadForm.nit" required type="text" placeholder="Ej: 1029384756" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Fecha de Constitución</label>
              <input v-model="mancomunidadForm.fecha_constitucion" type="date" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Teléfono</label>
              <input v-model="mancomunidadForm.telefono" type="text" placeholder="+591 4 64XXXX" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Dirección de Sede Principal</label>
            <input v-model="mancomunidadForm.direccion" type="text" placeholder="Calle o Plaza Principal" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input v-model="mancomunidadForm.correo" type="email" placeholder="mancomunidad@chuquisaca.gob.bo" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-3 border-t">
            <button type="button" @click="showMancomunidadModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              Guardar Mancomunidad
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EXPEDIENTE DOCUMENTAL -->
    <div v-if="showExpedienteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-start justify-between border-b pb-3 mb-4">
          <div>
            <h3 class="font-display text-lg font-bold text-ink">
              Expediente Documental Legal: {{ selectedMancomunidad?.nombre }}
            </h3>
            <p class="text-xs text-slate-500">
              Para estar en estado Vigente se exigen los 5 documentos legalmente aprobados.
            </p>
          </div>
          <button @click="showExpedienteModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <!-- Checklist de Requisitos -->
        <div class="space-y-3 mb-6">
          <h4 class="text-xs font-bold uppercase text-slate-700">Checklist de los 5 Documentos Obligatorios</h4>
          <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 p-2">
            <div
              v-for="tipo in tiposDocumentos"
              :key="tipo.value"
              class="flex items-center justify-between p-2.5 text-xs"
            >
              <div class="flex items-center gap-2">
                <span v-if="expedienteDocs.some(d => d.tipo === tipo.value && d.estado_verificacion === 'Aprobado')" class="text-emerald-600 font-bold">✓</span>
                <span v-else-if="expedienteDocs.some(d => d.tipo === tipo.value && d.estado_verificacion === 'Pendiente')" class="text-amber-500 font-bold">⏳</span>
                <span v-else class="text-red-500 font-bold">✗</span>
                <span class="font-medium text-slate-800">{{ tipo.label }}</span>
              </div>

              <div>
                <span
                  v-if="expedienteDocs.find(d => d.tipo === tipo.value)"
                  :class="['rounded px-2 py-0.5 text-[11px] font-bold', getEstadoBadgeClass(expedienteDocs.find(d => d.tipo === tipo.value).estado_verificacion)]"
                >
                  {{ expedienteDocs.find(d => d.tipo === tipo.value).estado_verificacion }}
                </span>
                <span v-else class="text-[11px] font-semibold text-slate-400">Falta subir</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Subir Documento -->
        <div class="rounded-xl border border-brand-200 bg-brand-50/30 p-4 mb-6">
          <h4 class="text-xs font-bold text-brand-900 mb-2">Cargar Documento al Expediente</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div class="text-xs">
              <label class="block font-semibold text-slate-700 mb-1">Tipo Requerido</label>
              <select v-model="newDocType" class="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white">
                <option v-for="t in tiposDocumentos" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="text-xs">
              <label class="block font-semibold text-slate-700 mb-1">Archivo (PDF, Imagen)</label>
              <input type="file" @change="handleFileSelect" class="w-full text-xs text-slate-600 file:rounded-md file:border-0 file:bg-brand-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white" />
            </div>
            <div>
              <button
                type="button"
                :disabled="uploadingDoc || !newDocFile"
                @click="uploadDocumento"
                class="w-full btn-primary text-xs py-2 disabled:opacity-50"
              >
                {{ uploadingDoc ? 'Subiendo...' : 'Subir Archivo' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla de Documentos Subidos con Aprobación/Rechazo -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase text-slate-700">Documentos del Archivo Digital</h4>
          <table class="w-full text-xs text-left divide-y divide-slate-200 border rounded-lg overflow-hidden">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th class="p-2.5">Documento</th>
                <th class="p-2.5">Archivo</th>
                <th class="p-2.5">Estado</th>
                <th class="p-2.5 text-right">Revisión SEDEDE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="d in expedienteDocs" :key="d.id" class="hover:bg-slate-50">
                <td class="p-2.5 font-bold text-slate-800">{{ d.tipo }}</td>
                <td class="p-2.5 font-mono text-[11px] text-slate-500">{{ d.nombre_archivo }}</td>
                <td class="p-2.5">
                  <span :class="['rounded px-2 py-0.5 text-[10px] font-bold', getEstadoBadgeClass(d.estado_verificacion)]">
                    {{ d.estado_verificacion }}
                  </span>
                </td>
                <td class="p-2.5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="d.estado_verificacion !== 'Aprobado'"
                      type="button"
                      @click="aprobarDoc(d)"
                      class="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      Aprobar
                    </button>
                    <button
                      v-if="d.estado_verificacion !== 'Rechazado'"
                      type="button"
                      @click="rechazarDoc(d)"
                      class="rounded bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-between items-center border-t pt-4">
          <button
            type="button"
            @click="verificarYOficializarExpediente"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1.5"
          >
            🛡️ Oficializar y Dejar Vigente
          </button>
          <button type="button" @click="showExpedienteModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL MIEMBROS -->
    <div v-if="showMiembrosModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 class="font-display text-lg font-bold text-ink mb-1">
          Municipios Miembros: {{ selectedMancomunidad?.nombre }}
        </h3>
        <p class="text-xs text-slate-500 mb-4">Padrón de municipios integrados y sus autoridades designadas.</p>

        <!-- Formulario agregar miembro -->
        <div class="rounded-xl border bg-slate-50 p-3 mb-4 space-y-2 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Municipio</label>
              <select v-model="nuevoMiembro.municipio_id" class="w-full rounded-md border p-1.5 bg-white">
                <option value="">Seleccione municipio</option>
                <option v-for="m in municipios" :key="m.id" :value="m.id">{{ m.nombre }} ({{ m.provincia }})</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Cargo</label>
              <select v-model="nuevoMiembro.cargo" class="w-full rounded-md border p-1.5 bg-white">
                <option value="alcalde">Alcalde Municipal</option>
                <option value="presidente">Presidente</option>
                <option value="secretario">Secretario</option>
              </select>
            </div>
          </div>
          <button type="button" @click="addMiembroToMancomunidad" class="w-full btn-primary text-xs py-1.5">
            + Afiliar Municipio
          </button>
        </div>

        <div class="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          <div v-for="mb in miembrosList" :key="mb.id" class="py-2 flex items-center justify-between text-xs">
            <div>
              <p class="font-bold text-slate-800">{{ mb.municipio?.nombre }}</p>
              <p class="text-[11px] text-slate-500 uppercase">{{ mb.cargo }}</p>
            </div>
            <button
              type="button"
              @click="deleteMiembroFromMancomunidad(mb.id)"
              class="text-xs text-red-600 hover:text-red-800"
            >
              Desafiliar
            </button>
          </div>
        </div>

        <div class="mt-4 flex justify-end border-t pt-3">
          <button type="button" @click="showMiembrosModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA SOLICITUD -->
    <div v-if="showSolicitudModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="font-display text-lg font-bold text-ink mb-1">
          Nueva Solicitud de Apoyo Comunitario
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Solicitud de materiales deportivos prestables o uso preferente de escenarios para municipios.
        </p>

        <form @submit.prevent="saveSolicitud" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Mancomunidad Solicitante</label>
            <select v-model="solicitudForm.solicitante_id" required class="w-full rounded-lg border p-2 text-sm bg-white">
              <option v-for="m in mancomunidades" :key="m.id" :value="m.id">
                {{ m.nombre }} ({{ m.sigla || m.nit }}) - {{ m.estado_legal }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Tipo de Apoyo</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                :class="[
                  'rounded-lg border p-2.5 font-bold transition-colors text-center',
                  solicitudForm.tipo === 'recursos' ? 'bg-brand-50 border-brand-600 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                ]"
                @click="solicitudForm.tipo = 'recursos'"
              >
                📦 Implementos / Recursos
              </button>
              <button
                type="button"
                :class="[
                  'rounded-lg border p-2.5 font-bold transition-colors text-center',
                  solicitudForm.tipo === 'espacio' ? 'bg-brand-50 border-brand-600 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                ]"
                @click="solicitudForm.tipo = 'espacio'"
              >
                🏟️ Escenario Deportivo
              </button>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Título de la Solicitud / Proyecto</label>
            <input v-model="solicitudForm.titulo" required type="text" placeholder="Ej: Campeonato Intercomunal de Fútbol de Salón" class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Justificación / Descripción</label>
            <textarea v-model="solicitudForm.descripcion" rows="2" placeholder="Describa el objetivo social o deportivo..." class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none"></textarea>
          </div>

          <!-- Campos específicos: Recursos -->
          <div v-if="solicitudForm.tipo === 'recursos'" class="space-y-2 border-t pt-3">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-800">Renglones de Materiales Solicitados</label>
              <button type="button" @click="addRenglonRecurso" class="text-xs font-semibold text-brand-600 hover:text-brand-800">
                + Añadir Ítem
              </button>
            </div>

            <div v-for="(item, idx) in solicitudForm.recursos" :key="idx" class="flex items-center gap-2">
              <select v-model="item.recurso_id" required class="flex-1 rounded-md border p-1.5 text-xs bg-white">
                <option v-for="r in recursos" :key="r.id" :value="r.id">
                  {{ r.nombre }} (Stock: {{ r.cantidad_disponible }} {{ r.unidad }})
                </option>
              </select>
              <input v-model.number="item.cantidad_solicitada" min="1" type="number" class="w-20 rounded-md border p-1.5 text-xs font-bold" />
              <button type="button" @click="removeRenglonRecurso(idx)" class="text-red-500 font-bold px-1">✕</button>
            </div>
          </div>

          <!-- Campos específicos: Espacio -->
          <div v-else class="space-y-3 border-t pt-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Escenario / Cancha Solicitada</label>
              <select v-model="solicitudForm.espacio_id" required class="w-full rounded-lg border p-2 text-xs bg-white">
                <option v-for="esc in escenarios" :key="esc.id" :value="esc.id">
                  {{ esc.nombre }} - {{ esc.espacio }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Actividad</label>
              <input v-model="solicitudForm.actividad" required type="text" placeholder="Ej: Inauguración de Juegos Deportivos Rurales" class="w-full rounded-lg border p-2 text-xs text-ink" />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Fecha</label>
                <input v-model="solicitudForm.fecha_uso" required type="date" class="w-full rounded-lg border p-1.5 text-xs" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Hora Inicio</label>
                <input v-model="solicitudForm.hora_inicio" required type="time" class="w-full rounded-lg border p-1.5 text-xs" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Hora Fin</label>
                <input v-model="solicitudForm.hora_fin" required type="time" class="w-full rounded-lg border p-1.5 text-xs" />
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-3 border-t">
            <button type="button" @click="showSolicitudModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              Guardar en Borrador
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL RESOLVER / ANULAR TRANSICIÓN -->
    <div v-if="showTransicionModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-xs space-y-4">
        <h3 class="font-display text-base font-bold text-ink">
          {{ transicionData.titulo }}
        </h3>

        <div v-if="transicionData.accion === 'resolver'">
          <label class="block font-semibold text-slate-700 mb-1">Decisión Técnica</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :class="[
                'p-2.5 rounded-lg border font-bold text-center',
                transicionData.decision === 'aprobar' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-600'
              ]"
              @click="transicionData.decision = 'aprobar'"
            >
              ✓ Aprobar Solicitud
            </button>
            <button
              type="button"
              :class="[
                'p-2.5 rounded-lg border font-bold text-center',
                transicionData.decision === 'rechazar' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 text-slate-600'
              ]"
              @click="transicionData.decision = 'rechazar'"
            >
              ✗ Rechazar Solicitud
            </button>
          </div>
        </div>

        <div v-if="transicionData.decision === 'rechazar' || transicionData.accion === 'anular'">
          <label class="block font-semibold text-slate-700 mb-1">
            Motivo Obligatorio
          </label>
          <textarea
            v-model="transicionData.motivo"
            rows="3"
            required
            placeholder="Especifique las razones técnicas o presupuestarias..."
            class="w-full rounded-lg border p-2 text-xs focus:border-brand-600 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 border-t pt-3">
          <button type="button" @click="showTransicionModal = false" class="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            Cancelar
          </button>
          <button type="button" @click="executeTransicion" class="btn-primary">
            Confirmar Decisión
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL RECURSO -->
    <div v-if="showRecursoModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-xs space-y-3">
        <h3 class="font-display text-base font-bold text-ink">
          Registrar Recurso de Apoyo Comunitario
        </h3>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Código</label>
          <input v-model="recursoForm.codigo" required type="text" class="w-full rounded-lg border p-2 font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nombre</label>
          <input v-model="recursoForm.nombre" required type="text" placeholder="Ej: Balones oficiales de fútbol y futsal" class="w-full rounded-lg border p-2" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Categoría</label>
            <select v-model="recursoForm.categoria" class="w-full rounded-lg border p-2 bg-white">
              <option value="implemento">Implemento</option>
              <option value="equipamiento">Equipamiento</option>
              <option value="indumentaria">Indumentaria</option>
              <option value="senalizacion">Señalización</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Unidad</label>
            <input v-model="recursoForm.unidad" required type="text" placeholder="unidad, kit, juego" class="w-full rounded-lg border p-2" />
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Cantidad Inicial Disponible</label>
          <input v-model.number="recursoForm.cantidad_disponible" min="0" required type="number" class="w-full rounded-lg border p-2 font-bold" />
        </div>
        <div class="flex justify-end gap-2 border-t pt-3">
          <button type="button" @click="showRecursoModal = false" class="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            Cancelar
          </button>
          <button type="button" @click="saveRecurso" class="btn-primary">
            Guardar Recurso
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL MUNICIPIO -->
    <div v-if="showMunicipioModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-xs space-y-3">
        <h3 class="font-display text-base font-bold text-ink">
          Registrar Municipio de Chuquisaca
        </h3>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Código INE</label>
          <input v-model="municipioForm.codigo" required type="text" placeholder="Ej: 0101" class="w-full rounded-lg border p-2 font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nombre</label>
          <input v-model="municipioForm.nombre" required type="text" placeholder="Ej: Tarabuco, Camargo, Monteagudo..." class="w-full rounded-lg border p-2" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Provincia</label>
          <input v-model="municipioForm.provincia" required type="text" placeholder="Ej: Yamparáez, Nor Cinti, Hernando Siles..." class="w-full rounded-lg border p-2" />
        </div>
        <div class="flex justify-end gap-2 border-t pt-3">
          <button type="button" @click="showMunicipioModal = false" class="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            Cancelar
          </button>
          <button type="button" @click="saveMunicipio" class="btn-primary">
            Guardar Municipio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
