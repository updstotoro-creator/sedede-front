<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
  'dashboard-asociacion-detalle': 'Clubes',
  'dashboard-club-detalle': 'Deportistas del Club',
  'dashboard-deportistas': 'Deportistas',
  'dashboard-tramites': 'Trámites',
  'dashboard-escenarios': 'Escenarios',
  'dashboard-tarifario': 'Tarifario',
  'dashboard-calendario-anual': 'Calendario Anual',
  'dashboard-comunidades': 'Mancomunidades y Comunidades',
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

function setPresetFecha(preset) {
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
  if (isDeportista.value) {
    fetchDeportistaData()
  } else {
    fetchMetrics()
  }
})
</script>

<template>
  <div class="flex bg-paper min-h-screen">
    <!-- Sidebar de Navegación Lateral -->
    <AppSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header Superior Limpio -->
      <header class="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">SEDEDE CHUQUISACA</p>
          <h1 class="font-display text-xl font-bold text-slate-900">
            {{ isDeportista ? 'Portal del Atleta & Trámites' : (titles[route.name] ?? 'Panel') }}
          </h1>
        </div>

        <div v-if="isDeportista && deportistaPerfil" class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold text-slate-800">{{ deportistaPerfil.nombres }} {{ deportistaPerfil.apellidos }}</p>
            <p class="text-[11px] text-brand-700 font-semibold">{{ deportistaPerfil.disciplina }} · {{ deportistaPerfil.asociacion?.sigla || 'Deportista' }}</p>
          </div>
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-800 font-bold text-xs border border-brand-300">
            {{ deportistaPerfil.nombres?.[0] }}{{ deportistaPerfil.apellidos?.[0] }}
          </span>
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
              class="rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-red-950/20"
              style="background: linear-gradient(135deg, #5A0B17 0%, #7A0F1F 45%, #9F1327 100%);"
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
                <p class="text-red-100 text-xs mt-1 max-w-2xl leading-relaxed">
                  Bienvenido a tu panel integral del Servicio Departamental de Deportes. Desde aquí puedes tramitar apoyos económicos, premios al mérito deportivo e indumentaria según el procedimiento oficial de 17 etapas.
                </p>
              </div>

              <div class="flex flex-wrap gap-2.5 shrink-0">
                <button
                  @click="navTo('/dashboard/tramites')"
                  class="px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-50 transition-all flex items-center gap-1.5"
                  style="background-color: #ffffff; color: #7A0F1F;"
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
            <!-- Banner Superior Limpio y Directo -->
            <div
              class="rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              style="background: linear-gradient(135deg, #5A0B17 0%, #7A0F1F 45%, #9F1327 100%);"
            >
              <div>
                <h1 class="text-2xl font-display font-bold tracking-tight text-white">Resumen</h1>
                <p class="text-red-100 text-xs mt-1">
                  Recaudación, trámites, notificaciones y agenda de escenarios.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button @click="navTo('/dashboard/tramites')" class="px-3 py-1.5 rounded-lg text-white text-xs font-semibold backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all" style="background-color: rgba(255, 255, 255, 0.15);">
                  Trámites
                </button>
                <button @click="navTo('/dashboard/tarifario')" class="px-3 py-1.5 rounded-lg text-white text-xs font-semibold backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all" style="background-color: rgba(255, 255, 255, 0.15);">
                  Tarifario
                </button>
                <button @click="navTo('/dashboard/calendario-anual')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 transition-all" style="background-color: #ffffff; color: #7A0F1F;">
                  Calendario Anual
                </button>
              </div>
            </div>

            <!-- Filtro por Rango de Fechas para Recaudación -->
            <div class="rounded-xl border border-brand-500 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 font-bold text-slate-800">
                <span>Recaudación por Fechas:</span>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <div class="flex items-center gap-1">
                  <span class="text-slate-500">Desde:</span>
                  <input type="date" v-model="fechaDesde" @change="fetchMetrics" class="rounded-lg border-slate-300 text-xs py-1 px-2 font-semibold text-slate-800" />
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-slate-500">Hasta:</span>
                  <input type="date" v-model="fechaHasta" @change="fetchMetrics" class="rounded-lg border-slate-300 text-xs py-1 px-2 font-semibold text-slate-800" />
                </div>
                <div class="flex items-center gap-1 pl-2">
                  <button @click="setPresetFecha('hoy')" class="px-2 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded font-semibold text-[11px]">Hoy</button>
                  <button @click="setPresetFecha('mes')" class="px-2 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded font-semibold text-[11px]">Este Mes</button>
                  <button @click="setPresetFecha('anio')" class="px-2 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded font-semibold text-[11px]">2026</button>
                  <button @click="setPresetFecha('todo')" class="px-2 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded font-semibold text-[11px]">Todo</button>
                </div>
              </div>
            </div>

            <!-- Indicador de Carga -->
            <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando datos...</div>
            <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ errorMessage }}
            </div>

            <div v-else class="space-y-6">
              <!-- Fila 1: Tarjetas KPI Limpias -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- KPI 1: Recaudación -->
                <div class="rounded-xl border border-brand-500 bg-white p-4 shadow-sm">
                  <div class="flex justify-between items-start">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Recaudado</span>
                    <span class="text-base">💳</span>
                  </div>
                  <div class="mt-2 text-2xl font-bold font-mono text-brand-700">
                    Bs {{ formatMoney(metrics?.recaudacion?.total_recaudado) }}
                  </div>
                  <div class="mt-1 text-[11px] text-slate-500">
                    {{ metrics?.recaudacion?.total_transacciones || 0 }} pagos registrados
                  </div>
                </div>

                <!-- KPI 2: Trámites -->
                <div class="rounded-xl border border-brand-500 bg-white p-4 shadow-sm">
                  <div class="flex justify-between items-start">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trámites de Apoyo</span>
                    <span class="text-base">📑</span>
                  </div>
                  <div class="mt-2 text-2xl font-bold font-mono text-slate-900">
                    {{ metrics?.tramites?.total_tramites || 0 }}
                  </div>
                  <div class="mt-1 text-[11px] text-amber-600 font-semibold">
                    {{ metrics?.tramites?.en_revision || 0 }} en curso
                  </div>
                </div>

                <!-- KPI 3: Monto Apoyado -->
                <div class="rounded-xl border border-brand-500 bg-white p-4 shadow-sm">
                  <div class="flex justify-between items-start">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Presupuesto Apoyos</span>
                    <span class="text-base">🏆</span>
                  </div>
                  <div class="mt-2 text-2xl font-bold font-mono text-slate-900">
                    Bs {{ formatMoney(metrics?.tramites?.monto_aprobado_total) }}
                  </div>
                  <div class="mt-1 text-[11px] text-slate-500">
                    Monto aprobado acumulado
                  </div>
                </div>

                <!-- KPI 4: Escenarios Ocupados -->
                <div class="rounded-xl border border-brand-500 bg-white p-4 shadow-sm">
                  <div class="flex justify-between items-start">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Eventos en Agenda</span>
                    <span class="text-base">🏟️</span>
                  </div>
                  <div class="mt-2 text-2xl font-bold font-mono text-slate-900">
                    {{ metrics?.escenarios?.total_reservas_activas || 0 }}
                  </div>
                  <div class="mt-1 text-[11px] text-slate-500">
                    Reservas y eventos oficiales
                  </div>
                </div>
              </div>

              <!-- Fila 2: Accesos Rápidos -->
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 class="mb-3 font-display text-xs font-bold uppercase tracking-wider text-slate-400">Accesos Rápidos</h3>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button @click="navTo('/dashboard/tramites')" class="rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 p-3 text-left transition-all group">
                    <span class="block text-base">📑</span>
                    <span class="font-bold text-xs text-slate-800 group-hover:text-brand-700">Nuevo Trámite</span>
                  </button>

                  <button @click="navTo('/dashboard/tarifario')" class="rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 p-3 text-left transition-all group">
                    <span class="block text-base">💳</span>
                    <span class="font-bold text-xs text-slate-800 group-hover:text-brand-700">Cotizar Tarifario</span>
                  </button>

                  <button @click="navTo('/dashboard/calendario-anual')" class="rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 p-3 text-left transition-all group">
                    <span class="block text-base">📅</span>
                    <span class="font-bold text-xs text-slate-800 group-hover:text-brand-700">Calendario Deportivo</span>
                  </button>

                  <button @click="navTo('/dashboard/asociaciones')" class="rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 p-3 text-left transition-all group">
                    <span class="block text-base">🏆</span>
                    <span class="font-bold text-xs text-slate-800 group-hover:text-brand-700">Asociaciones</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- VISTA HIJA DE RUTAS DEL DASHBOARD -->
        <router-view v-else />
      </main>
    </div>
  </div>
</template>
