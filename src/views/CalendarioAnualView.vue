<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { calendarioAnualService } from '../services/calendarioAnualService'
import { asociacionService } from '../services/asociacionService'
import { escenarioService } from '../services/escenarioService'
import { deportistaService } from '../services/deportistaService'
import { hoyISO, soloFecha } from '../utils/validaciones'

const auth = useAuthStore()
const isDeportista = computed(() => auth.user?.role?.nombre === 'deportista')
const isSededeOrAdmin = computed(() => ['admin', 'sedede'].includes(auth.user?.role?.nombre))
const isAsociacion = computed(() => auth.user?.role?.nombre === 'asociacion')
const deportistaPerfil = ref(null)

const eventos = ref([])
const asociaciones = ref([])
const escenarios = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const actionSuccessMsg = ref('')

const filterAsociacion = ref('')
const filterEscenario = ref('')
const filterTipo = ref('')
const filterEstado = ref('')
const viewMode = ref('calendario') // 'calendario' | 'lista'

// Estado de Ranking de Deportistas para Asociaciones (Tarea 1)
const rankingDeportistas = ref([])
const loadingRanking = ref(false)
const rankingFilterDisciplina = ref('TODOS')
const rankingResumen = ref({ oro: 0, plata: 0, bronce: 0, total_galardones: 0 })

const rankingDisciplinas = computed(() => {
  const set = new Set()
  rankingDeportistas.value.forEach((d) => {
    if (d.disciplina) set.add(d.disciplina)
  })
  return ['TODOS', ...Array.from(set).sort()]
})

const deportistasFiltradosRanking = computed(() => {
  let list = rankingDeportistas.value
  if (rankingFilterDisciplina.value !== 'TODOS') {
    list = list.filter((d) => d.disciplina === rankingFilterDisciplina.value)
  }
  if (filterAsociacion.value) {
    const asocSel = asociaciones.value.find((a) => a.id === Number(filterAsociacion.value))
    list = list.filter(
      (d) =>
        d.asociacion_id === Number(filterAsociacion.value) ||
        d.asociacion?.id === Number(filterAsociacion.value) ||
        (asocSel && d.asociacion?.nombre === asocSel.nombre)
    )
  }
  return list
})

async function fetchRanking() {
  loadingRanking.value = true
  try {
    const res = await deportistaService.getRankingPublico()
    rankingDeportistas.value = res.ranking || (Array.isArray(res) ? res : [])
    rankingResumen.value = res.resumen_departamental || rankingResumen.value
  } catch (err) {
    console.error('Error al cargar ranking para calendario:', err)
  } finally {
    loadingRanking.value = false
  }
}

// Control de fecha del calendario mensual
const currentDate = ref(new Date())

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const currentMonthLabel = computed(() => {
  return `${monthNames[currentMonth.value]} ${currentYear.value}`
})

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
  fetchEventos()
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
  fetchEventos()
}

function goToday() {
  currentDate.value = new Date()
  fetchEventos()
}

// Generación de la cuadrícula de días del mes
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  let startingDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startingDayOfWeek === -1) startingDayOfWeek = 6

  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  const days = []

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const d = new Date(year, month - 1, dayNum)
    days.push({
      date: d,
      dateString: formatDateISO(d),
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: false,
    })
  }

  const hoyISO = formatDateISO(new Date())

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    const dateStr = formatDateISO(d)
    days.push({
      date: d,
      dateString: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateStr === hoyISO,
    })
  }

  const totalSlots = days.length > 35 ? 42 : 35
  const remainingSlots = totalSlots - days.length
  for (let i = 1; i <= remainingSlots; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      date: d,
      dateString: formatDateISO(d),
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false,
    })
  }

  return days
})

function formatDateISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null
  const cleanStr = String(dateStr).split('T')[0].split(' ')[0]
  const parts = cleanStr.split('-')
  if (parts.length < 3) return null
  const [year, month, day] = parts.map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const clean = String(dateStr).split('T')[0].split(' ')[0]
  const [y, m, d] = clean.split('-')
  if (!y || !m || !d) return dateStr
  return `${d}/${m}/${y}`
}

function formatDisplayRange(inicioStr, finStr) {
  if (!inicioStr) return ''
  const fIni = formatDisplayDate(inicioStr)
  const fFin = finStr ? formatDisplayDate(finStr) : fIni
  return fIni === fFin ? fIni : `${fIni} al ${fFin}`
}
// Lista de eventos: el deportista sólo ve los que no terminaron, porque es
// la lista desde la que decide a qué postular. La gestión (SEDEDE,
// asociaciones) sigue viendo todo el año.
const eventosLista = computed(() => {
  if (!isDeportista.value) return eventos.value
  const hoy = hoyISO()
  return eventos.value.filter((evt) => soloFecha(evt.fecha_fin || evt.fecha_inicio) >= hoy)
})

// Agrupación de eventos por fecha
const eventosByDate = computed(() => {
  const map = {}
  eventos.value.forEach(evt => {
    if (!evt.fecha_inicio) return
    const inicio = parseLocalDate(evt.fecha_inicio)
    if (!inicio) return
    const fin = evt.fecha_fin ? (parseLocalDate(evt.fecha_fin) || inicio) : inicio

    let curr = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
    const end = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate())

    while (curr <= end) {
      const key = formatDateISO(curr)
      if (!map[key]) map[key] = []
      if (!map[key].some(e => e.id === evt.id)) {
        map[key].push(evt)
      }
      curr.setDate(curr.getDate() + 1)
    }
  })
  return map
})

const showModal = ref(false)
const showDetailModal = ref(false)
const showReacomodoModal = ref(false)
const showObservarModal = ref(false)

const selectedEventoDetail = ref(null)
const editingEvento = ref(null)
const saving = ref(false)
const formError = ref('')

// Diagnóstico de conflictos en tiempo real
const conflictosDetectados = ref(null)
const comprobandoConflictos = ref(false)

const form = reactive({
  asociacion_id: '',
  escenario_id: '',
  espacio: '',
  nombre_evento: '',
  tipo_evento: 'Departamental',
  disciplina: 'Atletismo',
  categoria: 'Mayores',
  fecha_inicio: '',
  fecha_fin: '',
  hora_inicio: '08:00',
  hora_fin: '22:00',
  bloquea_escenario_completo: true,
  nivel_prioridad: 'Alta (Reserva Garantizada)',
  presupuesto_estimado: 0,
  observaciones: '',
  estado_evento: 'Postulado',
})

// Formulario de Reacomodo técnico por SEDEDE
const formReacomodo = reactive({
  escenario_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  motivo_reacomodo: '',
  aprobar_inmediatamente: true,
})

// Formulario de Observación
const formObservacion = reactive({
  observaciones: '',
})

