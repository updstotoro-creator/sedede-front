<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { calendarioAnualService } from '../services/calendarioAnualService'
import { asociacionService } from '../services/asociacionService'
import { escenarioService } from '../services/escenarioService'

const eventos = ref([])
const asociaciones = ref([])
const escenarios = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const filterAsociacion = ref('')
const filterEscenario = ref('')
const filterTipo = ref('')
const viewMode = ref('calendario') // 'calendario' | 'lista'

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

// Agrupación de eventos por fecha
const eventosByDate = computed(() => {
  const map = {}
  eventos.value.forEach(evt => {
    if (!evt.fecha_inicio) return
    const inicio = new Date(evt.fecha_inicio + 'T00:00:00')
    const fin = evt.fecha_fin ? new Date(evt.fecha_fin + 'T00:00:00') : inicio

    let curr = new Date(inicio)
    while (curr <= fin) {
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
const selectedEventoDetail = ref(null)
const editingEvento = ref(null)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  asociacion_id: '',
  escenario_id: '',
  nombre_evento: '',
  tipo_evento: 'Departamental',
  disciplina: 'Atletismo',
  categoria: 'Mayores',
  fecha_inicio: '',
  fecha_fin: '',
  nivel_prioridad: 'Alta (Reserva Garantizada)',
  presupuesto_estimado: 0,
  observaciones: '',
})

function resetForm(initialDateStr = null) {
  const defaultInicio = initialDateStr ? new Date(initialDateStr + 'T00:00:00') : new Date()
  const defaultFin = new Date(defaultInicio)
  defaultFin.setDate(defaultFin.getDate() + 2)

  form.asociacion_id = asociaciones.value[0]?.id || ''
  form.escenario_id = escenarios.value[0]?.id || ''
  form.nombre_evento = ''
  form.tipo_evento = 'Departamental'
  form.disciplina = 'Atletismo'
  form.categoria = 'Mayores'
  form.fecha_inicio = formatDateISO(defaultInicio)
  form.fecha_fin = formatDateISO(defaultFin)
  form.nivel_prioridad = 'Alta (Reserva Garantizada)'
  form.presupuesto_estimado = 5000
  form.observaciones = ''
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
  editingEvento.value = null
  resetForm(dateStr)
  showModal.value = true
}

function openEditModal(evt) {
  showDetailModal.value = false
  editingEvento.value = evt
  form.asociacion_id = evt.asociacion_id
  form.escenario_id = evt.escenario_id || ''
  form.nombre_evento = evt.nombre_evento
  form.tipo_evento = evt.tipo_evento
  form.disciplina = evt.disciplina
  form.categoria = evt.categoria || 'Mayores'
  form.fecha_inicio = evt.fecha_inicio ? evt.fecha_inicio.split('T')[0] : ''
  form.fecha_fin = evt.fecha_fin ? evt.fecha_fin.split('T')[0] : ''
  form.nivel_prioridad = evt.nivel_prioridad
  form.presupuesto_estimado = evt.presupuesto_estimado || 0
  form.observaciones = evt.observaciones || ''
  formError.value = ''
  showModal.value = true
}

function openDetailModal(evt) {
  selectedEventoDetail.value = evt
  showDetailModal.value = true
}

function closeModal() {
  showModal.value = false
  showDetailModal.value = false
  editingEvento.value = null
  selectedEventoDetail.value = null
}

async function saveEvento() {
  saving.value = true
  formError.value = ''
  try {
    if (editingEvento.value) {
      await calendarioAnualService.update(editingEvento.value.id, { ...form })
    } else {
      await calendarioAnualService.create({ ...form })
    }
    closeModal()
    await fetchEventos()
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

async function deleteEvento(evt) {
  if (!confirm(`¿Está seguro de eliminar el evento "${evt.nombre_evento}"?`)) return
  try {
    await calendarioAnualService.delete(evt.id)
    closeModal()
    await fetchEventos()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al dar de baja el evento')
  }
}

onMounted(() => {
  fetchEventos()
  loadAuxData()
})
</script>

<template>
  <div class="mt-8 space-y-6">
    <!-- Encabezado del Módulo -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-brand-700">Calendario Anual</h1>
        <p class="text-sm text-slate-500">Eventos deportivos programados por las asociaciones.</p>
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

        <button class="btn-primary flex items-center gap-1.5" @click="openCreateModal()">
          <span>+ Programar Evento</span>
        </button>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-4 sm:grid-cols-3">
      <div>
        <label class="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Asociación</label>
        <select v-model="filterAsociacion" class="input-field text-xs font-semibold" @change="fetchEventos">
          <option value="">Todas las Asociaciones</option>
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
    </div>

    <!-- VISTA 1: CALENDARIO -->
    <div v-if="viewMode === 'calendario'" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
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

        <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 justify-end">
          <span class="inline-block h-3 w-3 rounded-full bg-emerald-500"></span> <span>Departamental</span>
          <span class="inline-block h-3 w-3 rounded-full bg-purple-600"></span> <span>Nacional</span>
          <span class="inline-block h-3 w-3 rounded-full bg-amber-500"></span> <span>Internacional</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="min-w-[700px]">
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
              class="group relative min-h-[110px] border-b border-r border-slate-200 p-2 transition-colors hover:bg-slate-50/80 cursor-pointer"
              :class="{
                'bg-slate-50/50 text-slate-400': !day.isCurrentMonth,
                'bg-white text-slate-900': day.isCurrentMonth,
                'ring-2 ring-brand-500 ring-inset bg-brand-50/20': day.isToday
              }"
              @click="openCreateModal(day.dateString)"
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
                  class="rounded px-1.5 py-1 text-[11px] font-bold shadow-sm cursor-pointer truncate flex items-center justify-between gap-1"
                  :class="{
                    'bg-emerald-100 text-emerald-900 border border-emerald-300': evt.tipo_evento === 'Departamental',
                    'bg-purple-100 text-purple-900 border border-purple-300': evt.tipo_evento === 'Nacional',
                    'bg-amber-100 text-amber-900 border border-amber-300': evt.tipo_evento === 'Internacional'
                  }"
                  @click.stop="openDetailModal(evt)"
                >
                  <span class="truncate">{{ evt.asociacion?.sigla || evt.disciplina }}: {{ evt.nombre_evento }}</span>
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

    <!-- VISTA 2: LISTA -->
    <div v-else class="space-y-4">
      <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando eventos...</div>
      <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="evt in eventos" :key="evt.id" class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
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

              <span class="rounded px-2 py-0.5 text-[11px] font-bold"
                :class="{
                  'bg-emerald-100 text-emerald-800': evt.nivel_prioridad.includes('Alta'),
                  'bg-slate-100 text-slate-700': !evt.nivel_prioridad.includes('Alta')
                }"
              >
                {{ evt.nivel_prioridad.includes('Alta') ? '★ Prioridad Alta' : evt.nivel_prioridad }}
              </span>
            </div>

            <span class="block text-xs font-semibold text-brand-700 uppercase tracking-wide">{{ evt.asociacion?.nombre }}</span>
            <h3 class="mt-1 font-display text-base font-bold text-slate-900">{{ evt.nombre_evento }}</h3>
            <p class="text-xs text-slate-500">Categoría: <strong class="text-slate-700">{{ evt.categoria }}</strong> | Disciplina: {{ evt.disciplina }}</p>

            <div class="mt-4 rounded-lg bg-slate-50 p-3 text-xs space-y-1">
              <div class="flex justify-between text-slate-600">
                <span>Fechas:</span>
                <strong class="text-slate-800">{{ new Date(evt.fecha_inicio).toLocaleDateString('es-BO') }} al {{ new Date(evt.fecha_fin).toLocaleDateString('es-BO') }}</strong>
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
            <span class="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{{ evt.estado_evento }}</span>

            <div class="flex items-center gap-2">
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="openDetailModal(evt)">Detalles</button>
              <button class="text-xs font-semibold text-slate-600 hover:underline" @click="openEditModal(evt)">Editar</button>
              <button class="text-xs font-semibold text-red-600 hover:underline" @click="deleteEvento(evt)">Eliminar</button>
            </div>
          </div>
        </div>

        <div v-if="!eventos.length" class="col-span-full p-8 text-center text-slate-400 border border-dashed rounded-xl">
          No hay eventos programados.
        </div>
      </div>
    </div>

    <!-- MODAL DE DETALLES -->
    <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="rounded bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800">{{ selectedEventoDetail?.asociacion?.sigla || 'ASOCIACIÓN' }}</span>
            <h2 class="mt-1 font-display text-xl font-bold text-slate-900">{{ selectedEventoDetail?.nombre_evento }}</h2>
            <p class="text-xs text-slate-500">Organiza: {{ selectedEventoDetail?.asociacion?.nombre }}</p>
          </div>
          <button class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" @click="closeModal">✕</button>
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

          <div class="rounded-lg bg-slate-50 p-3">
            <span class="block text-slate-500 font-semibold">Fechas</span>
            <strong class="text-slate-800 text-sm">
              {{ new Date(selectedEventoDetail?.fecha_inicio).toLocaleDateString('es-BO') }} al {{ new Date(selectedEventoDetail?.fecha_fin).toLocaleDateString('es-BO') }}
            </strong>
          </div>

          <div class="rounded-lg bg-slate-50 p-3">
            <span class="block text-slate-500 font-semibold">Escenario</span>
            <strong class="text-slate-800 text-sm">{{ selectedEventoDetail?.escenario?.nombre || 'A Confirmar' }}</strong>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
              <span class="block text-emerald-800 font-semibold">Presupuesto</span>
              <strong class="font-mono text-base font-bold text-emerald-900">Bs {{ Number(selectedEventoDetail?.presupuesto_estimado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}</strong>
            </div>
            <div class="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <span class="block text-blue-800 font-semibold">Prioridad</span>
              <strong class="text-blue-900 font-bold">{{ selectedEventoDetail?.nivel_prioridad }}</strong>
            </div>
          </div>

          <div v-if="selectedEventoDetail?.observaciones" class="rounded-lg bg-slate-50 p-3">
            <span class="block text-slate-500 font-semibold">Observaciones</span>
            <p class="text-slate-700 mt-1 italic">"{{ selectedEventoDetail.observaciones }}"</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
          <button class="btn-secondary text-xs" @click="closeModal">Cerrar</button>
          <button class="btn-primary text-xs bg-slate-800 hover:bg-slate-900" @click="openEditModal(selectedEventoDetail)">
            Editar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CREAR / EDITAR -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl my-8">
        <h3 class="mb-1 font-display text-lg font-bold text-brand-700">
          {{ editingEvento ? 'Editar Evento' : 'Programar Evento Anual' }}
        </h3>

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
              {{ saving ? 'Guardando…' : 'Guardar Evento' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
