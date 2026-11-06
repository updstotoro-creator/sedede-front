<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { asociacionService } from '../services/asociacionService'

const auth = useAuthStore()

// Roles y contexto de usuario
const isSededeOrAdmin = computed(() => ['admin', 'sedede', 'personal_sedede'].includes(auth.user?.role?.nombre))
const isAsociacion = computed(() => ['asociacion', 'coordinador_asociacion'].includes(auth.user?.role?.nombre))
const miAsociacionId = computed(() => auth.user?.asociacion_id ? Number(auth.user.asociacion_id) : null)

// Estado de datos
const asociaciones = ref([])
const selectedAsocId = ref(null)
const currentAsociacion = ref(null)
const clubes = ref([])
const deportistas = ref([])
const loading = ref(true)
const actionLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Filtros
const searchTerm = ref('')
const filterClub = ref('')
const filterEstado = ref('todos') // 'todos', 'listos_asociacion', 'pendiente_club', 'aceptados', 'rechazados'

// Modales
const showAprobarModal = ref(false)
const showObservarModal = ref(false)
const showFichaModal = ref(false)
const selectedDeportista = ref(null)

const formAprobar = reactive({
  observaciones: 'Aceptado y acreditado formalmente por la Directiva de la Asociación Departamental.',
})

const formObservar = reactive({
  observaciones: '',
})

// KPIs Computados
const totalDeportistas = computed(() => deportistas.value.length)

const pendientesClub = computed(() => {
  return deportistas.value.filter(d => d.club_id && d.estado_afiliacion_club !== 'aceptado').length
})

const listosParaAsociacion = computed(() => {
  return deportistas.value.filter(d => 
    (!d.club_id || d.estado_afiliacion_club === 'aceptado') && 
    d.estado_afiliacion_asociacion === 'pendiente'
  ).length
})

const acreditadosOficiales = computed(() => {
  return deportistas.value.filter(d => d.estado_afiliacion_asociacion === 'aceptado').length
})

const observadosAsociacion = computed(() => {
  return deportistas.value.filter(d => d.estado_afiliacion_asociacion === 'rechazado').length
})

// Filtrado de la lista en cliente
const deportistasFiltrados = computed(() => {
  return deportistas.value.filter((d) => {
    // Filtro por Club
    if (filterClub.value && String(d.club_id) !== String(filterClub.value)) {
      return false
    }

    // Filtro por Estado
    if (filterEstado.value === 'listos_asociacion') {
      if ((d.club_id && d.estado_afiliacion_club !== 'aceptado') || d.estado_afiliacion_asociacion !== 'pendiente') {
        return false
      }
    } else if (filterEstado.value === 'pendiente_club') {
      if (!d.club_id || d.estado_afiliacion_club === 'aceptado') return false
    } else if (filterEstado.value === 'aceptados') {
      if (d.estado_afiliacion_asociacion !== 'aceptado') return false
    } else if (filterEstado.value === 'rechazados') {
      if (d.estado_afiliacion_asociacion !== 'rechazado') return false
    }

    // Filtro de búsqueda
    if (searchTerm.value.trim()) {
      const q = searchTerm.value.toLowerCase().trim()
      const fullName = `${d.nombres || ''} ${d.apellidos || ''}`.toLowerCase()
      const ci = String(d.ci || '').toLowerCase()
      const disc = String(d.disciplina || '').toLowerCase()
      const cat = String(d.categoria || '').toLowerCase()
      const clubName = String(d.club?.nombre || '').toLowerCase()
      if (!fullName.includes(q) && !ci.includes(q) && !disc.includes(q) && !cat.includes(q) && !clubName.includes(q)) {
        return false
      }
    }

    return true
  })
})

function calcularEdad(fechaNac) {
  if (!fechaNac) return null
  const dob = new Date(fechaNac)
  if (isNaN(dob.getTime())) return null
  const diffMs = Date.now() - dob.getTime()
  return Math.abs(new Date(diffMs).getUTCFullYear() - 1970)
}

