<script setup>
import { ref, computed, onMounted } from 'vue'
import { calendarioAnualService } from '../../services/calendarioAnualService'

const loading = ref(true)
const error = ref(null)
const events = ref([])
const selectedType = ref('TODOS')
const selectedMonth = ref('TODOS')
const selectedDiscipline = ref('TODOS')
const searchQuery = ref('')
const viewMode = ref('grid') // 'grid' | 'timeline'
const selectedEvent = ref(null)

const monthsList = [
  { value: 'TODOS', label: 'Todo el año' },
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const typesList = [
  { id: 'TODOS', label: 'Todos los niveles' },
  { id: 'Departamental', label: 'Departamental (Local)' },
  { id: 'Nacional', label: 'Nacional' },
  { id: 'Internacional', label: 'Internacional' },
]

const fetchPublicCalendar = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await calendarioAnualService.getPublicEvents()
    events.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error al cargar calendario público:', err)
    error.value = 'No se pudo cargar el calendario deportivo en este momento.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPublicCalendar()
})

const disciplinesList = computed(() => {
  const set = new Set()
  events.value.forEach((e) => {
    if (e.disciplina) set.add(e.disciplina)
  })
  return ['TODOS', ...Array.from(set).sort()]
})

const stats = computed(() => {
  const total = events.value.length
  const departamentales = events.value.filter((e) => e.tipo_evento === 'Departamental').length
  const nacionales = events.value.filter((e) => e.tipo_evento === 'Nacional').length
  const internacionales = events.value.filter((e) => e.tipo_evento === 'Internacional').length
  return { total, departamentales, nacionales, internacionales }
})

const filteredEvents = computed(() => {
  return events.value.filter((evt) => {
    // Tipo de evento
    if (selectedType.value !== 'TODOS' && evt.tipo_evento !== selectedType.value) {
      return false
    }

    // Disciplina
    if (selectedDiscipline.value !== 'TODOS' && evt.disciplina !== selectedDiscipline.value) {
      return false
    }

    // Mes
    if (selectedMonth.value !== 'TODOS') {
      const monthStr = evt.fecha_inicio ? evt.fecha_inicio.substring(5, 7) : ''
      if (monthStr !== selectedMonth.value) {
        return false
      }
    }

    // Búsqueda de texto
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase().trim()
      const matchName = evt.nombre_evento?.toLowerCase().includes(q)
      const matchDisc = evt.disciplina?.toLowerCase().includes(q)
      const matchAsoc = evt.asociacion?.nombre?.toLowerCase().includes(q) || evt.asociacion?.sigla?.toLowerCase().includes(q)
      const matchEsc = evt.escenario?.nombre?.toLowerCase().includes(q) || evt.escenario?.espacio?.toLowerCase().includes(q)
      if (!matchName && !matchDisc && !matchAsoc && !matchEsc) {
        return false
      }
    }

    return true
  })
})

const eventsByMonth = computed(() => {
  const map = {}
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  filteredEvents.value.forEach((evt) => {
    const monthNum = parseInt(evt.fecha_inicio ? evt.fecha_inicio.substring(5, 7) : '1', 10) - 1
    const groupName = `${monthNames[monthNum] || 'Sin Fecha'} 2026`
    if (!map[groupName]) {
      map[groupName] = []
    }
    map[groupName].push(evt)
  })

  return map
})

const formatDateRange = (inicio, fin) => {
  if (!inicio) return ''
  const partIni = inicio.substring(0, 10).split('-')
  const y1 = partIni[0]
  const m1 = parseInt(partIni[1], 10) - 1
  const d1 = parseInt(partIni[2], 10)

  const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  if (!fin || inicio === fin) {
    return `${d1} ${monthNamesShort[m1]} ${y1}`
  }

  const partFin = fin.substring(0, 10).split('-')
  const m2 = parseInt(partFin[1], 10) - 1
  const d2 = parseInt(partFin[2], 10)

  if (m1 === m2) {
    return `${d1} al ${d2} de ${monthNamesShort[m1]} ${y1}`
  }
  return `${d1} ${monthNamesShort[m1]} - ${d2} ${monthNamesShort[m2]} ${y1}`
}

