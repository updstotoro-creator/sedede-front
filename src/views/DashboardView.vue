<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppSidebar from '../components/dashboard/AppSidebar.vue'
import { dashboardService } from '../services/dashboardService'
import { deportistaService } from '../services/deportistaService'
import { asociacionService } from '../services/asociacionService'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isDeportista = computed(() => auth.user?.role?.nombre === 'deportista')

const titles = {
  dashboard: 'Resumen',
  'dashboard-users': 'Usuarios',
  'dashboard-roles': 'Roles',
  'dashboard-asociaciones': 'Asociaciones',
  'dashboard-clubes': 'Clubes',
  'dashboard-asociacion-detalle': 'Clubes',
  'dashboard-club-detalle': 'Deportistas del Club',
  'dashboard-deportistas': 'Deportistas',
  'dashboard-tramites': 'Trámites',
  'dashboard-escenarios': 'Escenarios',
  'dashboard-tarifario': 'Tarifario',
  'dashboard-calendario-anual': 'Calendario Anual',
  'dashboard-comunidades': 'Mancomunidades y Comunidades',
  'dashboard-inventario-tipos-item': 'Tipos de Ítem',
  'dashboard-inventario-almacenes': 'Almacenes',
  'dashboard-inventario-lotes': 'Lotes',
  'dashboard-inventario-lotes-nuevo': 'Nuevo Lote',
  'dashboard-inventario-movimientos': 'Movimientos (Kardex)',
  'dashboard-inventario-movimientos-nuevo': 'Nuevo Movimiento',
  'dashboard-inventario-existencias': 'Existencias',
  'dashboard-poa': 'Estructura POA',
  'dashboard-poa-dashboard': 'Dashboard POA',
  'dashboard-poa-planes': 'Planes POA',
  'dashboard-poa-actividad': 'Actividad POA',
  'dashboard-poa-techos': 'Techos Presupuestarios',
  'dashboard-poa-bitacora': 'Bitácora de Metas',
}

const isLoading = ref(true)
const errorMessage = ref('')
const metrics = ref(null)

const fechaDesde = ref('')
const fechaHasta = ref('')

// Estado para Portal Deportista
const deportistaPerfil = ref(null)
const deportistaAlertas = ref([])
const deportistaLogros = ref([])
const deportistaTramites = ref([])
const asociacionesList = ref([])
const clubesList = ref([])
const loadingClubes = ref(false)
const perfilSaving = ref(false)
const perfilSuccessMsg = ref('')
const perfilErrorMsg = ref('')

const perfilForm = reactive({
  nombres: '',
  apellidos: '',
  ci: '',
  expedido: 'CH',
  fecha_nacimiento: '',
  telefono: '',
  direccion: '',
  asociacion_id: '',
  club_id: '',
  sigep_cuenta: '',
  tutor_nombre: '',
  tutor_ci: '',
  tutor_telefono: '',
})

const searchQuery = ref('')
const searchInput = ref(null)

function onGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

watch(() => route.fullPath, () => {
  searchQuery.value = ''
})

const deportistaEdad = computed(() => {
  if (!perfilForm.fecha_nacimiento) return null
  const hoy = new Date()
  const nac = new Date(perfilForm.fecha_nacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
})

const esMenorDeportista = computed(() => {
  return deportistaEdad.value !== null && deportistaEdad.value < 18
})

const anioActual = new Date().getFullYear()
const presetActivo = ref(null)

const tramitesConcluidos = computed(() => {
  const t = metrics.value?.tramites
  if (!t) return null
  const rest = (t.total_tramites || 0) - (t.en_revision || 0)
  return rest >= 0 ? rest : null
})

function setPresetFecha(preset) {
  presetActivo.value = preset
  const hoy = new Date()
  if (preset === 'hoy') {
    const str = hoy.toISOString().split('T')[0]
    fechaDesde.value = str
    fechaHasta.value = str
  } else if (preset === 'mes') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    fechaDesde.value = inicio.toISOString().split('T')[0]
    fechaHasta.value = fin.toISOString().split('T')[0]
  } else if (preset === 'anio') {
    fechaDesde.value = `${hoy.getFullYear()}-01-01`
    fechaHasta.value = `${hoy.getFullYear()}-12-31`
  } else if (preset === 'todo') {
    fechaDesde.value = ''
    fechaHasta.value = ''
  }
  fetchMetrics()
}