async function init() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (isSededeOrAdmin.value) {
      // Cargar lista de asociaciones para el selector
      const asocs = await asociacionService.list()
      asociaciones.value = asocs
      if (asocs.length > 0) {
        selectedAsocId.value = asocs[0].id
        currentAsociacion.value = asocs[0]
      }
    } else {
      // Es usuario de asociación
      selectedAsocId.value = miAsociacionId.value
      try {
        const asocs = await asociacionService.list()
        asociaciones.value = asocs
        currentAsociacion.value = asocs.find(a => a.id === miAsociacionId.value) || null
      } catch (err) {
        console.warn('No se pudo cargar la lista completa de asociaciones', err)
      }
    }

    if (selectedAsocId.value) {
      await cargarDatosAsociacion(selectedAsocId.value)
    }
  } catch (err) {
    console.error('Error inicializando vista:', err)
    errorMessage.value = 'Ocurrió un error al cargar la información institucional.'
  } finally {
    loading.value = false
  }
}

async function cargarDatosAsociacion(asocId) {
  if (!asocId) return
  loading.value = true
  errorMessage.value = ''
  try {
    const [resDep, resClubes] = await Promise.all([
      asociacionService.getDeportistas(asocId),
      asociacionService.listClubes(asocId).catch(() => [])
    ])

    deportistas.value = resDep.data || []
    clubes.value = Array.isArray(resClubes) ? resClubes : (resClubes.data || [])

    if (!currentAsociacion.value || currentAsociacion.value.id !== asocId) {
      currentAsociacion.value = asociaciones.value.find(a => a.id === asocId) || null
    }
  } catch (err) {
    console.error('Error al cargar datos de deportistas:', err)
    errorMessage.value = err.response?.data?.error || err.response?.data?.message || 'Error al obtener los deportistas de la asociación.'
  } finally {
    loading.value = false
  }
}

watch(selectedAsocId, async (newId) => {
  if (newId) {
    filterClub.value = ''
    searchTerm.value = ''
    await cargarDatosAsociacion(newId)
  }
})

// Acciones de Aprobación
function abrirAprobarModal(dep) {
  if (dep.club_id && dep.estado_afiliacion_club !== 'aceptado') {
    alert(`Regla de Federación: ${dep.nombres} ${dep.apellidos} debe ser aprobado primero formalmente por su club (${dep.club?.nombre || 'Club asignado'}).`)
    return
  }
  selectedDeportista.value = dep
  formAprobar.observaciones = `Aceptado y acreditado formalmente por la Directiva de ${currentAsociacion.value?.nombre || 'la Asociación Departamental'}.`
  showAprobarModal.value = true
}

async function confirmarAprobacion() {
  if (!selectedDeportista.value) return
  actionLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await asociacionService.aceptarDeportista(selectedAsocId.value, selectedDeportista.value.id, {
      observaciones: formAprobar.observaciones.trim()
    })
    successMessage.value = `¡Excelente! El deportista ${selectedDeportista.value.nombres} ${selectedDeportista.value.apellidos} ha recibido el Visto Bueno formal y queda plenamente acreditado.`
    showAprobarModal.value = false
    await cargarDatosAsociacion(selectedAsocId.value)
  } catch (err) {
    console.error('Error aprobando deportista:', err)
    alert(err.response?.data?.error || err.response?.data?.message || 'Error al registrar el visto bueno del deportista.')
  } finally {
    actionLoading.value = false
  }
}

// Acciones de Observación / Rechazo
function abrirObservarModal(dep) {
  selectedDeportista.value = dep
  formObservar.observaciones = dep.observaciones_asociacion || ''
  showObservarModal.value = true
}

async function confirmarObservacion() {
  if (!selectedDeportista.value) return
  if (!formObservar.observaciones.trim()) {
    alert('Debe ingresar el motivo técnico o documental de la observación.')
    return
  }
  actionLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await asociacionService.rechazarDeportista(selectedAsocId.value, selectedDeportista.value.id, {
      observaciones: formObservar.observaciones.trim()
    })
    successMessage.value = `Se registró la observación de ${selectedDeportista.value.nombres} ${selectedDeportista.value.apellidos}. El club y el deportista deberán subsanarla.`
    showObservarModal.value = false
    await cargarDatosAsociacion(selectedAsocId.value)
  } catch (err) {
    console.error('Error observando deportista:', err)
    alert(err.response?.data?.error || err.response?.data?.message || 'Error al observar al deportista.')
  } finally {
    actionLoading.value = false
  }
}