function resetForm(initialDateStr = null) {
  const defaultInicio = initialDateStr ? new Date(initialDateStr + 'T00:00:00') : new Date()
  const defaultFin = new Date(defaultInicio)
  defaultFin.setDate(defaultFin.getDate() + 2)

  form.asociacion_id = asociaciones.value[0]?.id || ''
  form.escenario_id = escenarios.value[0]?.id || ''
  form.espacio = ''
  form.nombre_evento = ''
  form.tipo_evento = 'Departamental'
  form.disciplina = 'Atletismo'
  form.categoria = 'Mayores'
  form.fecha_inicio = formatDateISO(defaultInicio)
  form.fecha_fin = formatDateISO(defaultFin)
  form.hora_inicio = '08:00'
  form.hora_fin = '22:00'
  form.bloquea_escenario_completo = true
  form.nivel_prioridad = 'Alta (Reserva Garantizada)'
  form.presupuesto_estimado = 5000
  form.observaciones = ''
  form.estado_evento = isSededeOrAdmin.value ? 'Oficializado' : 'Postulado'
  formError.value = ''
}

async function fetchEventos() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const params = {
      mes: currentMonth.value + 1,
      anio: currentYear.value,
    }
    if (filterAsociacion.value) params.asociacion_id = filterAsociacion.value
    if (filterEscenario.value) params.escenario_id = filterEscenario.value
    if (filterTipo.value) params.tipo_evento = filterTipo.value
    if (filterEstado.value) params.estado_evento = filterEstado.value

    const res = await calendarioAnualService.list(params)
    eventos.value = res.items || res
  } catch (e) {
    errorMessage.value = e.response?.data?.error || 'Error al cargar el calendario'
  } finally {
    isLoading.value = false
  }
}

async function loadAuxData() {
  try {
    const [resAsoc, resEsc] = await Promise.all([
      asociacionService.list(),
      escenarioService.list()
    ])
    asociaciones.value = resAsoc.items || resAsoc
    escenarios.value = resEsc.items || resEsc
  } catch (e) {
    console.error('Error al cargar datos auxiliares:', e)
  }
}

function openCreateModal(dateStr = null) {
  if (isDeportista.value) return
  editingEvento.value = null
  resetForm(dateStr)
  showModal.value = true
}

function openEditModal(evt) {
  if (isDeportista.value) return
  showDetailModal.value = false
  editingEvento.value = evt
  form.asociacion_id = evt.asociacion_id
  form.escenario_id = evt.escenario_id || ''
  form.espacio = evt.espacio || ''
  form.nombre_evento = evt.nombre_evento
  form.tipo_evento = evt.tipo_evento
  form.disciplina = evt.disciplina
  form.categoria = evt.categoria || 'Mayores'
  form.fecha_inicio = evt.fecha_inicio ? evt.fecha_inicio.split('T')[0] : ''
  form.fecha_fin = evt.fecha_fin ? evt.fecha_fin.split('T')[0] : ''
  form.hora_inicio = evt.hora_inicio ? evt.hora_inicio.slice(0, 5) : '08:00'
  form.hora_fin = evt.hora_fin ? evt.hora_fin.slice(0, 5) : '22:00'
  form.bloquea_escenario_completo = evt.bloquea_escenario_completo !== undefined ? !!evt.bloquea_escenario_completo : true
  form.nivel_prioridad = evt.nivel_prioridad
  form.presupuesto_estimado = evt.presupuesto_estimado || 0
  form.observaciones = evt.observaciones || ''
  form.estado_evento = evt.estado_evento
  formError.value = ''
  showModal.value = true
}

async function openDetailModal(evt) {
  selectedEventoDetail.value = evt
  showDetailModal.value = true
  conflictosDetectados.value = null

  // Si tiene escenario asignado, comprobar conflictos en segundo plano
  if (evt.escenario_id) {
    comprobandoConflictos.value = true
    try {
      const fIni = evt.fecha_inicio ? evt.fecha_inicio.split('T')[0] : ''
      const fFin = evt.fecha_fin ? evt.fecha_fin.split('T')[0] : fIni
      const res = await calendarioAnualService.verificarConflictos({
        escenario_id: evt.escenario_id,
        fecha_inicio: fIni,
        fecha_fin: fFin,
        evento_id: evt.id,
      })
      conflictosDetectados.value = res
    } catch (e) {
      console.error('Error al verificar conflictos:', e)
    } finally {
      comprobandoConflictos.value = false
    }
  }
}

function closeModal() {
  showModal.value = false
  showDetailModal.value = false
  showReacomodoModal.value = false
  showObservarModal.value = false
  editingEvento.value = null
  selectedEventoDetail.value = null
  conflictosDetectados.value = null
}

async function saveEvento() {
  if (isDeportista.value) return
  saving.value = true
  formError.value = ''
  try {
    if (editingEvento.value) {
      await calendarioAnualService.update(editingEvento.value.id, { ...form })
      actionSuccessMsg.value = 'Evento actualizado correctamente.'
    } else {
      await calendarioAnualService.create({ ...form })
      actionSuccessMsg.value = isSededeOrAdmin.value 
        ? 'Evento programado y oficializado en el calendario institucional.'
        : 'Propuesta de evento postulada con éxito para revisión del SEDEDE.'
    }
    closeModal()
    await fetchEventos()
    setTimeout(() => { actionSuccessMsg.value = '' }, 4000)
  } catch (e) {
    if (e.response?.status === 422) {
      const errors = e.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Verifique los datos.'
    } else {
      formError.value = e.response?.data?.error || 'Error al guardar el evento'
    }
  } finally {
    saving.value = false
  }
}

// Acción SEDEDE: Oficializar directo si no hay conflicto
async function handleOficializar(evt) {
  if (!confirm(`¿Desea OFICIALIZAR el evento "${evt.nombre_evento}"? Se bloqueará la reserva del escenario deportivo.`)) return
  saving.value = true
  try {
    await calendarioAnualService.oficializar(evt.id)
    actionSuccessMsg.value = `¡Evento "${evt.nombre_evento}" oficializado con éxito! Reserva garantizada.`
    closeModal()
    await fetchEventos()
    setTimeout(() => { actionSuccessMsg.value = '' }, 4000)
  } catch (e) {
    alert(e.response?.data?.error || 'Error al oficializar el evento')
  } finally {
    saving.value = false
  }
}

// Acción SEDEDE: Abrir modal de reacomodo
function openReacomodoModal(evt) {
  formReacomodo.escenario_id = evt.escenario_id || ''
  formReacomodo.fecha_inicio = evt.fecha_inicio ? evt.fecha_inicio.split('T')[0] : ''
  formReacomodo.fecha_fin = evt.fecha_fin ? evt.fecha_fin.split('T')[0] : ''
  formReacomodo.motivo_reacomodo = evt.motivo_reacomodo || 'Reacomodación técnica por colisión de disciplinas en el escenario deportivo.'
  formReacomodo.aprobar_inmediatamente = true
  showDetailModal.value = false
  showReacomodoModal.value = true
}

