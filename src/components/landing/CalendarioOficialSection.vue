<script setup>
import { ref, computed, onMounted } from 'vue'
import { calendarioAnualService } from '../../services/calendarioAnualService'

const loading = ref(true)
const error = ref(null)
const eventos = ref([])

// Control del mes mostrado
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

// Filtros
const selectedDiscipline = ref('TODOS')
const selectedTipo = ref('TODOS')

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

function goToday() {
  currentDate.value = new Date()
}

// Cargar eventos públicos oficializados
async function fetchEventos() {
  loading.value = true
  error.value = null
  try {
    const data = await calendarioAnualService.getPublicEvents()
    // Solo eventos que están oficializados en firme
    eventos.value = (Array.isArray(data) ? data : []).filter(
      (e) => e.estado_evento === 'Oficializado' || e.estado_evento === 'Programado'
    )
  } catch (err) {
    console.error('Error al cargar calendario público:', err)
    error.value = 'No se pudo sincronizar el calendario oficial en este momento.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEventos()
})

// Lista dinámica de disciplinas
const disciplinesList = computed(() => {
  const set = new Set()
  eventos.value.forEach((e) => {
    if (e.disciplina) set.add(e.disciplina)
  })
  return ['TODOS', ...Array.from(set).sort()]
})

// Eventos filtrados
const filteredEventos = computed(() => {
  return eventos.value.filter((evt) => {
    if (selectedDiscipline.value !== 'TODOS' && evt.disciplina !== selectedDiscipline.value) {
      return false
    }
    if (selectedTipo.value !== 'TODOS' && evt.tipo_evento !== selectedTipo.value) {
      return false
    }
    return true
  })
})

function formatDateISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Cuadrícula mensual de días
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

// Mapear eventos por fecha (incluyendo eventos multifecha)
const eventosByDate = computed(() => {
  const map = {}
  filteredEventos.value.forEach((evt) => {
    if (!evt.fecha_inicio) return

    const startStr = evt.fecha_inicio.substring(0, 10)
    const endStr = evt.fecha_fin ? evt.fecha_fin.substring(0, 10) : startStr

    const [sy, sm, sd] = startStr.split('-').map(Number)
    const [ey, em, ed] = endStr.split('-').map(Number)

    const cur = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)

    // Límite de seguridad
    let safety = 0
    while (cur <= end && safety < 60) {
      const key = formatDateISO(cur)
      if (!map[key]) map[key] = []
      map[key].push(evt)
      cur.setDate(cur.getDate() + 1)
      safety++
    }
  })
  return map
})

// Modal de detalle de evento oficial
const selectedEventoModal = ref(null)

function openModal(evt) {
  selectedEventoModal.value = evt
}

function closeModal() {
  selectedEventoModal.value = null
}
</script>