async function fetchMetrics() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const params = {}
    if (fechaDesde.value) params.fecha_desde = fechaDesde.value
    if (fechaHasta.value) params.fecha_hasta = fechaHasta.value

    const res = await dashboardService.getExecutiveMetrics(params)
    metrics.value = res
  } catch (e) {
    errorMessage.value = e.response?.data?.error || 'Error al cargar datos'
  } finally {
    isLoading.value = false
  }
}

async function fetchDeportistaData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await deportistaService.getMiPerfil()
    const dep = res.data || res.deportista || {}
    deportistaPerfil.value = dep
    deportistaAlertas.value = res.alertas || []
    deportistaLogros.value = res.logros || []
    deportistaTramites.value = res.tramites || []

    // Llenar formulario de perfil
    perfilForm.nombres = dep.nombres || ''
    perfilForm.apellidos = dep.apellidos || ''
    perfilForm.ci = dep.ci || ''
    perfilForm.expedido = dep.expedido || 'CH'
    perfilForm.fecha_nacimiento = dep.fecha_nacimiento ? dep.fecha_nacimiento.split('T')[0] : ''
    perfilForm.telefono = dep.telefono || ''
    perfilForm.direccion = dep.direccion || ''
    perfilForm.asociacion_id = dep.asociacion_id ? Number(dep.asociacion_id) : ''
    perfilForm.club_id = dep.club_id ? Number(dep.club_id) : ''
    perfilForm.sigep_cuenta = dep.sigep_cuenta || ''
    perfilForm.tutor_nombre = dep.tutor_nombre || ''
    perfilForm.tutor_ci = dep.tutor_ci || ''
    perfilForm.tutor_telefono = dep.tutor_telefono || ''

    // Cargar catálogo de asociaciones
    try {
      const asocsRes = await asociacionService.list()
      asociacionesList.value = Array.isArray(asocsRes) ? asocsRes : []
    } catch (err) {
      console.error('Error cargando asociaciones:', err)
      asociacionesList.value = []
    }

    // Cargar clubes de la asociación actual
    if (perfilForm.asociacion_id) {
      await loadClubesPorAsociacion(perfilForm.asociacion_id)
    }
  } catch (e) {
    console.error('Error al cargar datos del deportista:', e)
    errorMessage.value = e.response?.data?.error || 'No se pudo cargar la información de tu perfil.'
  } finally {
    isLoading.value = false
  }
}

async function loadClubesPorAsociacion(asocId) {
  if (!asocId) {
    clubesList.value = []
    return
  }
  loadingClubes.value = true
  try {
    const clubsRes = await asociacionService.listClubes(asocId)
    clubesList.value = Array.isArray(clubsRes) ? clubsRes : []
  } catch (e) {
    console.error('Error al cargar clubes:', e)
    clubesList.value = []
  } finally {
    loadingClubes.value = false
  }
}

async function onAsociacionChange() {
  perfilForm.club_id = ''
  if (perfilForm.asociacion_id) {
    await loadClubesPorAsociacion(perfilForm.asociacion_id)
  } else {
    clubesList.value = []
  }
}

async function guardarPerfilDeportista() {
  perfilSaving.value = true
  perfilSuccessMsg.value = ''
  perfilErrorMsg.value = ''
  try {
    const res = await deportistaService.updateMiPerfil({ ...perfilForm })
    perfilSuccessMsg.value = '✓ Tu perfil y afiliación deportiva fueron actualizados con éxito.'
    if (res.data) {
      deportistaPerfil.value = res.data
    }
    setTimeout(() => {
      perfilSuccessMsg.value = ''
    }, 4500)
  } catch (e) {
    perfilErrorMsg.value = e.response?.data?.error || 'Error al actualizar el perfil. Verifique los campos obligatorios.'
  } finally {
    perfilSaving.value = false
  }
}