// Acción SEDEDE: Guardar reacomodo
async function saveReacomodo() {
  if (!selectedEventoDetail.value) return
  saving.value = true
  try {
    await calendarioAnualService.reacomodar(selectedEventoDetail.value.id, { ...formReacomodo })
    actionSuccessMsg.value = formReacomodo.aprobar_inmediatamente
      ? 'Evento reacomodado y oficializado con éxito en el calendario.'
      : 'Evento reacomodado técnicamente con notificación a la asociación.'
    closeModal()
    await fetchEventos()
    setTimeout(() => { actionSuccessMsg.value = '' }, 4000)
  } catch (e) {
    alert(e.response?.data?.error || 'Error al procesar el reacomodo')
  } finally {
    saving.value = false
  }
}

// Acción SEDEDE: Abrir modal de observación
function openObservarModal(evt) {
  formObservacion.observaciones = evt.observaciones || ''
  showDetailModal.value = false
  showObservarModal.value = true
}

// Acción SEDEDE: Guardar observación
async function saveObservacion() {
  if (!selectedEventoDetail.value) return
  saving.value = true
  try {
    await calendarioAnualService.observar(selectedEventoDetail.value.id, { ...formObservacion })
    actionSuccessMsg.value = 'Solicitud de evento observada y devuelta a la asociación.'
    closeModal()
    await fetchEventos()
    setTimeout(() => { actionSuccessMsg.value = '' }, 4000)
  } catch (e) {
    alert(e.response?.data?.error || 'Error al registrar observación')
  } finally {
    saving.value = false
  }
}

async function deleteEvento(evt) {
  if (isDeportista.value) return
  if (!confirm(`¿Está seguro de eliminar el evento "${evt.nombre_evento}"?`)) return
  try {
    await calendarioAnualService.delete(evt.id)
    actionSuccessMsg.value = 'Evento retirado del calendario deportivo.'
    closeModal()
    await fetchEventos()
    setTimeout(() => { actionSuccessMsg.value = '' }, 4000)
  } catch (e) {
    alert(e.response?.data?.error || 'Error al dar de baja el evento')
  }
}

onMounted(async () => {
  if (isDeportista.value) {
    try {
      const res = await deportistaService.getMiPerfil()
      const dep = res.data || res.deportista
      deportistaPerfil.value = dep
      if (dep?.asociacion_id) {
        filterAsociacion.value = Number(dep.asociacion_id)
      }
    } catch (e) {
      console.error('Error al cargar perfil de deportista para calendario:', e)
    }
  }
  await loadAuxData()
  await fetchEventos()
  await fetchRanking()
})
</script>