<template>
  <section id="calendario" class="relative bg-slate-50 py-16 sm:py-24 border-t border-slate-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de Sección -->
      <div class="text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-900 mb-3 shadow-xs">
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Cronograma Oficializado SEDEDE</span>
        </div>
        <h2 class="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Calendario Oficial de Competiciones
        </h2>
        <p class="mt-3 text-sm sm:text-base text-slate-600">
          Consulte los eventos, campeonatos y torneos departamentales y nacionales oficializados por el SEDEDE Chuquisaca con reserva de escenarios deportivos en firme.
        </p>
      </div>

      <!-- Barra de Filtros y Navegación del Calendario -->
      <div class="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
          <!-- Botones de Navegación del Mes -->
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-brand-500 transition-all shadow-xs"
              @click="prevMonth"
            >
              ‹ Mes Anterior
            </button>
            <button
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              @click="goToday"
            >
              Hoy
            </button>
            <button
              class="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-brand-500 transition-all shadow-xs"
              @click="nextMonth"
            >
              Mes Siguiente ›
            </button>
          </div>

          <!-- Mes y Año Prominente -->
          <h3 class="font-display text-2xl font-black text-brand-700 tracking-tight text-center">
            {{ currentMonthLabel }}
          </h3>

          <!-- Filtros de Disciplina y Nivel -->
          <div class="flex flex-wrap items-center gap-2 justify-center md:justify-end">
            <select
              v-model="selectedDiscipline"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-600 focus:outline-none"
            >
              <option value="TODOS">Todas las disciplinas</option>
              <option v-for="d in disciplinesList.filter(d => d !== 'TODOS')" :key="d" :value="d">
                {{ d }}
              </option>
            </select>

            <select
              v-model="selectedTipo"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-600 focus:outline-none"
            >
              <option value="TODOS">Todos los niveles</option>
              <option value="Departamental">Departamental</option>
              <option value="Nacional">Nacional</option>
              <option value="Internacional">Internacional</option>
            </select>
          </div>
        </div>

        <!-- Leyenda de Estados Oficializados -->
        <div class="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          <div class="flex items-center gap-4">
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              Oficializado SEDEDE
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
              Nivel Nacional
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
              Internacional
            </span>
          </div>
          <span class="text-[11px] text-slate-400">
            * Haga clic en cualquier torneo para consultar la ficha técnica y escenario.
          </span>
        </div>
      </div>

      <!-- Cuadrícula Mensual del Calendario (Vista Real de Calendario) -->
      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div class="overflow-x-auto">
          <div class="min-w-[720px]">
            <!-- Días de la Semana -->
            <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center font-display text-xs font-extrabold uppercase tracking-wider text-slate-700">
              <div class="py-3">Lunes</div>
              <div class="py-3">Martes</div>
              <div class="py-3">Miércoles</div>
              <div class="py-3">Jueves</div>
              <div class="py-3">Viernes</div>
              <div class="py-3 text-brand-700 bg-brand-50/50">Sábado</div>
              <div class="py-3 text-brand-700 bg-brand-50/50">Domingo</div>
            </div>

            <!-- Celdas de Días -->
            <div class="grid grid-cols-7 border-l border-t border-slate-200">
              <div
                v-for="(day, index) in calendarDays"
                :key="index"
                class="min-h-[115px] border-b border-r border-slate-200 p-2 transition-colors hover:bg-slate-50/80 flex flex-col justify-between"
                :class="{
                  'bg-slate-50/50 text-slate-400': !day.isCurrentMonth,
                  'bg-white text-slate-900': day.isCurrentMonth,
                  'ring-2 ring-brand-500 ring-inset bg-brand-50/20': day.isToday
                }"
              >
                <!-- Número del día -->
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
                  <span v-if="day.isToday" class="text-[10px] font-bold text-brand-700">Hoy</span>
                </div>

                <!-- Lista de Eventos en este Día -->
                <div class="space-y-1.5 flex-1">
                  <div
                    v-for="evt in (eventosByDate[day.dateString] || []).slice(0, 3)"
                    :key="evt.id"
                    class="rounded px-2 py-1 text-[11px] font-bold shadow-xs cursor-pointer truncate flex items-center justify-between gap-1 border transition-all hover:scale-[1.02]"
                    :class="{
                      'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100': evt.tipo_evento === 'Departamental',
                      'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100': evt.tipo_evento === 'Nacional',
                      'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100': evt.tipo_evento === 'Internacional'
                    }"
                    @click="openModal(evt)"
                    :title="`${evt.nombre_evento} (${evt.disciplina})`"
                  >
                    <span class="truncate">
                      <span class="text-emerald-700">✓</span>
                      {{ evt.asociacion?.sigla || evt.disciplina }}: {{ evt.nombre_evento }}
                    </span>
                  </div>

                  <div
                    v-if="(eventosByDate[day.dateString] || []).length > 3"
                    class="text-[10px] font-bold text-brand-700 pl-1 cursor-pointer hover:underline"
                    @click="openModal(eventosByDate[day.dateString][3])"
                  >
                    + {{ (eventosByDate[day.dateString] || []).length - 3 }} evento(s) más
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle de Evento Oficializado -->
    <div
      v-if="selectedEventoModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      @click.self="closeModal"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div class="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold border border-emerald-300 inline-flex items-center gap-1">
              <span>✓</span> Oficializado por SEDEDE
            </span>
            <h3 class="mt-2 font-display text-xl font-bold text-ink">
              {{ selectedEventoModal.nombre_evento }}
            </h3>
          </div>
          <button
            class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold"
            @click="closeModal"
          >
            ✕
          </button>
        </div>

        <div class="mt-4 space-y-3.5 text-xs">
          <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <p class="font-bold text-slate-500 uppercase text-[10px]">Disciplina</p>
              <p class="font-bold text-sm text-slate-800">{{ selectedEventoModal.disciplina }}</p>
            </div>
            <div>
              <p class="font-bold text-slate-500 uppercase text-[10px]">Ámbito</p>
              <span class="inline-block mt-0.5 rounded px-2 py-0.5 font-bold"
                :class="{
                  'bg-blue-100 text-blue-800': selectedEventoModal.tipo_evento === 'Departamental',
                  'bg-purple-100 text-purple-800': selectedEventoModal.tipo_evento === 'Nacional',
                  'bg-amber-100 text-amber-900': selectedEventoModal.tipo_evento === 'Internacional'
                }"
              >
                {{ selectedEventoModal.tipo_evento }}
              </span>
            </div>
          </div>

          <div>
            <p class="font-bold text-slate-500 uppercase text-[10px]">Asociación Departamental Responsable</p>
            <p class="font-semibold text-slate-800 mt-0.5">
              {{ selectedEventoModal.asociacion?.nombre || 'Asociación Departamental' }}
              <span v-if="selectedEventoModal.asociacion?.sigla" class="text-brand-700">({{ selectedEventoModal.asociacion.sigla }})</span>
            </p>
          </div>

          <div>
            <p class="font-bold text-slate-500 uppercase text-[10px]">Escenario Deportivo Asignado</p>
            <p class="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span>🏟️</span>
              <span>{{ selectedEventoModal.escenario?.nombre || 'Escenario Departamental SEDEDE' }}</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="font-bold text-slate-500 uppercase text-[10px]">Fecha de Inicio</p>
              <p class="font-mono font-bold text-slate-800">
                {{ selectedEventoModal.fecha_inicio ? selectedEventoModal.fecha_inicio.substring(0, 10) : '—' }}
              </p>
            </div>
            <div>
              <p class="font-bold text-slate-500 uppercase text-[10px]">Fecha de Finalización</p>
              <p class="font-mono font-bold text-slate-800">
                {{ selectedEventoModal.fecha_fin ? selectedEventoModal.fecha_fin.substring(0, 10) : (selectedEventoModal.fecha_inicio ? selectedEventoModal.fecha_inicio.substring(0, 10) : '—') }}
              </p>
            </div>
          </div>

          <div v-if="selectedEventoModal.observaciones" class="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
            <p class="font-bold text-blue-900 uppercase text-[10px]">Observaciones / Resoluciones SEDEDE</p>
            <p class="text-blue-800 mt-1">{{ selectedEventoModal.observaciones }}</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end border-t border-slate-100 pt-3">
          <button
            class="rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white hover:bg-brand-800 shadow-sm"
            @click="closeModal"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