// Ficha de Detalle
function verFicha(dep) {
  selectedDeportista.value = dep
  showFichaModal.value = true
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado de la Vista -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-lg">
            🏅
          </span>
          <div>
            <h1 class="font-display text-2xl font-bold tracking-tight text-slate-900">
              Aprobación y Acreditación de Deportistas
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Validación federativa en dos fases: Fase 1 (Club Deportivo) → Fase 2 (Asociación Departamental = Alta Oficial).
            </p>
          </div>
        </div>
      </div>

      <!-- Selector de Asociación para SEDEDE / Admin o Insignia Fija para Asociación -->
      <div class="flex items-center gap-2">
        <div v-if="isSededeOrAdmin" class="flex items-center gap-2">
          <label class="text-xs font-bold text-slate-600 uppercase tracking-wide">Asociación:</label>
          <select
            v-model="selectedAsocId"
            class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option v-for="a in asociaciones" :key="a.id" :value="a.id">
              {{ a.nombre }} ({{ a.sigla || 'ASOC' }})
            </option>
          </select>
        </div>

        <div v-else class="rounded-xl bg-brand-50 border border-brand-200 px-3.5 py-2 text-xs">
          <span class="text-slate-500 text-[11px] block font-medium">Asociación Asignada</span>
          <span class="font-bold text-brand-900">{{ currentAsociacion?.nombre || auth.user?.name || 'Mi Asociación' }}</span>
        </div>
      </div>
    </div>

    <!-- Alertas de Éxito / Error -->
    <div v-if="successMessage" class="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-2">
        <span class="text-lg">✅</span>
        <span>{{ successMessage }}</span>
      </div>
      <button class="text-emerald-700 font-bold hover:text-emerald-900 text-sm" @click="successMessage = ''">✕</button>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-2">
        <span class="text-lg">⚠️</span>
        <span>{{ errorMessage }}</span>
      </div>
      <button class="text-rose-700 font-bold hover:text-rose-900 text-sm" @click="errorMessage = ''">✕</button>
    </div>

    <!-- Guía del Proceso de Afiliación (2 Fases) -->
    <div class="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-slate-50 p-4 text-xs text-slate-700 shadow-sm">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            ⚖️
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Reglamento Oficial de Alta de Atletas</h3>
            <p class="text-slate-600 text-xs mt-0.5">
              Un deportista debe ser aprobado en primera instancia por su <strong>Club Deportivo</strong>. Tras esa verificación, la <strong>Asociación Departamental</strong> otorga el segundo visto bueno, logrando la <strong>Acreditación Federativa Definitiva</strong> para torneos oficiales y trámites SEDEDE.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs font-semibold shrink-0">
          <div class="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 shadow-xs">
            <span class="h-2 w-2 rounded-full bg-blue-500"></span>
            <span>1. Club</span>
          </div>
          <span class="text-slate-400">➔</span>
          <div class="flex items-center gap-1 rounded-lg bg-brand-100 border border-brand-300 text-brand-900 px-2.5 py-1.5 shadow-xs">
            <span class="h-2 w-2 rounded-full bg-brand-600"></span>
            <span>2. Asociación</span>
          </div>
          <span class="text-slate-400">➔</span>
          <div class="flex items-center gap-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 px-2.5 py-1.5 shadow-xs">
            <span>★ Alta Oficial</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Tarjetas Métricas / KPIs -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Afiliados -->
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
        <div class="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
          <span>Padrón Total</span>
          <span class="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-700 text-[11px]">Asociación</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-3xl font-extrabold text-slate-900">{{ totalDeportistas }}</span>
          <span class="text-xs text-slate-500">registrados</span>
        </div>
        <p class="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          Deportistas adscritos a los clubes afiliados
        </p>
      </div>

      <!-- Pendientes en Club -->
      <div class="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm hover:shadow-md transition">
        <div class="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
          <span>Fase 1: En Club</span>
          <span class="rounded-lg bg-amber-100 px-2 py-0.5 text-amber-900 text-[11px]">⏳ Pendiente</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-3xl font-extrabold text-amber-900">{{ pendientesClub }}</span>
          <span class="text-xs text-amber-700">en revisión de club</span>
        </div>
        <p class="mt-2 border-t border-amber-200/60 pt-2 text-[11px] text-amber-800">
          Requieren validación de su club antes de pasar a la asociación
        </p>
      </div>

      <!-- Listos para Aprobación Asociación -->
      <div class="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm hover:shadow-md transition">
        <div class="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider">
          <span>Fase 2: Listos</span>
          <span class="rounded-lg bg-blue-100 px-2 py-0.5 text-blue-900 text-[11px]">🔔 Requieren Visto Bueno</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-3xl font-extrabold text-blue-900">{{ listosParaAsociacion }}</span>
          <span class="text-xs text-blue-700">esperando aprobación</span>
        </div>
        <p class="mt-2 border-t border-blue-200/60 pt-2 text-[11px] text-blue-800">
          Aprobados por su club; listos para que la asociación les dé el alta
        </p>
      </div>

      <!-- Acreditados Oficiales -->
      <div class="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm hover:shadow-md transition">
        <div class="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <span>Alta Oficial</span>
          <span class="rounded-lg bg-emerald-100 px-2 py-0.5 text-emerald-900 text-[11px]">★ Acreditados</span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-3xl font-extrabold text-emerald-900">{{ acreditadosOficiales }}</span>
          <span class="text-xs text-emerald-700">habilitados plenos</span>
        </div>
        <p class="mt-2 border-t border-emerald-200/60 pt-2 text-[11px] text-emerald-800">
          Cumplieron Fase 1 y Fase 2 con resolución oficial
        </p>
      </div>
    </div>

    <!-- Barra de Búsqueda y Filtros -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
      <!-- Búsqueda por texto -->
      <div class="relative flex-1">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por nombre, CI, disciplina o categoría..."
          class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
      </div>

      <!-- Filtro por Club -->
      <div class="w-full md:w-56">
        <select
          v-model="filterClub"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Todos los Clubes Afiliados</option>
          <option v-for="c in clubes" :key="c.id" :value="c.id">
            {{ c.nombre }} ({{ c.sigla || 'Club' }})
          </option>
        </select>
      </div>

      <!-- Filtro por Estado de Afiliación -->
      <div class="w-full md:w-64">
        <select
          v-model="filterEstado"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="todos">Todos los Estados</option>
          <option value="listos_asociacion">🔔 Listos para Visto Bueno (Club ✓, Asoc ⏳)</option>
          <option value="pendiente_club">⏳ Pendientes en Club (Fase 1)</option>
          <option value="aceptados">★ Acreditados Oficiales (Alta)</option>
          <option value="rechazados">✕ Observados en Asociación</option>
        </select>
      </div>
    </div>

    <!-- Tabla Principal de Deportistas -->
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div v-if="loading" class="py-16 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
        <p class="mt-3 text-xs font-bold text-slate-600">Cargando padrón de deportistas afiliados...</p>
      </div>

      <div v-else-if="!deportistasFiltrados.length" class="py-16 text-center text-slate-400">
        <span class="text-4xl block mb-2">📋</span>
        <p class="font-bold text-slate-600 text-sm">No se encontraron deportistas</p>
        <p class="text-xs text-slate-400 mt-1">Pruebe ajustando los filtros de búsqueda, club o estado.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th class="px-4 py-3">Deportista</th>
              <th class="px-4 py-3">Club Adscrito</th>
              <th class="px-4 py-3">Disciplina & Categoría</th>
              <th class="px-4 py-3 text-center">Fase 1: Club</th>
              <th class="px-4 py-3 text-center">Fase 2: Asociación</th>
              <th class="px-4 py-3 text-right">Acciones de Acreditación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="dep in deportistasFiltrados"
              :key="dep.id"
              class="hover:bg-slate-50/80 transition"
              :class="{
                'bg-blue-50/30': dep.estado_afiliacion_club === 'aceptado' && dep.estado_afiliacion_asociacion === 'pendiente',
                'bg-emerald-50/20': dep.estado_afiliacion_asociacion === 'aceptado'
              }"
            >
              <!-- Info Deportista -->
              <td class="px-4 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    :class="dep.sexo === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'"
                  >
                    {{ (dep.nombres?.[0] || 'D') }}{{ (dep.apellidos?.[0] || '') }}
                  </div>
                  <div>
                    <div class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{{ dep.nombres }} {{ dep.apellidos }}</span>
                      <span
                        v-if="dep.es_menor_de_edad || (calcularEdad(dep.fecha_nacimiento) !== null && calcularEdad(dep.fecha_nacimiento) < 18)"
                        class="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800"
                        title="Atleta menor de edad. Requiere tutela legal."
                      >
                        Menor de Edad
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>CI: <strong class="text-slate-700">{{ dep.ci }} {{ dep.expedido || 'CH' }}</strong></span>
                      <span v-if="calcularEdad(dep.fecha_nacimiento) !== null">• {{ calcularEdad(dep.fecha_nacimiento) }} años</span>
                      <span>• Sexo: {{ dep.sexo === 'F' ? 'Fem' : 'Masc' }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Club -->
              <td class="px-4 py-3.5">
                <div v-if="dep.club" class="font-semibold text-slate-800">
                  {{ dep.club.nombre }}
                  <span v-if="dep.club.sigla" class="text-[10px] text-slate-500 block">({{ dep.club.sigla }})</span>
                </div>
                <div v-else class="text-slate-400 italic">
                  Sin Club Adscrito
                </div>
              </td>

              <!-- Disciplina & Categoría -->
              <td class="px-4 py-3.5">
                <div class="font-semibold text-slate-800">{{ dep.disciplina || currentAsociacion?.disciplinas?.[0] || 'General' }}</div>
                <span class="inline-block mt-0.5 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {{ dep.categoria || 'Senior' }}
                </span>
                <span v-if="dep.es_seleccionado_departamental" class="ml-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                  Selección CH
                </span>
              </td>

              <!-- Fase 1: Visto Bueno del Club -->
              <td class="px-4 py-3.5 text-center">
                <div class="inline-flex flex-col items-center">
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1 border shadow-xs"
                    :class="{
                      'bg-emerald-100 text-emerald-800 border-emerald-300': dep.estado_afiliacion_club === 'aceptado',
                      'bg-amber-100 text-amber-800 border-amber-300': dep.estado_afiliacion_club === 'pendiente',
                      'bg-rose-100 text-rose-800 border-rose-300': dep.estado_afiliacion_club === 'rechazado'
                    }"
                  >
                    <span>{{ dep.estado_afiliacion_club === 'aceptado' ? '✓' : dep.estado_afiliacion_club === 'rechazado' ? '✕' : '⏳' }}</span>
                    <span>{{ dep.estado_afiliacion_club === 'aceptado' ? 'Aprobado Club' : dep.estado_afiliacion_club === 'rechazado' ? 'Rechazado Club' : 'Pendiente Club' }}</span>
                  </span>
                  <span v-if="dep.fecha_afiliacion_club" class="text-[10px] text-slate-400 mt-1">
                    {{ new Date(dep.fecha_afiliacion_club).toLocaleDateString('es-BO') }}
                  </span>
                </div>
              </td>

              <!-- Fase 2: Visto Bueno de la Asociación -->
              <td class="px-4 py-3.5 text-center">
                <div class="inline-flex flex-col items-center">
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1 border shadow-xs"
                    :class="{
                      'bg-emerald-100 text-emerald-800 border-emerald-300': dep.estado_afiliacion_asociacion === 'aceptado',
                      'bg-amber-100 text-amber-800 border-amber-300': dep.estado_afiliacion_asociacion === 'pendiente',
                      'bg-rose-100 text-rose-800 border-rose-300': dep.estado_afiliacion_asociacion === 'rechazado'
                    }"
                  >
                    <span>{{ dep.estado_afiliacion_asociacion === 'aceptado' ? '★' : dep.estado_afiliacion_asociacion === 'rechazado' ? '✕' : '⏳' }}</span>
                    <span>{{ dep.estado_afiliacion_asociacion === 'aceptado' ? 'Acreditado / Alta' : dep.estado_afiliacion_asociacion === 'rechazado' ? 'Observado' : 'Pendiente Asoc' }}</span>
                  </span>
                  <span v-if="dep.fecha_afiliacion_asociacion" class="text-[10px] text-slate-400 mt-1">
                    {{ new Date(dep.fecha_afiliacion_asociacion).toLocaleDateString('es-BO') }}
                  </span>
                </div>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-3.5 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-1.5">
                  <!-- Botón Ver Ficha -->
                  <button
                    class="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 font-bold text-xs transition"
                    title="Ver Ficha y Documentación del Deportista"
                    @click="verFicha(dep)"
                  >
                    👁 Ficha
                  </button>

                  <!-- Si está pendiente en la Asociación -->
                  <template v-if="dep.estado_afiliacion_asociacion === 'pendiente'">
                    <!-- Si ya fue aprobado por el Club -> Puede Aprobar -->
                    <button
                      v-if="!dep.club_id || dep.estado_afiliacion_club === 'aceptado'"
                      class="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 shadow-sm transition flex items-center gap-1"
                      title="Otorgar el Visto Bueno definitivo y dar de alta oficial"
                      @click="abrirAprobarModal(dep)"
                    >
                      <span>✓</span> Dar Visto Bueno
                    </button>

                    <!-- Si aún NO fue aprobado por el Club -> Bloqueado con explicación -->
                    <button
                      v-else
                      disabled
                      class="rounded-lg bg-slate-100 text-slate-400 border border-slate-200 font-medium text-xs px-2.5 py-1.5 cursor-not-allowed flex items-center gap-1"
                      title="Regla federativa: Debe contar con el visto bueno del Club antes de que la Asociación pueda aprobarlo."
                    >
                      <span>🔒</span> Espera Club
                    </button>

                    <!-- Observar / Rechazar -->
                    <button
                      class="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-2.5 py-1.5 transition"
                      title="Observar postulación o solicitar correcciones"
                      @click="abrirObservarModal(dep)"
                    >
                      ✕ Observar
                    </button>
                  </template>

                  <!-- Si ya está Aceptado / Acreditado -->
                  <template v-else-if="dep.estado_afiliacion_asociacion === 'aceptado'">
                    <span class="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                      ✓ Alta Oficial
                    </span>
                    <button
                      class="rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 text-xs transition"
                      title="Revisar u observar acreditación"
                      @click="abrirObservarModal(dep)"
                    >
                      ⚙
                    </button>
                  </template>

                  <!-- Si está Observado -->
                  <template v-else>
                    <button
                      class="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1.5 shadow-sm transition"
                      title="Reevaluar y dar Visto Bueno"
                      @click="abrirAprobarModal(dep)"
                    >
                      Reevaluar
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: APROBAR / VISTO BUENO ASOCIACIÓN -->
    <div v-if="showAprobarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-emerald-100 p-2 text-emerald-700 text-lg">🏅</span>
            <div>
              <h3 class="font-display text-base font-bold text-slate-900">Dar Visto Bueno Federativo</h3>
              <p class="text-xs text-slate-500">Acreditación definitiva y alta oficial en la Asociación.</p>
            </div>
          </div>
          <button class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" @click="showAprobarModal = false">✕</button>
        </div>

        <div class="rounded-xl bg-slate-50 p-3 border border-slate-200 mb-4 text-xs space-y-1">
          <p><span class="text-slate-500 font-semibold">Deportista:</span> <strong class="text-slate-900">{{ selectedDeportista?.nombres }} {{ selectedDeportista?.apellidos }}</strong></p>
          <p><span class="text-slate-500 font-semibold">Cédula:</span> {{ selectedDeportista?.ci }} {{ selectedDeportista?.expedido || 'CH' }}</p>
          <p><span class="text-slate-500 font-semibold">Club de Origen:</span> {{ selectedDeportista?.club?.nombre || 'Club asignado' }} (Aprobado ✓)</p>
          <p><span class="text-slate-500 font-semibold">Disciplina:</span> {{ selectedDeportista?.disciplina || currentAsociacion?.disciplinas?.[0] }}</p>
        </div>

        <form @submit.prevent="confirmarAprobacion" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Observaciones o Resolución de Alta (Opcional):</label>
            <textarea
              v-model="formAprobar.observaciones"
              rows="3"
              class="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Indique número de resolución interna o aval federativo..."
              :disabled="actionLoading"
            ></textarea>
          </div>

          <div class="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" class="btn-secondary text-xs" :disabled="actionLoading" @click="showAprobarModal = false">
              Cancelar
            </button>
            <button type="submit" class="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition" :disabled="actionLoading">
              {{ actionLoading ? 'Validando...' : '✓ Confirmar Alta Oficial' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: OBSERVAR / RECHAZAR ASOCIACIÓN -->
    <div v-if="showObservarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-rose-100 p-2 text-rose-700 text-lg">⚠️</span>
            <div>
              <h3 class="font-display text-base font-bold text-slate-900">Observar Postulación de Deportista</h3>
              <p class="text-xs text-slate-500">El deportista y su club deberán subsanar los requisitos observados.</p>
            </div>
          </div>
          <button class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" @click="showObservarModal = false">✕</button>
        </div>

        <div class="rounded-xl bg-rose-50/50 p-3 border border-rose-200 mb-4 text-xs">
          <p><span class="text-slate-500 font-semibold">Deportista:</span> <strong class="text-slate-900">{{ selectedDeportista?.nombres }} {{ selectedDeportista?.apellidos }}</strong></p>
          <p><span class="text-slate-500 font-semibold">Club:</span> {{ selectedDeportista?.club?.nombre || 'Club asignado' }}</p>
        </div>

        <form @submit.prevent="confirmarObservacion" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Motivo técnico / requisitos faltantes *:</label>
            <textarea
              v-model="formObservar.observaciones"
              rows="4"
              class="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="Especifique el motivo: p. ej., falta certificado médico deportivo, documentación de tutor legal incompleta..."
              required
              :disabled="actionLoading"
            ></textarea>
          </div>

          <div class="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" class="btn-secondary text-xs" :disabled="actionLoading" @click="showObservarModal = false">
              Cancelar
            </button>
            <button type="submit" class="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition" :disabled="actionLoading">
              {{ actionLoading ? 'Registrando...' : '✕ Registrar Observación' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: FICHA COMPLETA DEL DEPORTISTA -->
    <div v-if="showFichaModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs overflow-y-auto">
      <div class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl my-8">
        <div class="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div class="flex items-center gap-3">
            <div
              class="h-12 w-12 rounded-full flex items-center justify-center font-bold text-base shadow-sm"
              :class="selectedDeportista?.sexo === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'"
            >
              {{ (selectedDeportista?.nombres?.[0] || 'D') }}{{ (selectedDeportista?.apellidos?.[0] || '') }}
            </div>
            <div>
              <h3 class="font-display text-lg font-bold text-slate-900">
                {{ selectedDeportista?.nombres }} {{ selectedDeportista?.apellidos }}
              </h3>
              <p class="text-xs text-slate-500">
                Ficha Técnica Federativa · {{ selectedDeportista?.disciplina || currentAsociacion?.disciplinas?.[0] }}
              </p>
            </div>
          </div>
          <button class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" @click="showFichaModal = false">✕</button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Estados del Flujo en Ficha -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border p-3" :class="selectedDeportista?.estado_afiliacion_club === 'aceptado' ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Fase 1: Club Deportivo</span>
              <span class="mt-1 block font-bold text-xs" :class="selectedDeportista?.estado_afiliacion_club === 'aceptado' ? 'text-emerald-800' : 'text-amber-800'">
                {{ selectedDeportista?.estado_afiliacion_club === 'aceptado' ? '✓ Aprobado por Club' : '⏳ Pendiente en Club' }}
              </span>
              <p v-if="selectedDeportista?.observaciones_club" class="mt-1 text-[11px] text-slate-600 italic">
                "{{ selectedDeportista.observaciones_club }}"
              </p>
            </div>

            <div class="rounded-xl border p-3" :class="selectedDeportista?.estado_afiliacion_asociacion === 'aceptado' ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Fase 2: Asociación</span>
              <span class="mt-1 block font-bold text-xs" :class="selectedDeportista?.estado_afiliacion_asociacion === 'aceptado' ? 'text-emerald-800' : 'text-amber-800'">
                {{ selectedDeportista?.estado_afiliacion_asociacion === 'aceptado' ? '★ Acreditado / Alta Oficial' : '⏳ Pendiente Aprobación' }}
              </span>
              <p v-if="selectedDeportista?.observaciones_asociacion" class="mt-1 text-[11px] text-slate-600 italic">
                "{{ selectedDeportista.observaciones_asociacion }}"
              </p>
            </div>
          </div>

          <!-- Datos de Identidad -->
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <span class="text-slate-500 block text-[11px]">Cédula de Identidad:</span>
              <strong class="text-slate-900">{{ selectedDeportista?.ci }} {{ selectedDeportista?.expedido || 'CH' }}</strong>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">Fecha de Nacimiento / Edad:</span>
              <strong class="text-slate-900">
                {{ selectedDeportista?.fecha_nacimiento ? new Date(selectedDeportista.fecha_nacimiento).toLocaleDateString('es-BO') : 'No registrado' }}
                ({{ calcularEdad(selectedDeportista?.fecha_nacimiento) || '—' }} años)
              </strong>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">Club Adscrito:</span>
              <strong class="text-slate-900">{{ selectedDeportista?.club?.nombre || 'Sin Club' }}</strong>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">Categoría Deportiva:</span>
              <strong class="text-slate-900">{{ selectedDeportista?.categoria || 'Senior' }}</strong>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">Teléfono de Contacto:</span>
              <strong class="text-slate-900">{{ selectedDeportista?.telefono || 'No registrado' }}</strong>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">Cuenta SIGEP (Acreditación):</span>
              <strong class="text-slate-900 font-mono">{{ selectedDeportista?.sigep_cuenta || 'Pendiente' }}</strong>
            </div>
          </div>

          <!-- Si es Menor de Edad -> Mostrar Tutor -->
          <div
            v-if="selectedDeportista?.es_menor_de_edad || (calcularEdad(selectedDeportista?.fecha_nacimiento) !== null && calcularEdad(selectedDeportista?.fecha_nacimiento) < 18)"
            class="rounded-xl border border-amber-200 bg-amber-50/60 p-4"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-amber-700 font-bold">🛡️ Información de Tutela Legal (Menor de Edad)</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span class="text-slate-500 block">Tutor / Representante Legal:</span>
                <strong class="text-slate-800">{{ selectedDeportista?.tutor_nombre || 'No registrado' }}</strong>
              </div>
              <div>
                <span class="text-slate-500 block">CI del Tutor:</span>
                <strong class="text-slate-800">{{ selectedDeportista?.tutor_ci || 'No registrado' }}</strong>
              </div>
              <div>
                <span class="text-slate-500 block">Teléfono de Emergencia / Tutor:</span>
                <strong class="text-slate-800">{{ selectedDeportista?.tutor_telefono || 'No registrado' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button class="btn-secondary text-xs" @click="showFichaModal = false">Cerrar</button>
          <button
            v-if="selectedDeportista?.estado_afiliacion_asociacion === 'pendiente' && (!selectedDeportista?.club_id || selectedDeportista?.estado_afiliacion_club === 'aceptado')"
            class="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition"
            @click="showFichaModal = false; abrirAprobarModal(selectedDeportista)"
          >
            ✓ Otorgar Visto Bueno
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