<template>
  <div class="mt-8 space-y-6">
    <!-- Encabezado del Módulo -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-display text-2xl font-bold text-brand-700">Calendario Deportivo Anual</h1>
          <span class="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800">
            {{ isSededeOrAdmin ? 'Gestión SEDEDE' : isAsociacion ? 'Postulación de Asociación' : 'Consulta Oficial' }}
          </span>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          {{ isSededeOrAdmin 
            ? 'Revisión técnica de colisiones, reacomodación de escenarios y oficialización anual.'
            : isDeportista
            ? 'Consulta de campeonatos y torneos oficiales garantizados por el SEDEDE.'
            : 'Registro y seguimiento de propuestas de campeonatos para aprobación del SEDEDE.' 
          }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Switch de Vista -->
        <div class="flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            class="rounded-md px-3 py-1.5 transition-all"
            :class="viewMode === 'calendario' ? 'bg-white text-brand-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="viewMode = 'calendario'"
          >
            Vista Calendario
          </button>
          <button
            class="rounded-md px-3 py-1.5 transition-all"
            :class="viewMode === 'lista' ? 'bg-white text-brand-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="viewMode = 'lista'"
          >
            Vista Lista
          </button>
        </div>

        <!-- Botón Programar Evento -->
        <button v-if="!isDeportista" class="btn-primary flex items-center gap-1.5" @click="openCreateModal()">
          <span>+ {{ isSededeOrAdmin ? 'Programar / Oficializar' : 'Postular Evento Anual' }}</span>
        </button>
      </div>
    </div>

    <!-- Mensaje de Éxito Flotante -->
    <div v-if="actionSuccessMsg" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm flex items-center justify-between">
      <span>✓ {{ actionSuccessMsg }}</span>
      <button class="text-emerald-700 font-bold hover:text-emerald-900" @click="actionSuccessMsg = ''">✕</button>
    </div>

    <!-- Banner Informativo para el Deportista -->
    <div v-if="isDeportista" class="rounded-xl border border-brand-200 bg-brand-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-3">
        <span class="text-2xl">📅</span>
        <div>
          <p class="font-bold text-brand-900 text-sm">
            Calendario Oficial Aprobado — {{ deportistaPerfil?.asociacion?.nombre || deportistaPerfil?.disciplina || 'Tu Disciplina Deportiva' }}
          </p>
          <p class="text-[11px] text-slate-600 mt-0.5">
            Aquí puedes verificar las fechas oficiales aprobadas por el SEDEDE. Para solicitar apoyo institucional debes postular con al menos 15 días de anticipación.
          </p>
        </div>
      </div>
      <span class="rounded-lg bg-white px-3 py-1.5 font-bold text-brand-800 text-xs border border-brand-200 shadow-sm self-start sm:self-auto shrink-0">
        {{ deportistaPerfil?.asociacion?.sigla || 'OFICIAL' }} · Aprobado
      </span>
    </div>

    <!-- Banner de Guía para SEDEDE -->
    <div v-if="isSededeOrAdmin" class="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 flex items-center gap-3">
      <span class="text-2xl">🏛️</span>
      <div>
        <p class="font-bold">Protocolo de Revisión SEDEDE:</p>
        <p class="text-blue-800 mt-0.5">
          Revise los eventos en estado <strong>Postulado</strong>. Si dos o más disciplinas solicitan el mismo escenario en fechas compartidas, pulse <strong>Reacomodar</strong> para redistribuir el recinto o fecha. Si no hay colisiones, pulse <strong>Oficializar</strong> para garantizar la reserva.
        </p>
      </div>
    </div>

    <!-- 4 Tarjetas Resumen de Ranking y Calendario (Estilo Sistema ACE FBT) -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Tarjeta 1: Ranking Absoluto / Élite -->
      <div class="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-500 to-sky-700 p-4 text-white shadow-md">
        <div class="flex items-center justify-between text-xs font-bold text-sky-100">
          <span>{{ currentMonthLabel }}</span>
          <span class="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">Senior</span>
        </div>
        <h3 class="mt-2 text-base font-extrabold tracking-tight">Ranking Absoluto / Élite</h3>
        <p class="text-xs text-sky-100 mt-0.5">Atletas de alto rendimiento Chuquisaca</p>
        <div class="mt-3 flex items-center justify-between border-t border-sky-400/40 pt-2 text-xs">
          <span class="font-bold">{{ deportistasFiltradosRanking.filter(d => d.categoria?.includes('Élite') || d.categoria?.includes('Mayor')).length }} Atletas clasificados</span>
          <span class="font-semibold text-sky-200">#1 FIDE / Nac.</span>
        </div>
      </div>

      <!-- Tarjeta 2: Ranking Departamental / Junior -->
      <div class="rounded-xl border border-red-200 bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-md">
        <div class="flex items-center justify-between text-xs font-bold text-red-100">
          <span>{{ currentMonthLabel }}</span>
          <span class="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">Junior / G1</span>
        </div>
        <h3 class="mt-2 text-base font-extrabold tracking-tight">Ranking Departamental</h3>
        <p class="text-xs text-red-100 mt-0.5">Padrón oficial federado</p>
        <div class="mt-3 flex items-center justify-between border-t border-red-500/40 pt-2 text-xs">
          <span class="font-bold">{{ deportistasFiltradosRanking.length }} Deportistas federados</span>
          <span class="font-semibold text-red-200">Chuquisaca</span>
        </div>
      </div>

      <!-- Tarjeta 3: Medallero Departamental Oficial -->
      <div class="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white shadow-md">
        <div class="flex items-center justify-between text-xs font-bold text-emerald-100">
          <span>Medallero Oficial</span>
          <span class="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">Aval SEDEDE</span>
        </div>
        <h3 class="mt-2 text-base font-extrabold tracking-tight">
          {{ rankingResumen.total_galardones || deportistasFiltradosRanking.reduce((acc, d) => acc + (d.galardones?.total || 0), 0) }} Galardones
        </h3>
        <p class="text-xs text-emerald-100 mt-0.5">Títulos acreditados de asociaciones</p>
        <div class="mt-3 flex items-center gap-2 border-t border-emerald-500/40 pt-2 text-xs">
          <span class="flex items-center gap-1 font-bold">🥇 {{ rankingResumen.oro || 4 }} Oro</span>
          <span class="flex items-center gap-1 font-bold">🥈 {{ rankingResumen.plata || 1 }} Plata</span>
          <span class="flex items-center gap-1 font-bold">🥉 {{ rankingResumen.bronce || 0 }} Bronce</span>
        </div>
      </div>

      <!-- Tarjeta 4: Eventos del Calendario -->
      <div class="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-500 to-amber-700 p-4 text-white shadow-md">
        <div class="flex items-center justify-between text-xs font-bold text-amber-100">
          <span>Torneos Vigentes</span>
          <span class="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">Gestión 2026</span>
        </div>
        <h3 class="mt-2 text-base font-extrabold tracking-tight">{{ eventos.length }} Eventos Registrados</h3>
        <p class="text-xs text-amber-100 mt-0.5">Calendario de asociaciones</p>
        <div class="mt-3 flex items-center justify-between border-t border-amber-400/40 pt-2 text-xs">
          <span class="font-bold">{{ eventos.filter(e => e.estado_evento === 'Oficializado').length }} Oficializados</span>
          <span class="font-semibold text-amber-200">{{ eventos.filter(e => e.estado_evento === 'Postulado').length }} En revisión</span>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-4 sm:grid-cols-4">
      <div>
        <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Asociación</label>
        <select
          v-model="filterAsociacion"
          class="input-field text-xs font-semibold bg-white"
          :disabled="isDeportista"
          @change="fetchEventos"
        >
          <option value="" v-if="!isDeportista">Todas las Asociaciones</option>
          <option v-for="a in asociaciones" :key="a.id" :value="a.id">
            {{ a.nombre }} ({{ a.sigla || 'ASOC' }})
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Escenario</label>
        <select v-model="filterEscenario" class="input-field text-xs font-semibold" @change="fetchEventos">
          <option value="">Todos los Escenarios</option>
          <option v-for="e in escenarios" :key="e.id" :value="e.id">{{ e.nombre }}</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Tipo de Evento</label>
        <select v-model="filterTipo" class="input-field text-xs font-semibold" @change="fetchEventos">
          <option value="">Todos</option>
          <option value="Departamental">Departamental</option>
          <option value="Nacional">Nacional</option>
          <option value="Internacional">Internacional</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Estado del Flujo</label>
        <select v-model="filterEstado" class="input-field text-xs font-semibold" @change="fetchEventos">
          <option value="">Todos los Estados</option>
          <option value="Postulado">⏳ Postulado (En Revisión)</option>
          <option value="Reacomodado">⚙ Reacomodado SEDEDE</option>
          <option value="Oficializado">✓ Oficializado (Garantizado)</option>
          <option value="Observado">✕ Observado</option>
        </select>
      </div>
    </div>

    <!-- VISTA 1: CALENDARIO EN 2 COLUMNAS (CALENDARIO DE TORNEOS + RANKING DE DEPORTISTAS) -->
    <div v-if="viewMode === 'calendario'" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <!-- COLUMNA IZQUIERDA: CALENDARIO DE TORNEOS (8 COLUMNAS) -->
      <div class="xl:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div class="flex items-center gap-2">
            <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50" @click="prevMonth">
              ‹ Anterior
            </button>
            <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50" @click="goToday">
              Hoy
            </button>
            <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50" @click="nextMonth">
              Siguiente ›
            </button>
          </div>

          <h2 class="font-display text-2xl font-extrabold text-brand-700 tracking-tight text-center">
            {{ currentMonthLabel }}
          </h2>

          <div class="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 justify-end">
            <span class="inline-flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Oficializado</span>
            <span class="inline-flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-full bg-sky-500"></span> Postulado</span>
            <span class="inline-flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Reacomodado</span>
            <span class="inline-flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Observado</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <div class="min-w-[620px]">
            <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center font-display text-xs font-bold uppercase tracking-wider text-slate-600">
              <div class="py-2.5">Lunes</div>
              <div class="py-2.5">Martes</div>
              <div class="py-2.5">Miércoles</div>
              <div class="py-2.5">Jueves</div>
              <div class="py-2.5">Viernes</div>
              <div class="py-2.5 text-brand-700">Sábado</div>
              <div class="py-2.5 text-brand-700">Domingo</div>
            </div>

            <div class="grid grid-cols-7 border-l border-t border-slate-200">
              <div
                v-for="(day, index) in calendarDays"
                :key="index"
                class="group relative min-h-[105px] border-b border-r border-slate-200 p-2 transition-colors hover:bg-slate-50/80 cursor-pointer"
                :class="{
                  'bg-slate-50/50 text-slate-400': !day.isCurrentMonth,
                  'bg-white text-slate-900': day.isCurrentMonth,
                  'ring-2 ring-brand-500 ring-inset bg-brand-50/20': day.isToday
                }"
                @click="isDeportista ? null : openCreateModal(day.dateString)"
              >
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="font-display text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
                    :class="{
                      'bg-brand-600 text-white shadow-sm': day.isToday,
                      'text-slate-900 font-extrabold': day.isCurrentMonth && !day.isToday,
                      'text-slate-400': !day.isCurrentMonth
                    }"
                  >
                    {{ day.dayNumber }}
                  </span>

                  <button
                    v-if="!isDeportista"
                    class="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-brand-600 hover:underline"
                    @click.stop="openCreateModal(day.dateString)"
                  >
                    + Evento
                  </button>
                </div>

                <div class="space-y-1">
                  <div
                    v-for="evt in (eventosByDate[day.dateString] || []).slice(0, 3)"
                    :key="evt.id"
                    class="rounded px-1.5 py-1 text-[11px] font-bold shadow-sm cursor-pointer truncate flex items-center justify-between gap-1 border"
                    :class="{
                      'bg-emerald-50 text-emerald-900 border-emerald-300': evt.estado_evento === 'Oficializado' || evt.estado_evento === 'Programado',
                      'bg-sky-50 text-sky-900 border-sky-300': evt.estado_evento === 'Postulado',
                      'bg-amber-50 text-amber-900 border-amber-300': evt.estado_evento === 'Reacomodado',
                      'bg-rose-50 text-rose-900 border-rose-300': evt.estado_evento === 'Observado'
                    }"
                    @click.stop="openDetailModal(evt)"
                  >
                    <span class="truncate">
                      <span v-if="evt.estado_evento === 'Oficializado'">✓</span>
                      <span v-else-if="evt.estado_evento === 'Reacomodado'">⚙</span>
                      <span v-else>⏳</span>
                      {{ evt.asociacion?.sigla || evt.disciplina }}: {{ evt.nombre_evento }}
                    </span>
                  </div>

                  <div
                    v-if="(eventosByDate[day.dateString] || []).length > 3"
                    class="text-[10px] font-bold text-brand-600 pl-1"
                  >
                    + {{ (eventosByDate[day.dateString] || []).length - 3 }} más
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA: JUGADORES EN TORNEOS & RANKING DE DEPORTISTAS (4 COLUMNAS - IMAGEN 1 ÁREA 2) -->
      <div class="xl:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="font-display text-base font-bold text-ink flex items-center gap-1.5">
              <span>🏆</span>
              <span>Ranking de Deportistas</span>
            </h3>
            <p class="text-xs text-slate-500">Atletas galardonados en torneos</p>
          </div>
          <span class="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold border border-brand-200">
            {{ deportistasFiltradosRanking.length }} Atletas
          </span>
        </div>

        <!-- Filtro Rápido por Disciplina -->
        <div class="flex items-center gap-2">
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Disciplina:</label>
          <select
            v-model="rankingFilterDisciplina"
            class="input-field text-xs py-1 px-2 font-semibold bg-slate-50 border-slate-200"
          >
            <option v-for="d in rankingDisciplinas" :key="d" :value="d">
              {{ d === 'TODOS' ? 'Todas las disciplinas' : d }}
            </option>
          </select>
        </div>

        <!-- Lista de Deportistas Ranking con Medallas y Logros Recientes -->
        <div v-if="loadingRanking" class="py-8 text-center text-xs text-slate-400">
          Cargando atletas galardonados...
        </div>

        <div v-else-if="deportistasFiltradosRanking.length === 0" class="py-8 text-center text-xs text-slate-400 italic">
          No hay atletas registrados con galardones para esta selección.
        </div>

        <div v-else class="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          <div
            v-for="(atleta, idx) in deportistasFiltradosRanking"
            :key="atleta.id || idx"
            class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-brand-50/30 hover:border-brand-300 transition-all flex items-start justify-between gap-3 shadow-xs"
          >
            <!-- Icono Trofeo / Medalla según lugar -->
            <div class="shrink-0 flex flex-col items-center justify-center pt-0.5">
              <div
                class="h-9 w-9 rounded-full flex items-center justify-center text-lg shadow-xs"
                :class="{
                  'bg-amber-100 text-amber-700 border border-amber-300': idx === 0 || (atleta.galardones?.oro && atleta.galardones.oro > 0),
                  'bg-slate-200 text-slate-700 border border-slate-300': idx === 1 && (!atleta.galardones?.oro || atleta.galardones.oro === 0),
                  'bg-orange-100 text-orange-800 border border-orange-300': idx > 1
                }"
              >
                <span v-if="idx === 0 || (atleta.galardones?.oro && atleta.galardones.oro > 0)">🏆</span>
                <span v-else-if="idx === 1">🥈</span>
                <span v-else-if="idx === 2">🥉</span>
                <span v-else>🏅</span>
              </div>
              <span class="text-[10px] font-black text-slate-500 mt-1 font-mono">#{{ atleta.posicion_nacional || (idx + 1) }}</span>
            </div>

            <!-- Datos del Atleta -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h4 class="font-bold text-xs text-slate-900 truncate">
                  {{ atleta.nombre || atleta.nombre_completo }}
                </h4>
              </div>

              <!-- Torneo o Club -->
              <p class="text-[11px] text-slate-600 mt-0.5 truncate font-medium">
                {{ atleta.logros_destacados?.[0]?.torneo || atleta.club?.nombre || atleta.asociacion?.nombre || atleta.disciplina }}
              </p>

              <!-- Categoría y Disciplina -->
              <div class="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
                <span class="rounded bg-white px-1.5 py-0.2 border border-slate-200 font-semibold text-slate-700">
                  {{ atleta.disciplina }}
                </span>
                <span v-if="atleta.categoria" class="rounded bg-slate-100 px-1.5 py-0.2 text-slate-600">
                  {{ atleta.categoria }}
                </span>
              </div>
            </div>

            <!-- Insignia de Resultado / Fase (Estilo Sistema ACE) -->
            <div class="shrink-0 flex flex-col items-end gap-1">
              <span
                class="rounded px-2 py-0.5 text-[10px] font-black tracking-wide uppercase shadow-xs"
                :class="{
                  'bg-sky-600 text-white': atleta.logros_destacados?.[0]?.titulo?.toLowerCase().includes('campe') || idx === 0,
                  'bg-amber-600 text-white': atleta.logros_destacados?.[0]?.tipo === 'oro',
                  'bg-slate-600 text-white': atleta.logros_destacados?.[0]?.tipo === 'plata',
                  'bg-brand-700 text-white': !atleta.logros_destacados?.[0]?.tipo
                }"
              >
                {{ atleta.logros_destacados?.[0]?.tipo ? (atleta.logros_destacados[0].tipo.toUpperCase()) : (atleta.posicion_nacional ? `Rank #${atleta.posicion_nacional}` : 'Finalista') }}
              </span>

              <span v-if="atleta.galardones?.total" class="text-[10px] font-bold text-amber-700">
                {{ atleta.galardones.total }} títulos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA 2: LISTA -->
    <div v-else class="space-y-4">
      <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando eventos...</div>
      <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="evt in eventosLista" :key="evt.id" class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
          <div>
            <div class="mb-2 flex flex-wrap items-center justify-between gap-1">
              <span class="rounded px-2 py-0.5 font-mono text-[11px] font-bold"
                :class="{
                  'bg-blue-100 text-blue-800': evt.tipo_evento === 'Departamental',
                  'bg-purple-100 text-purple-800': evt.tipo_evento === 'Nacional',
                  'bg-amber-100 text-amber-900': evt.tipo_evento === 'Internacional'
                }"
              >
                {{ evt.tipo_evento }}
              </span>

              <!-- Badge de Estado de Flujo -->
              <span class="rounded px-2 py-0.5 text-[11px] font-bold border"
                :class="{
                  'bg-emerald-100 text-emerald-800 border-emerald-300': evt.estado_evento === 'Oficializado' || evt.estado_evento === 'Programado',
                  'bg-sky-100 text-sky-800 border-sky-300': evt.estado_evento === 'Postulado',
                  'bg-amber-100 text-amber-900 border-amber-300': evt.estado_evento === 'Reacomodado',
                  'bg-rose-100 text-rose-800 border-rose-300': evt.estado_evento === 'Observado'
                }"
              >
                {{ evt.estado_evento === 'Oficializado' ? '✓ Oficializado' : evt.estado_evento === 'Reacomodado' ? '⚙ Reacomodado' : evt.estado_evento === 'Observado' ? '✕ Observado' : '⏳ Postulado' }}
              </span>
            </div>

            <span class="block text-xs font-semibold text-brand-700 uppercase tracking-wide">{{ evt.asociacion?.nombre }}</span>
            <h3 class="mt-1 font-display text-base font-bold text-slate-900">{{ evt.nombre_evento }}</h3>
            <p class="text-xs text-slate-500">Categoría: <strong class="text-slate-700">{{ evt.categoria }}</strong> | Disciplina: {{ evt.disciplina }}</p>

            <!-- Alerta de Reacomodo en la tarjeta si aplica -->
            <div v-if="evt.motivo_reacomodo" class="mt-2 rounded bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
              <span class="font-bold">Ajuste técnico SEDEDE:</span> {{ evt.motivo_reacomodo }}
            </div>

            <div class="mt-3 rounded-lg bg-slate-50 p-3 text-xs space-y-1">
              <div class="flex justify-between text-slate-600">
                <span>Fechas:</span>
                <strong class="text-slate-800">{{ formatDisplayRange(evt.fecha_inicio, evt.fecha_fin) }}</strong>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Escenario:</span>
                <strong class="text-slate-800">{{ evt.escenario?.nombre || 'A Confirmar' }}</strong>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Presupuesto:</span>
                <strong class="font-mono text-emerald-700">Bs {{ Number(evt.presupuesto_estimado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}</strong>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span class="text-xs text-slate-500">Prioridad: <strong>{{ evt.nivel_prioridad }}</strong></span>

            <div class="flex items-center gap-2">
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="openDetailModal(evt)">Detalles</button>
              <button v-if="isSededeOrAdmin && evt.estado_evento !== 'Oficializado'" class="text-xs font-bold text-emerald-700 hover:underline" @click="handleOficializar(evt)">Oficializar</button>
              <button v-if="isSededeOrAdmin" class="text-xs font-bold text-amber-700 hover:underline" @click="openReacomodoModal(evt)">Reacomodar</button>
              <button v-if="!isDeportista" class="text-xs font-semibold text-slate-600 hover:underline" @click="openEditModal(evt)">Editar</button>
              <button v-if="!isDeportista" class="text-xs font-semibold text-red-600 hover:underline" @click="deleteEvento(evt)">Eliminar</button>
            </div>
          </div>
        </div>

        <div v-if="!eventos.length" class="col-span-full p-8 text-center text-slate-400 border border-dashed rounded-xl">
          No se encontraron eventos con los filtros seleccionados.
        </div>
      </div>
    </div>

    <!-- MODAL DE DETALLES Y ACCIONES DE FLUJO -->
    <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-8">
        <div class="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800">{{ selectedEventoDetail?.asociacion?.sigla || 'ASOCIACIÓN' }}</span>
              <span class="rounded px-2 py-0.5 text-xs font-bold border"
                :class="{
                  'bg-emerald-100 text-emerald-800 border-emerald-300': selectedEventoDetail?.estado_evento === 'Oficializado' || selectedEventoDetail?.estado_evento === 'Programado',
                  'bg-sky-100 text-sky-800 border-sky-300': selectedEventoDetail?.estado_evento === 'Postulado',
                  'bg-amber-100 text-amber-900 border-amber-300': selectedEventoDetail?.estado_evento === 'Reacomodado',
                  'bg-rose-100 text-rose-800 border-rose-300': selectedEventoDetail?.estado_evento === 'Observado'
                }"
              >
                Estado: {{ selectedEventoDetail?.estado_evento }}
              </span>
            </div>
            <h2 class="mt-1 font-display text-xl font-bold text-slate-900">{{ selectedEventoDetail?.nombre_evento }}</h2>
            <p class="text-xs text-slate-500">Organiza: {{ selectedEventoDetail?.asociacion?.nombre }}</p>
          </div>
          <button class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" @click="closeModal">✕</button>
        </div>

        <!-- Banner de Conflicto Técnico en Tiempo Real -->
        <div v-if="comprobandoConflictos" class="mt-3 p-3 rounded-lg bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
          <span class="animate-spin">🔄</span> Verificando disponibilidad técnica y colisiones en escenario...
        </div>
        <div v-else-if="conflictosDetectados?.tiene_conflictos" class="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900">
          <p class="font-bold flex items-center gap-1.5 text-amber-800">
            <span>⚠️</span> ¡Alerta de Cruce de Disciplinas en este Escenario!
          </p>
          <p class="mt-1">
            Se encontraron {{ conflictosDetectados.eventos_cruzados?.length || 0 }} evento(s) o reservas en las mismas fechas:
          </p>
          <ul class="list-disc pl-4 mt-1 space-y-0.5">
            <li v-for="c in conflictosDetectados.eventos_cruzados" :key="c.id">
              <strong>{{ c.nombre_evento }}</strong> ({{ c.asociacion?.sigla || c.disciplina }}): {{ formatDisplayRange(c.fecha_inicio, c.fecha_fin) }}
            </li>
          </ul>
          <p class="mt-2 text-[11px] font-semibold text-amber-950">
            💡 Sugerencia SEDEDE: Utilice el botón <strong>"Reacomodar"</strong> para asignar otro escenario o ajustar las fechas.
          </p>
        </div>
        <div v-else-if="conflictosDetectados && !conflictosDetectados.tiene_conflictos" class="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <span>✓</span> Escenario disponible sin colisiones en las fechas seleccionadas.
        </div>

        <!-- Alerta de Reacomodo previo si existe -->
        <div v-if="selectedEventoDetail?.motivo_reacomodo" class="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
          <strong class="block text-blue-800">⚙ Reacomodación Técnica por SEDEDE:</strong>
          <p class="mt-1 italic">"{{ selectedEventoDetail.motivo_reacomodo }}"</p>
        </div>

        <div class="mt-4 space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="block text-slate-500 font-semibold">Disciplina & Categoría</span>
              <strong class="text-slate-800 text-sm">{{ selectedEventoDetail?.disciplina }} ({{ selectedEventoDetail?.categoria }})</strong>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="block text-slate-500 font-semibold">Tipo</span>
              <strong class="text-slate-800 text-sm">{{ selectedEventoDetail?.tipo_evento }}</strong>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="block text-slate-500 font-semibold">Fechas Programadas</span>
              <strong class="text-slate-800 text-sm">
                {{ formatDisplayRange(selectedEventoDetail?.fecha_inicio, selectedEventoDetail?.fecha_fin) }}
              </strong>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="block text-slate-500 font-semibold">Horario Oficial de Ocupación</span>
              <strong class="text-indigo-900 text-sm font-mono">
                🕒 {{ selectedEventoDetail?.hora_inicio || '08:00' }} a {{ selectedEventoDetail?.hora_fin || '22:00' }}
              </strong>
            </div>
          </div>

          <div class="rounded-lg bg-slate-50 p-3 flex items-center justify-between">
            <div>
              <span class="block text-slate-500 font-semibold">Escenario y Espacio Asignado</span>
              <strong class="text-slate-800 text-sm">{{ selectedEventoDetail?.escenario?.nombre || 'A Confirmar' }}</strong>
              <span v-if="selectedEventoDetail?.espacio" class="text-xs text-slate-500 block">Espacio: {{ selectedEventoDetail.espacio }}</span>
            </div>
            <span class="rounded bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs font-bold border border-indigo-200">
              {{ selectedEventoDetail?.bloquea_escenario_completo ? '🔒 Bloqueo Total Escenario' : 'Espacio Específico' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
              <span class="block text-emerald-800 font-semibold">Presupuesto Estimado</span>
              <strong class="font-mono text-base font-bold text-emerald-900">Bs {{ Number(selectedEventoDetail?.presupuesto_estimado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}</strong>
            </div>
            <div class="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <span class="block text-blue-800 font-semibold">Nivel de Prioridad</span>
              <strong class="text-blue-900 font-bold">{{ selectedEventoDetail?.nivel_prioridad }}</strong>
            </div>
          </div>

          <div v-if="selectedEventoDetail?.observaciones" class="rounded-lg bg-slate-50 p-3">
            <span class="block text-slate-500 font-semibold">Observaciones / Requerimientos</span>
            <p class="text-slate-700 mt-1 italic">"{{ selectedEventoDetail.observaciones }}"</p>
          </div>

          <div v-if="selectedEventoDetail?.fecha_oficializacion" class="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200 text-emerald-900">
            <span class="block font-bold">Oficializado por SEDEDE:</span>
            <p class="mt-0.5">{{ new Date(selectedEventoDetail.fecha_oficializacion).toLocaleString('es-BO') }}</p>
          </div>
        </div>

        <!-- Botones de Acción según Rol -->
        <div class="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button class="btn-secondary text-xs" @click="closeModal">Cerrar</button>

          <!-- Acciones Exclusivas de SEDEDE -->
          <div v-if="isSededeOrAdmin" class="flex flex-wrap items-center gap-2">
            <button
              v-if="selectedEventoDetail?.estado_evento !== 'Oficializado'"
              class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
              @click="openReacomodoModal(selectedEventoDetail)"
            >
              ⚙ Reacomodar Escenario / Fechas
            </button>

            <button
              v-if="selectedEventoDetail?.estado_evento !== 'Observado'"
              class="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
              @click="openObservarModal(selectedEventoDetail)"
            >
              Observar
            </button>

            <button
              v-if="selectedEventoDetail?.estado_evento !== 'Oficializado'"
              class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
              :disabled="saving"
              @click="handleOficializar(selectedEventoDetail)"
            >
              ✓ Oficializar y Garantizar Reserva
            </button>
          </div>

          <div v-else-if="!isDeportista" class="flex items-center gap-2">
            <button class="btn-primary text-xs bg-slate-800 hover:bg-slate-900" @click="openEditModal(selectedEventoDetail)">
              Editar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL REACOMODAR (EXCLUSIVO SEDEDE) -->
    <div v-if="showReacomodoModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl my-8">
        <div class="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Mesa Técnica SEDEDE</span>
            <h3 class="mt-1 font-display text-lg font-bold text-slate-900">Reacomodar Calendario Deportivo</h3>
            <p class="text-xs text-slate-500">Ajuste de escenario o fechas por colisión entre disciplinas.</p>
          </div>
          <button class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" @click="showReacomodoModal = false">✕</button>
        </div>

        <form class="space-y-4 text-xs" @submit.prevent="saveReacomodo">
          <div>
            <label class="mb-1 block font-bold text-slate-700">Evento:</label>
            <p class="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm">
              {{ selectedEventoDetail?.nombre_evento }} ({{ selectedEventoDetail?.asociacion?.nombre }})
            </p>
          </div>

          <div>
            <label class="mb-1 block font-bold text-slate-700">Reasignar Escenario Deportivo *</label>
            <select v-model="formReacomodo.escenario_id" class="input-field text-xs font-semibold" required :disabled="saving">
              <option value="" disabled>Seleccione escenario alternativo...</option>
              <option v-for="e in escenarios" :key="e.id" :value="e.id">{{ e.nombre }} ({{ e.espacio || 'Pista Principal' }})</option>
            </select>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block font-bold text-slate-700">Nueva Fecha Inicio *</label>
              <input v-model="formReacomodo.fecha_inicio" type="date" class="input-field text-xs font-semibold" required :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block font-bold text-slate-700">Nueva Fecha Fin *</label>
              <input v-model="formReacomodo.fecha_fin" type="date" class="input-field text-xs font-semibold" required :disabled="saving" />
            </div>
          </div>

          <div>
            <label class="mb-1 block font-bold text-slate-700">Motivo del Reacomodo Técnico *</label>
            <textarea
              v-model="formReacomodo.motivo_reacomodo"
              rows="3"
              class="input-field text-xs"
              placeholder="Explique el motivo del ajuste técnico (ej: Se reprograma fecha por cruce en Polideportivo Garcilazo con Torneo Nacional de Voleibol)..."
              required
              :disabled="saving"
            ></textarea>
          </div>

          <div class="rounded-lg bg-emerald-50 p-3 border border-emerald-200 flex items-center gap-2">
            <input id="chkAprobar" v-model="formReacomodo.aprobar_inmediatamente" type="checkbox" class="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
            <label for="chkAprobar" class="text-xs font-bold text-emerald-900 cursor-pointer">
              Oficializar y garantizar reserva inmediatamente con estos nuevos datos
            </label>
          </div>

          <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="showReacomodoModal = false">Cancelar</button>
            <button type="submit" class="btn-primary bg-amber-600 hover:bg-amber-700" :disabled="saving">
              {{ saving ? 'Guardando Reacomodo...' : 'Aplicar Reacomodo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL OBSERVAR (EXCLUSIVO SEDEDE) -->
    <div v-if="showObservarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 class="mb-1 font-display text-base font-bold text-slate-900">Observar Solicitud de Calendario</h3>
        <p class="text-xs text-slate-500 mb-4">El evento será devuelto a la asociación para subsanación documental o de fechas.</p>

        <form class="space-y-3 text-xs" @submit.prevent="saveObservacion">
          <div>
            <label class="mb-1 block font-bold text-slate-700">Observaciones técnicas:</label>
            <textarea
              v-model="formObservacion.observaciones"
              rows="4"
              class="input-field text-xs"
              placeholder="Detalle los requerimientos o ajustes que debe cumplir la asociación..."
              required
              :disabled="saving"
            ></textarea>
          </div>

          <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="showObservarModal = false">Cancelar</button>
            <button type="submit" class="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700" :disabled="saving">
              {{ saving ? 'Enviando...' : 'Devolver con Observación' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL CREAR / EDITAR -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl my-8">
        <h3 class="mb-1 font-display text-lg font-bold text-brand-700">
          {{ editingEvento ? 'Editar Evento' : isSededeOrAdmin ? 'Programar u Oficializar Evento' : 'Postular Evento Anual' }}
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          {{ isSededeOrAdmin ? 'Registro oficial del SEDEDE en el calendario anual.' : 'Su postulación será revisada técnicamente por el SEDEDE.' }}
        </p>

        <form class="space-y-4" @submit.prevent="saveEvento">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Asociación *</label>
              <select v-model="form.asociacion_id" class="input-field text-sm" required :disabled="saving">
                <option value="" disabled>Seleccione Asociación...</option>
                <option v-for="a in asociaciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Escenario</label>
              <select v-model="form.escenario_id" class="input-field text-sm" :disabled="saving">
                <option value="">A Confirmar</option>
                <option v-for="e in escenarios" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Nombre del Evento *</label>
            <input v-model="form.nombre_evento" type="text" placeholder="Ej. Campeonato Departamental 2026" class="input-field text-sm" required :disabled="saving" />
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Tipo *</label>
              <select v-model="form.tipo_evento" class="input-field text-xs" required :disabled="saving">
                <option value="Departamental">Departamental</option>
                <option value="Nacional">Nacional</option>
                <option value="Internacional">Internacional</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Disciplina *</label>
              <input v-model="form.disciplina" type="text" placeholder="Ej. Atletismo" class="input-field text-xs" required :disabled="saving" />
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Categoría *</label>
              <input v-model="form.categoria" type="text" placeholder="Ej. Sub-18" class="input-field text-xs" required :disabled="saving" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Fecha Inicio *</label>
              <input v-model="form.fecha_inicio" type="date" class="input-field text-sm" required :disabled="saving" />
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Fecha Fin *</label>
              <input v-model="form.fecha_fin" type="date" class="input-field text-sm" required :disabled="saving" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-200">
            <div>
              <label class="mb-1 block text-xs font-semibold text-indigo-950">Hora Inicio (Bloqueo) *</label>
              <input v-model="form.hora_inicio" type="time" class="input-field text-sm font-semibold" required :disabled="saving" />
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-indigo-950">Hora Fin (Bloqueo) *</label>
              <input v-model="form.hora_fin" type="time" class="input-field text-sm font-semibold" required :disabled="saving" />
            </div>

            <div class="col-span-2 pt-1">
              <label class="mb-1 block text-xs font-semibold text-indigo-950">Espacio Programado</label>
              <input v-model="form.espacio" type="text" placeholder="Ej. Cancha Principal / Pista (Vacío para todo el escenario)" class="input-field text-xs bg-white" :disabled="saving" />
            </div>

            <div class="col-span-2 flex items-center pt-1">
              <label class="flex items-center gap-2 text-xs font-bold text-indigo-950 cursor-pointer">
                <input type="checkbox" v-model="form.bloquea_escenario_completo" class="rounded text-brand-600" :disabled="saving" />
                <span>Bloquear todo el escenario (Sin horarios disponibles en reservas de particulares/clubes)</span>
              </label>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Prioridad *</label>
              <select v-model="form.nivel_prioridad" class="input-field text-xs" required :disabled="saving">
                <option value="Alta (Reserva Garantizada)">★ Alta (Garantizada)</option>
                <option value="Media">Media</option>
                <option value="Normal">Normal</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Presupuesto (Bs)</label>
              <input v-model="form.presupuesto_estimado" type="number" step="100" class="input-field text-sm" :disabled="saving" />
            </div>
          </div>

          <div v-if="isSededeOrAdmin">
            <label class="mb-1 block text-xs font-semibold text-slate-700">Estado de Aprobación Inicial *</label>
            <select v-model="form.estado_evento" class="input-field text-xs font-bold" :disabled="saving">
              <option value="Oficializado">✓ Oficializado (Garantiza reserva de escenario)</option>
              <option value="Postulado">⏳ Postulado (Para revisión posterior)</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Observaciones</label>
            <textarea v-model="form.observaciones" rows="2" class="input-field text-sm" placeholder="Detalles..." :disabled="saving"></textarea>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : isSededeOrAdmin ? 'Guardar Evento' : 'Enviar Postulación' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