const getBadgeTypeStyle = (tipo) => {
  switch (tipo) {
    case 'Departamental':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Nacional':
      return 'bg-navyflag/10 text-navyflag border-navyflag/20 font-bold'
    case 'Internacional':
      return 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const openDetailModal = (event) => {
  selectedEvent.value = event
}

const closeDetailModal = () => {
  selectedEvent.value = null
}
</script>

<template>
  <section id="calendario" class="relative overflow-hidden bg-slate-50 py-20">
    <!-- Ancla alternativa compatible con links previos -->
    <div id="eventos" class="absolute -top-10 left-0"></div>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Encabezado Institucional -->
      <div class="text-center md:text-left md:flex md:items-end md:justify-between">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 mb-3">
            <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Calendario Deportivo Anual Oficial 2026
          </div>
          <h2 class="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Eventos y Torneos Oficializados de Chuquisaca
          </h2>
          <p class="mt-3 text-base text-slate-600">
            Cronograma oficial y homologado de todas las disciplinas departamentales aprobado por la
            dirección técnica del SEDEDE. Reservas garantizadas y aval deportivo legal.
          </p>
        </div>

        <!-- Indicador de estado de aprobación -->
        <div class="mt-4 md:mt-0 flex items-center justify-center md:justify-end gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Solo calendarios aprobados en firme (Oficializados)
        </div>
      </div>

      <!-- Tarjetas de Estadísticas Resumen -->
      <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Eventos Aprobados</p>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="font-display text-2xl font-bold text-ink">{{ stats.total }}</span>
            <span class="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">100% Avalados</span>
          </div>
        </div>

        <div class="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wider text-blue-800">Departamentales</p>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="font-display text-2xl font-bold text-blue-900">{{ stats.departamentales }}</span>
            <span class="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Locales</span>
          </div>
        </div>

        <div class="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wider text-navyflag">Nacionales</p>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="font-display text-2xl font-bold text-navyflag">{{ stats.nacionales }}</span>
            <span class="rounded bg-navyflag/15 px-2 py-0.5 text-[11px] font-bold text-navyflag">Bolivia</span>
          </div>
        </div>

        <div class="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wider text-amber-800">Internacionales</p>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="font-display text-2xl font-bold text-amber-900">{{ stats.internacionales }}</span>
            <span class="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Sudamericanos</span>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <!-- Búsqueda -->
          <div class="relative flex-1">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por evento, disciplina, escenario o asociación..."
              class="block w-full rounded-lg border border-slate-300 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-ink placeholder-slate-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <!-- Selectores (Disciplina y Mes) -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="w-full sm:w-auto">
              <select
                v-model="selectedDiscipline"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                <option value="TODOS">Todas las disciplinas</option>
                <option v-for="disc in disciplinesList.filter(d => d !== 'TODOS')" :key="disc" :value="disc">
                  {{ disc }}
                </option>
              </select>
            </div>

            <div class="w-full sm:w-auto">
              <select
                v-model="selectedMonth"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                <option v-for="m in monthsList" :key="m.value" :value="m.value">
                  {{ m.label }}
                </option>
              </select>
            </div>

            <!-- Botones de Vista (Cuadrícula / Línea de tiempo) -->
            <div class="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                :class="[
                  'rounded px-2.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5',
                  viewMode === 'grid' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-ink'
                ]"
                @click="viewMode = 'grid'"
                title="Vista en cuadrícula"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Tarjetas
              </button>
              <button
                type="button"
                :class="[
                  'rounded px-2.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5',
                  viewMode === 'timeline' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-ink'
                ]"
                @click="viewMode = 'timeline'"
                title="Vista en cronograma mensual"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Cronograma
              </button>
            </div>
          </div>
        </div>

        <!-- Pestañas de Nivel (Tipo de Evento) -->
        <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span class="text-xs font-semibold text-slate-500 mr-1">Ámbito:</span>
          <button
            v-for="t in typesList"
            :key="t.id"
            type="button"
            :class="[
              'rounded-full px-3.5 py-1 text-xs font-medium transition-colors',
              selectedType === t.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
            @click="selectedType = t.id"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- Estado de Carga -->
      <div v-if="loading" class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="h-5 w-24 rounded bg-slate-200"></div>
            <div class="h-5 w-16 rounded bg-slate-200"></div>
          </div>
          <div class="mt-4 h-6 w-3/4 rounded bg-slate-200"></div>
          <div class="mt-2 h-4 w-1/2 rounded bg-slate-200"></div>
          <div class="mt-6 border-t border-slate-100 pt-4">
            <div class="h-4 w-2/3 rounded bg-slate-200"></div>
          </div>
        </div>
      </div>

      <!-- Estado de Error -->
      <div v-else-if="error" class="mt-12 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p class="text-sm font-semibold text-red-700">{{ error }}</p>
        <button
          @click="fetchPublicCalendar"
          class="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Reintentar carga
        </button>
      </div>

      <!-- Estado Sin Resultados -->
      <div v-else-if="filteredEvents.length === 0" class="mt-12 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 class="mt-3 text-base font-semibold text-ink">No se encontraron eventos</h3>
        <p class="mt-1 text-sm text-slate-500">
          No hay eventos oficiales aprobados que coincidan con los filtros seleccionados.
        </p>
        <button
          type="button"
          @click="selectedType = 'TODOS'; selectedMonth = 'TODOS'; selectedDiscipline = 'TODOS'; searchQuery = ''"
          class="mt-4 inline-flex items-center rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Limpiar filtros
        </button>
      </div>

      <!-- VISTA EN CUADRÍCULA (GRID) -->
      <div v-else-if="viewMode === 'grid'" class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md"
        >
          <div>
            <!-- Cabecera de Tarjeta: Tipo y Sello Aprobado -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <span
                :class="[
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs',
                  getBadgeTypeStyle(event.tipo_evento)
                ]"
              >
                {{ event.tipo_evento }}
              </span>

              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <svg class="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Oficializado
              </span>
            </div>

            <!-- Rango de Fechas -->
            <div class="flex items-center gap-2 text-xs font-semibold text-brand-700 mb-2">
              <svg class="h-4 w-4 shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ formatDateRange(event.fecha_inicio, event.fecha_fin) }}</span>
            </div>

            <!-- Título del Evento -->
            <h3 class="font-display text-lg font-bold text-ink group-hover:text-brand-700 transition-colors line-clamp-2">
              {{ event.nombre_evento }}
            </h3>

            <!-- Categoría y Disciplina -->
            <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span class="inline-block rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                {{ event.disciplina }}
              </span>
              <span>•</span>
              <span class="font-medium text-slate-600">{{ event.categoria || 'Categoría General' }}</span>
            </div>

            <!-- Escenario / Ubicación -->
            <div class="mt-4 flex items-start gap-2 text-xs text-slate-600">
              <svg class="h-4 w-4 shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p class="font-semibold text-slate-800">
                  {{ event.escenario?.nombre || 'Escenario Departamental SEDEDE' }}
                </p>
                <p v-if="event.escenario?.espacio" class="text-slate-500">
                  {{ event.escenario.espacio }}
                </p>
              </div>
            </div>
          </div>

          <!-- Pie de Tarjeta: Asociación Organizadora y Botón -->
          <div class="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
            <div class="flex items-center gap-2 overflow-hidden">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-extrabold text-[10px]">
                {{ event.asociacion?.sigla || 'ASO' }}
              </div>
              <span class="truncate text-xs font-medium text-slate-700" :title="event.asociacion?.nombre">
                {{ event.asociacion?.nombre || 'Asociación Departamental' }}
              </span>
            </div>

            <button
              type="button"
              @click="openDetailModal(event)"
              class="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors ml-2"
            >
              Detalles →
            </button>
          </div>
        </div>
      </div>

      <!-- VISTA EN CRONOGRAMA MENSUAL (TIMELINE) -->
      <div v-else class="mt-8 space-y-8">
        <div
          v-for="(evts, monthTitle) in eventsByMonth"
          :key="monthTitle"
          class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <div class="h-3 w-3 rounded-full bg-brand-600"></div>
            <h3 class="font-display text-xl font-bold text-ink">{{ monthTitle }}</h3>
            <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {{ evts.length }} {{ evts.length === 1 ? 'evento' : 'eventos' }}
            </span>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="event in evts"
              :key="event.id"
              class="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div class="flex items-start gap-4">
                <!-- Chip de Fecha Grande -->
                <div class="shrink-0 w-24 rounded-xl bg-brand-50 border border-brand-100 p-2 text-center">
                  <span class="block font-mono text-xs font-bold text-brand-700">
                    {{ formatDateRange(event.fecha_inicio, event.fecha_fin) }}
                  </span>
                </div>

                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span :class="['inline-flex items-center rounded-full border px-2 py-0.2 text-[10px]', getBadgeTypeStyle(event.tipo_evento)]">
                      {{ event.tipo_evento }}
                    </span>
                    <span class="text-xs font-bold text-slate-700">
                      {{ event.disciplina }} ({{ event.categoria }})
                    </span>
                  </div>
                  <h4 class="font-display text-base font-bold text-ink">
                    {{ event.nombre_evento }}
                  </h4>
                  <p class="text-xs text-slate-500 mt-0.5">
                    📍 {{ event.escenario?.nombre || 'Escenario Departamental' }}
                    <span v-if="event.escenario?.espacio">({{ event.escenario.espacio }})</span>
                    • {{ event.asociacion?.nombre }}
                  </p>
                </div>
              </div>

              <div class="shrink-0 flex items-center gap-3 self-end md:self-center">
                <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  ✓ Aprobado SEDEDE
                </span>
                <button
                  type="button"
                  @click="openDetailModal(event)"
                  class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ver Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje Institucional de Transparencia al pie -->
      <div class="mt-12 rounded-xl bg-gradient-to-r from-brand-900 via-brand-800 to-navyflag p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 class="font-display text-base font-bold">Garantía de Escenarios y Seguridad Deportiva</h4>
            <p class="text-xs text-brand-100/90 mt-0.5">
              Todos los eventos reflejados en este calendario cuentan con reserva horaria confirmada en los escenarios
              oficiales y homologación del Gobierno Autónomo Departamental de Chuquisaca.
            </p>
          </div>
        </div>

        <router-link
          to="/login"
          class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-brand-700 shadow-sm hover:bg-brand-50 transition-colors"
        >
          Portal de Asociaciones SEDEDE
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </router-link>
      </div>
    </div>

    <!-- MODAL DE DETALLE DEL EVENTO -->
    <div
      v-if="selectedEvent"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      @click.self="closeDetailModal"
    >
      <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold mb-2', getBadgeTypeStyle(selectedEvent.tipo_evento)]">
              {{ selectedEvent.tipo_evento }}
            </span>
            <h3 class="font-display text-xl font-bold text-ink">
              {{ selectedEvent.nombre_evento }}
            </h3>
          </div>
          <button
            type="button"
            @click="closeDetailModal"
            class="text-slate-400 hover:text-slate-600 p-1"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="mt-4 space-y-3.5 text-sm">
          <div class="flex items-center justify-between rounded-lg bg-emerald-50 p-3 border border-emerald-200">
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-xs font-bold text-emerald-800">Estado de Validación:</span>
            </div>
            <span class="text-xs font-extrabold uppercase text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs">
              {{ selectedEvent.estado_evento }} (Homologado)
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span class="text-[11px] font-semibold text-slate-500 uppercase">Disciplina</span>
              <p class="font-bold text-ink mt-0.5">{{ selectedEvent.disciplina }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span class="text-[11px] font-semibold text-slate-500 uppercase">Categoría</span>
              <p class="font-bold text-ink mt-0.5">{{ selectedEvent.categoria || 'Abierta' }}</p>
            </div>
          </div>

          <div class="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-500 uppercase">Fechas de Competencia</span>
            <p class="font-bold text-brand-700 mt-0.5 flex items-center gap-1.5">
              📅 {{ formatDateRange(selectedEvent.fecha_inicio, selectedEvent.fecha_fin) }}
            </p>
          </div>

          <div class="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-500 uppercase">Escenario y Pista Asignada</span>
            <p class="font-bold text-ink mt-0.5">
              {{ selectedEvent.escenario?.nombre || 'Escenario Departamental SEDEDE' }}
            </p>
            <p v-if="selectedEvent.escenario?.espacio" class="text-xs text-slate-500 mt-0.5">
              Espacio: {{ selectedEvent.escenario.espacio }}
            </p>
          </div>

          <div class="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-500 uppercase">Asociación Solicitante</span>
            <p class="font-bold text-ink mt-0.5">
              {{ selectedEvent.asociacion?.nombre }} ({{ selectedEvent.asociacion?.sigla }})
            </p>
          </div>

          <div v-if="selectedEvent.observaciones" class="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span class="text-[11px] font-semibold text-slate-500 uppercase">Respaldo / Observaciones Técnicas</span>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              {{ selectedEvent.observaciones }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            @click="closeDetailModal"
            class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