function formatMoney(amount) {
  if (!amount) return '0,00'
  return Number(amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function navTo(path) {
  router.push(path)
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  if (isDeportista.value) {
    fetchDeportistaData()
  } else {
    fetchMetrics()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="flex bg-paper min-h-screen">
    <!-- Sidebar de Navegación Lateral -->
    <AppSidebar :filter="searchQuery" />

    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header Superior Limpio -->
      <header class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-xs">
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">SEDEDE Chuquisaca</span>
          <svg class="h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
          <h1 class="text-sm font-bold text-slate-900">
            {{ isDeportista ? 'Portal del Atleta & Trámites' : (titles[route.name] ?? 'Panel') }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative w-64">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Buscar en el menú..."
              aria-label="Buscar en el menú"
              class="w-full rounded-lg border border-transparent bg-slate-100 py-1.5 pl-9 pr-12 text-xs transition-all placeholder-slate-400 focus:border-brand-700 focus:bg-white focus:ring-1 focus:ring-brand-700"
            />
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 font-mono text-[10px] text-slate-400">Ctrl+K</span>
          </div>

          <div v-if="isDeportista && deportistaPerfil" class="flex items-center gap-3">
            <div class="hidden text-right sm:block">
              <p class="text-xs font-bold text-slate-800">{{ deportistaPerfil.nombres }} {{ deportistaPerfil.apellidos }}</p>
              <p class="text-[11px] font-semibold text-brand-700">{{ deportistaPerfil.disciplina }} · {{ deportistaPerfil.asociacion?.sigla || 'Deportista' }}</p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-300 bg-brand-100 text-xs font-bold text-brand-800">
              {{ deportistaPerfil.nombres?.[0] }}{{ deportistaPerfil.apellidos?.[0] }}
            </span>
          </div>
        </div>
      </header>

      <!-- Área de Contenido Principal -->
      <main class="p-8 flex-1">
        <!-- VISTA RESUMEN PRINCIPAL -->
        <div v-if="route.name === 'dashboard'" class="space-y-6">

          <!-- ======================================================== -->
          <!-- 1. VISTA EXCLUSIVA PORTAL DEL DEPORTISTA                 -->
          <!-- ======================================================== -->
          <div v-if="isDeportista" class="space-y-6">
            <!-- Banner de Bienvenida Deportista -->
            <div
              class="rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-brand-950/20"
              style="background: linear-gradient(135deg, #400210 0%, #690b21 45%, #800020 100%);"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wide uppercase backdrop-blur-sm border border-white/25">
                    Etapa 1: Registro & Portal del Atleta
                  </span>
                  <span v-if="esMenorDeportista" class="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[11px] font-bold shadow-sm">
                    Atleta Menor de Edad
                  </span>
                </div>
                <h1 class="text-2xl font-display font-bold tracking-tight mt-2 text-white">
                  ¡Hola, {{ deportistaPerfil?.nombres || 'Deportista' }}!
                </h1>
                <p class="text-brand-100 text-xs mt-1 max-w-2xl leading-relaxed">
                  Bienvenido a tu panel integral del Servicio Departamental de Deportes. Desde aquí puedes tramitar apoyos económicos, premios al mérito deportivo e indumentaria según el procedimiento oficial de 17 etapas.
                </p>
              </div>

              <div class="flex flex-wrap gap-2.5 shrink-0">
                <button
                  @click="navTo('/dashboard/tramites')"
                  class="px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-brand-50 transition-all flex items-center gap-1.5"
                  style="background-color: #ffffff; color: #800020;"
                >
                  <span class="font-black text-sm">+</span>
                  <span>Nueva Solicitud de Apoyo</span>
                </button>
                <button
                  @click="navTo('/dashboard/calendario-anual')"
                  class="px-3.5 py-2 rounded-xl text-white text-xs font-semibold backdrop-blur-sm border border-white/30 hover:bg-white/20 transition-all shadow-sm"
                  style="background-color: rgba(255, 255, 255, 0.15);"
                >
                  📅 Eventos del Calendario
                </button>
              </div>
            </div>

            <!-- SECCIÓN DE ALERTAS ACTIVAS POR ETAPAS -->
            <div v-if="deportistaAlertas && deportistaAlertas.length > 0" class="space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>⚠️ Notificaciones y Alertas de Trámites</span>
                <span class="rounded-full bg-red-100 text-red-700 px-2 py-0.2 text-[10px] font-bold">{{ deportistaAlertas.length }}</span>
              </h2>

              <div class="grid gap-3">
                <div
                  v-for="(alerta, idx) in deportistaAlertas"
                  :key="idx"
                  class="rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  :class="{
                    'border-amber-400 bg-amber-50 text-amber-900': alerta.tipo === 'danger' || alerta.tipo === 'warning',
                    'border-emerald-300 bg-emerald-50 text-emerald-900': alerta.tipo === 'success',
                    'border-blue-300 bg-blue-50 text-blue-900': alerta.tipo !== 'danger' && alerta.tipo !== 'warning' && alerta.tipo !== 'success'
                  }"
                >
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="rounded px-2 py-0.5 text-[10px] font-mono font-bold"
                        :class="alerta.tipo === 'danger' ? 'bg-amber-200 text-amber-900' : 'bg-white/60 text-slate-800'"
                      >
                        {{ alerta.codigo_tramite }}
                      </span>
                      <span class="font-bold text-xs">{{ alerta.titulo }}</span>
                      <span class="text-[11px] font-semibold opacity-75">· Etapa {{ alerta.etapa }}</span>
                    </div>
                    <p class="text-xs font-medium">{{ alerta.mensaje }}</p>
                  </div>

                  <div class="shrink-0 flex items-center gap-2">
                    <button
                      @click="navTo('/dashboard/tramites')"
                      class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                      :class="alerta.tipo === 'danger' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'"
                    >
                      {{ alerta.accion_texto || 'Ver Trámite' }} →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- CUADRICULA: PERFIL CON SELECTORES (IZQUIERDA) + LOGROS Y TRÁMITES (DERECHA) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <!-- COLUMNA 1 & 2: FORMULARIO DE PERFIL Y AFILIACIÓN (SELECTORES ESTRICTOS) -->
              <div class="lg:col-span-2 space-y-6">
                <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                    <div>
                      <h2 class="text-base font-display font-bold text-slate-900">Perfil y Afiliación Deportiva</h2>
                      <p class="text-xs text-slate-500">Mantén tus datos y vinculación asociativa actualizados para validar tus solicitudes.</p>
                    </div>
                    <span class="rounded-lg bg-brand-50 border border-brand-200 text-brand-800 px-3 py-1 text-xs font-bold">
                      C.I. {{ perfilForm.ci }} {{ perfilForm.expedido }}
                    </span>
                  </div>

                  <form @submit.prevent="guardarPerfilDeportista" class="space-y-5">
                    <!-- Mensajes de feedback -->
                    <div v-if="perfilSuccessMsg" class="rounded-lg bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800 font-semibold">
                      {{ perfilSuccessMsg }}
                    </div>
                    <div v-if="perfilErrorMsg" class="rounded-lg bg-red-50 border border-red-300 p-3 text-xs text-red-800 font-semibold">
                      {{ perfilErrorMsg }}
                    </div>

                    <!-- Datos Personales -->
                    <div>
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Datos Personales</h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                          <input v-model="perfilForm.nombres" type="text" required class="input-field text-xs" />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
                          <input v-model="perfilForm.apellidos" type="text" required class="input-field text-xs" />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">Cédula de Identidad *</label>
                          <div class="flex gap-2">
                            <input v-model="perfilForm.ci" type="text" required class="input-field text-xs flex-1" />
                            <select v-model="perfilForm.expedido" class="input-field text-xs w-20">
                              <option value="CH">CH</option>
                              <option value="LP">LP</option>
                              <option value="CB">CB</option>
                              <option value="SC">SC</option>
                              <option value="OR">OR</option>
                              <option value="PT">PT</option>
                              <option value="TJ">TJ</option>
                              <option value="BN">BN</option>
                              <option value="PA">PA</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                          <input v-model="perfilForm.fecha_nacimiento" type="date" required class="input-field text-xs" />
                          <p v-if="deportistaEdad !== null" class="text-[11px] mt-1 text-slate-500">
                            Edad calculada: <strong>{{ deportistaEdad }} años</strong>
                            <span v-if="esMenorDeportista" class="text-amber-700 font-bold ml-1">(Menor de edad)</span>
                          </p>
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                          <input v-model="perfilForm.telefono" type="text" placeholder="Ej. 71234567" class="input-field text-xs" />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">Dirección / Domicilio</label>
                          <input v-model="perfilForm.direccion" type="text" placeholder="Calle / Zona" class="input-field text-xs" />
                        </div>
                      </div>
                    </div>

                    <!-- Afiliación Institucional: ESTRICTO SELECTORES (NO TEXTO LIBRE) -->
                    <div class="pt-3 border-t border-slate-100">
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">
                          2. Afiliación Institucional (Selectores Oficiales)
                        </h3>
                        <span class="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                          ✓ Validación Asociativa Activa
                        </span>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Selector Asociación -->
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">
                            Asociación Departamental *
                          </label>
                          <select
                            v-model.number="perfilForm.asociacion_id"
                            @change="onAsociacionChange"
                            required
                            class="input-field text-xs font-semibold text-slate-800 bg-white"
                          >
                            <option value="" disabled>Seleccione Asociación Deportiva...</option>
                            <option
                              v-for="asoc in asociacionesList"
                              :key="asoc.id"
                              :value="Number(asoc.id)"
                            >
                              {{ asoc.sigla ? `[${asoc.sigla}] ` : '' }}{{ asoc.nombre }}
                            </option>
                          </select>
                          <p class="text-[10px] text-slate-400 mt-1">El calendario y visto bueno dependen de tu asociación.</p>
                        </div>

                        <!-- Selector Club (Dependiente de Asociación) -->
                        <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">
                            Club Perteneciente *
                          </label>
                          <select
                            v-model.number="perfilForm.club_id"
                            required
                            :disabled="!perfilForm.asociacion_id || loadingClubes"
                            class="input-field text-xs font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 bg-white"
                          >
                            <option value="" disabled>
                              {{ loadingClubes ? 'Cargando clubes...' : (perfilForm.asociacion_id ? (clubesList.length ? 'Seleccione su Club...' : 'No hay clubes en esta asociación') : 'Primero elija una asociación') }}
                            </option>
                            <option
                              v-for="club in clubesList"
                              :key="club.id"
                              :value="Number(club.id)"
                            >
                              {{ club.sigla ? `[${club.sigla}] ` : '' }}{{ club.nombre }}
                            </option>
                          </select>
                          <p class="text-[10px] text-slate-400 mt-1">Listado dinámico oficial según la asociación seleccionada.</p>
                        </div>

                        <!-- Cuenta SIGEP -->
                        <div class="sm:col-span-2">
                          <label class="block text-xs font-semibold text-slate-700 mb-1">
                            Cuenta SIGEP / Número de Cuenta Registrada
                          </label>
                          <input
                            v-model="perfilForm.sigep_cuenta"
                            type="text"
                            placeholder="Ej. SIGEP-BO-100000458921"
                            class="input-field text-xs font-mono"
                          />
                          <p class="text-[10px] text-slate-400 mt-1">Cuenta oficial para acreditación directa en etapa de pago.</p>
                        </div>
                      </div>
                    </div>

                    <!-- Datos del Tutor (si es menor de edad) -->
                    <div v-if="esMenorDeportista" class="pt-3 border-t border-slate-100 bg-amber-50/60 -mx-6 px-6 py-4 rounded-xl border border-amber-200">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="text-amber-800 font-bold text-xs">⚠️ Datos del Padre, Madre o Tutor Legal</span>
                        <span class="text-[10px] text-amber-700">(Obligatorio por minoría de edad)</span>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nombre Completo del Tutor *</label>
                          <input v-model="perfilForm.tutor_nombre" type="text" :required="esMenorDeportista" class="input-field text-xs bg-white" placeholder="Ej. Roberto Flores V." />
                        </div>
                        <div>
                          <label class="block text-[11px] font-semibold text-slate-700 mb-1">C.I. del Tutor *</label>
                          <input v-model="perfilForm.tutor_ci" type="text" :required="esMenorDeportista" class="input-field text-xs bg-white" placeholder="Ej. 3489123 CH" />
                        </div>
                        <div>
                          <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono del Tutor *</label>
                          <input v-model="perfilForm.tutor_telefono" type="text" :required="esMenorDeportista" class="input-field text-xs bg-white" placeholder="Ej. 72891234" />
                        </div>
                      </div>
                    </div>

                    <!-- Botón de Guardar Perfil -->
                    <div class="pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        :disabled="perfilSaving"
                        class="btn-primary flex items-center gap-2 text-xs font-bold px-5 py-2.5 shadow-sm"
                      >
                        <span v-if="perfilSaving">Guardando datos...</span>
                        <span v-else>Guardar Cambios de Perfil</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- COLUMNA 3: ESPACIO DE LOGROS FECHADOS Y TRÁMITES -->
              <div class="space-y-6">

                <!-- TARJETA: LOGROS FECHADOS DEL DEPORTISTA -->
                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 class="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🏆 Logros Fechados</span>
                      </h3>
                      <p class="text-[11px] text-slate-400">Historial acreditado y méritos deportivos</p>
                    </div>
                    <span class="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                      {{ deportistaLogros.length }} Registrados
                    </span>
                  </div>

                  <div v-if="deportistaLogros.length === 0" class="text-center py-6 text-slate-400 text-xs italic">
                    Aún no cuentas con logros o trámites concluidos registrados en el sistema.
                  </div>

                  <div v-else class="space-y-3">
                    <div
                      v-for="(logro, i) in deportistaLogros"
                      :key="i"
                      class="rounded-xl border border-amber-200 bg-amber-50/50 p-3 relative pl-4 transition-all hover:border-amber-300"
                    >
                      <div class="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r"></div>
                      <div class="flex items-center justify-between text-[11px] font-semibold text-amber-800">
                        <span>{{ logro.tipo || 'Logro Deportivo' }}</span>
                        <span class="font-mono text-[10px] text-slate-500">{{ logro.fecha }}</span>
                      </div>
                      <p class="mt-1 text-xs font-bold text-slate-800">{{ logro.titulo }}</p>
                      <div v-if="logro.monto_aprobado" class="mt-1 text-[11px] font-bold text-emerald-700">
                        Incentivo SEDEDE: Bs {{ Number(logro.monto_aprobado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-100">
                    <p class="text-[10px] text-slate-400 leading-tight">
                      * Este historial se nutre automáticamente a partir de las solicitudes aprobadas y resoluciones de apoyo emitidas por el SEDEDE.
                    </p>
                  </div>
                </div>

                <!-- TARJETA: ESTADO RÁPIDO DE TRÁMITES -->
                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 class="font-display text-sm font-bold text-slate-900">Mis Solicitudes Activas</h3>
                    <button @click="navTo('/dashboard/tramites')" class="text-xs font-bold text-brand-600 hover:underline">
                      Ver todas →
                    </button>
                  </div>

                  <div v-if="deportistaTramites.length === 0" class="text-center py-6 text-slate-400 text-xs italic">
                    No tienes trámites en curso actualmente.
                  </div>

                  <div v-else class="space-y-2.5">
                    <div
                      v-for="tr in deportistaTramites.slice(0, 3)"
                      :key="tr.id"
                      class="rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-brand-50/40 hover:border-brand-300 transition-all cursor-pointer"
                      @click="navTo('/dashboard/tramites')"
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-mono text-[10px] font-bold text-brand-800 bg-brand-100 px-1.5 py-0.5 rounded">
                          {{ tr.codigo_tramite }}
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          :class="{
                            'bg-amber-100 text-amber-800': tr.estado.includes('Observada'),
                            'bg-blue-100 text-blue-800': tr.estado === 'Registrada',
                            'bg-purple-100 text-purple-800': tr.estado.includes('Técnica') || tr.estado.includes('Presupuestaria'),
                            'bg-emerald-100 text-emerald-800': tr.estado.includes('Aprobada') || tr.estado.includes('Pagada')
                          }"
                        >
                          Paso {{ tr.etapa_actual }}: {{ tr.estado }}
                        </span>
                      </div>
                      <p class="font-bold text-xs text-slate-800 mt-1 line-clamp-1">{{ tr.evento_nombre }}</p>
                      <div class="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span>{{ tr.tipo_solicitud }}</span>
                        <span class="font-bold font-mono text-slate-700">Bs {{ Number(tr.monto_solicitado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- 2. VISTA EJECUTIVA GENERAL (PARA DIRECTORES / REVISORES) -->
          <!-- ======================================================== -->
          <div v-else class="space-y-6">
            <!-- Banner Superior Institucional -->
            <section
              class="relative overflow-hidden rounded-2xl p-7 text-white shadow-lg shadow-brand-950/15"
              style="background-color: #800020; background-image: radial-gradient(circle at 10% 20%, rgba(219, 39, 119, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 35%);"
            >
              <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="max-w-2xl">
                  <div class="mb-3 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                    <span>Gobierno Autónomo Departamental de Chuquisaca</span>
                  </div>
                  <h2 class="text-2xl md:text-3xl font-display font-extrabold tracking-tight">Resumen Departamental de Gestión</h2>
                  <p class="mt-1.5 text-sm font-normal leading-relaxed text-brand-100">
                    Consolidado de recaudación por uso de escenarios deportivos, seguimiento a trámites de apoyo a asociaciones y monitoreo presupuestario POA.
                  </p>
                </div>
                <div class="flex shrink-0 flex-wrap items-center gap-2.5">
                  <button @click="navTo('/dashboard/tramites')" class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all shadow-sm hover:bg-white/25">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <span>Trámites</span>
                  </button>
                  <button @click="navTo('/dashboard/tarifario')" class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all shadow-sm hover:bg-white/25">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                    <span>Tarifario Oficial</span>
                  </button>
                  <button @click="navTo('/dashboard/calendario-anual')" class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-brand-900 transition-all shadow-md hover:bg-brand-50">
                    <svg class="h-4 w-4 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    <span>Calendario Anual</span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Filtro por Rango de Fechas para Recaudación -->
            <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-brand-800"></div>
                  <span class="text-xs font-bold uppercase tracking-wide text-slate-800">Filtro de Recaudación por Fechas:</span>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2 text-xs">
                    <label class="font-medium text-slate-500" for="fecha-desde">Desde:</label>
                    <input id="fecha-desde" type="date" v-model="fechaDesde" @change="presetActivo = null; fetchMetrics()" class="rounded-lg border-slate-300 py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-brand-700 focus:ring-brand-700" />
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <label class="font-medium text-slate-500" for="fecha-hasta">Hasta:</label>
                    <input id="fecha-hasta" type="date" v-model="fechaHasta" @change="presetActivo = null; fetchMetrics()" class="rounded-lg border-slate-300 py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-brand-700 focus:ring-brand-700" />
                  </div>
                  <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                    <button @click="setPresetFecha('hoy')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'hoy' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">Hoy</button>
                    <button @click="setPresetFecha('mes')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'mes' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">Este Mes</button>
                    <button @click="setPresetFecha('anio')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'anio' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">{{ anioActual }}</button>
                    <button @click="setPresetFecha('todo')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'todo' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">Todo</button>
                  </div>
                  <button @click="fetchMetrics" class="flex items-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-900">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
                    <span>Aplicar</span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Indicador de Carga / Error -->
            <div v-if="isLoading" class="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
              <span class="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-brand-600 border-r-transparent"></span>
              Cargando datos del resumen...
            </div>
            <div v-else-if="errorMessage" role="alert" class="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
              {{ errorMessage }}
            </div>

            <div v-else class="space-y-6">
              <!-- KPIs -->
              <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <!-- KPI 1: Total Recaudado -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Recaudado</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">Bs {{ formatMoney(metrics?.recaudacion?.total_recaudado) }}</h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
                      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span class="text-slate-400 font-medium">{{ metrics?.recaudacion?.total_transacciones || 0 }} pagos registrados</span>
                  </div>
                </div>

                <!-- KPI 2: Trámites de Apoyo -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trámites de Apoyo</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">{{ metrics?.tramites?.total_tramites || 0 }} <span class="text-sm font-semibold text-slate-400">Solicitudes</span></h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">{{ metrics?.tramites?.en_revision || 0 }} en curso</span>
                    <span v-if="tramitesConcluidos !== null" class="font-semibold text-emerald-600">{{ tramitesConcluidos }} concluidos</span>
                  </div>
                </div>

                <!-- KPI 3: Presupuesto Apoyos -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Presupuesto Apoyos</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">Bs {{ formatMoney(metrics?.tramites?.monto_aprobado_total) }}</h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50 text-amber-700">
                      <svg class="h-6 w-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 border-t border-slate-100 pt-3 text-xs">
                    <span class="text-slate-500 font-medium">Monto aprobado acumulado</span>
                  </div>
                </div>

                <!-- KPI 4: Eventos en Agenda -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Eventos en Agenda</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">{{ metrics?.escenarios?.total_reservas_activas || 0 }} <span class="text-sm font-semibold text-slate-400">Reservas</span></h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-700">
                      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span class="font-medium text-slate-600">Reservas y eventos oficiales</span>
                    <button @click="navTo('/dashboard/calendario-anual')" class="cursor-pointer font-bold text-brand-700 hover:underline">Ver agenda →</button>
                  </div>
                </div>
              </section>

              <!-- Accesos Rápidos -->
              <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div class="mb-4 flex items-center justify-between">
                  <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400">Accesos Rápidos y Operativos</h4>
                  <span class="text-xs text-slate-400">Atajos frecuentes para gestión diaria</span>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <a @click.prevent="navTo('/dashboard/tramites')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Nuevo Trámite</p>
                      <p class="text-xs text-slate-500">Solicitud de personería o apoyo</p>
                    </div>
                  </a>
                  <a @click.prevent="navTo('/dashboard/tarifario')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Cotizar Tarifario</p>
                      <p class="text-xs text-slate-500">Cálculo de alquiler y garantías</p>
                    </div>
                  </a>
                  <a @click.prevent="navTo('/dashboard/calendario-anual')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Calendario Deportivo</p>
                      <p class="text-xs text-slate-500">Fechas de torneos nacionales</p>
                    </div>
                  </a>
                  <a @click.prevent="navTo('/dashboard/asociaciones')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Asociaciones</p>
                      <p class="text-xs text-slate-500">Padrón de federaciones</p>
                    </div>
                  </a>
                </div>
              </section>
            </div>

            <!-- Footer Institucional -->
            <footer class="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pb-6 pt-2 text-center text-xs text-slate-400 md:flex-row">
              <p>© {{ anioActual }} Servicio Departamental de Deportes (SEDEDE) - Chuquisaca. Todos los derechos reservados.</p>
              <p class="font-medium text-slate-500">Plataforma Centralizada de Deporte Departamental</p>
            </footer>
          </div>

        </div>

        <!-- VISTA HIJA DE RUTAS DEL DASHBOARD -->
        <router-view v-else />
      </main>
    </div>
  </div>
</template>
