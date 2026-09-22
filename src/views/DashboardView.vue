<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppSidebar from '../components/dashboard/AppSidebar.vue'
import { dashboardService } from '../services/dashboardService'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

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
}

const isLoading = ref(true)
const errorMessage = ref('')
const metrics = ref(null)

const fechaDesde = ref('')
const fechaHasta = ref('')

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

function formatMoney(amount) {
  if (!amount) return '0,00'
  return Number(amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function navTo(path) {
  router.push(path)
}

onMounted(() => {
  fetchMetrics()
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
          <h1 class="font-display text-xl font-bold text-slate-900">{{ titles[route.name] ?? 'Panel' }}</h1>
        </div>
      </header>

      <!-- Área de Contenido Principal -->
      <main class="p-8 flex-1">
        <!-- VISTA RESUMEN PRINCIPAL -->
        <div v-if="route.name === 'dashboard'" class="space-y-6">
          <!-- Banner Superior Limpio y Directo -->
          <div class="rounded-2xl bg-gradient-to-r from-brand-800 via-brand-700 to-red-800 p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-display font-bold tracking-tight">Resumen</h1>
              <p class="text-red-100 text-xs mt-1">
                Recaudación, trámites, notificaciones y agenda de escenarios.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button @click="navTo('/dashboard/tramites')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all">
                Trámites
              </button>
              <button @click="navTo('/dashboard/tarifario')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all">
                Tarifario
              </button>
              <button @click="navTo('/dashboard/calendario-anual')" class="px-3 py-1.5 rounded-lg bg-white text-brand-900 text-xs font-bold shadow-sm hover:bg-red-50 transition-all">
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
                  <div>
                    <p class="text-xs font-bold text-slate-500 uppercase">Recaudado</p>
                    <h3 class="text-xl font-bold text-brand-700 font-mono mt-1">Bs. {{ formatMoney(metrics?.kpis_financieros?.total_recaudado) }}</h3>
                  </div>
                  <span class="text-lg">💳</span>
                </div>
                <div class="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                  <span>Pendiente: <strong class="text-amber-700 font-mono">Bs. {{ formatMoney(metrics?.kpis_financieros?.total_pendiente) }}</strong></span>
                  <span class="font-bold text-emerald-700">{{ metrics?.kpis_financieros?.recibos_procesados || 0 }} recibos</span>
                </div>
              </div>

              <!-- KPI 2: Trámites -->
              <div class="rounded-xl border border-brand-500 bg-white p-4 shadow-sm">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-xs font-bold text-slate-500 uppercase">Trámites</p>
                    <h3 class="text-xl font-bold text-slate-900 mt-1">{{ metrics?.kpis_gestion?.total_tramites || 0 }}</h3>
                  </div>
                  <span class="text-lg">📑</span>
                </div>
                <div class="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                  <span>En Revisión: <strong>{{ metrics?.kpis_gestion?.tramites_en_revision || 0 }}</strong></span>
                  <span>Observadas: <strong class="text-amber-700">{{ metrics?.kpis_gestion?.tramites_observados || 0 }}</strong></span>
                </div>
              </div>

              <!-- KPI 3: Reservas -->
              <div class="rounded-xl border border-brand-500 bg-white p-4 shadow-sm">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-xs font-bold text-slate-500 uppercase">Escenarios</p>
                    <h3 class="text-xl font-bold text-slate-900 mt-1">{{ metrics?.kpis_gestion?.total_reservas || 0 }}</h3>
                  </div>
                  <span class="text-lg">🏟️</span>
                </div>
                <div class="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Recintos Registrados</span>
                </div>
              </div>

              <!-- KPI 4: Asociaciones & Atletas -->
              <div class="rounded-xl border border-brand-500 bg-white p-4 shadow-sm">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-xs font-bold text-slate-500 uppercase">Asociaciones</p>
                    <h3 class="text-xl font-bold text-slate-900 mt-1">{{ metrics?.kpis_gestion?.total_asociaciones || 0 }}</h3>
                  </div>
                  <span class="text-lg">🏆</span>
                </div>
                <div class="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                  <span>Asociaciones</span>
                  <span class="font-bold text-brand-700">{{ metrics?.kpis_gestion?.total_deportistas || 0 }} Atletas</span>
                </div>
              </div>
            </div>

            <!-- Fila 2: Notificaciones & Agenda de Escenarios -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Columna 1: Notificaciones -->
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div class="flex items-center gap-2">
                      <span class="text-base">🔔</span>
                      <h3 class="font-display text-base font-bold text-slate-900">Notificaciones</h3>
                    </div>
                    <span class="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                      {{ metrics?.alertas?.length || 0 }} activas
                    </span>
                  </div>

                  <div class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    <div
                      v-for="alerta in metrics?.alertas"
                      :key="alerta.id"
                      class="rounded-xl p-3 border text-xs"
                      :class="{
                        'bg-red-50 border-red-200 text-red-900': alerta.nivel === 'urgente',
                        'bg-amber-50 border-amber-200 text-amber-900': alerta.nivel === 'advertencia',
                        'bg-blue-50 border-blue-200 text-blue-900': alerta.nivel === 'info'
                      }"
                    >
                      <div class="flex items-center justify-between font-bold">
                        <span class="truncate">{{ alerta.titulo }}</span>
                        <span class="text-[10px] font-mono opacity-70">{{ alerta.fecha ? new Date(alerta.fecha).toLocaleDateString('es-BO') : '' }}</span>
                      </div>
                      <p class="mt-0.5 font-medium">{{ alerta.mensaje }}</p>
                    </div>

                    <div v-if="!metrics?.alertas?.length" class="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                      No hay notificaciones pendientes.
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 text-right">
                  <button @click="navTo('/dashboard/tramites')" class="text-xs font-bold text-brand-600 hover:underline">
                    Ver todos los trámites →
                  </button>
                </div>
              </div>

              <!-- Columna 2: Agenda de Escenarios -->
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div class="flex items-center gap-2">
                      <span class="text-base">📅</span>
                      <h3 class="font-display text-base font-bold text-slate-900">Agenda de Escenarios</h3>
                    </div>
                    <button @click="navTo('/dashboard/calendario-anual')" class="text-xs font-semibold text-brand-600 hover:underline">
                      Ver Calendario Anual →
                    </button>
                  </div>

                  <div class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    <div
                      v-for="reserva in metrics?.agenda_escenarios"
                      :key="reserva.id"
                      class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span class="font-bold text-brand-700">{{ reserva.escenario_nombre }} ({{ reserva.espacio }})</span>
                        <p class="font-medium text-slate-900 mt-0.5">{{ reserva.concepto }}</p>
                        <p class="text-[11px] text-slate-500">{{ reserva.solicitante_nombre }} ({{ reserva.disciplina }})</p>
                      </div>

                      <div class="text-right shrink-0">
                        <span class="block font-mono font-bold text-slate-800">{{ new Date(reserva.fecha_uso).toLocaleDateString('es-BO') }}</span>
                        <span class="text-[11px] text-slate-600">{{ reserva.hora_inicio }} - {{ reserva.hora_fin }}</span>
                        <span class="block mt-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-emerald-100 text-emerald-800">
                          {{ reserva.estado }}
                        </span>
                      </div>
                    </div>

                    <div v-if="!metrics?.agenda_escenarios?.length" class="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                      No hay actividades programadas en los próximos días.
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 text-right">
                  <button @click="navTo('/dashboard/escenarios')" class="text-xs font-bold text-brand-600 hover:underline">
                    Ver Escenarios →
                  </button>
                </div>
              </div>
            </div>

            <!-- Fila 3: Accesos Rápidos -->
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

        <!-- VISTA HIJA DE RUTAS DEL DASHBOARD -->
        <router-view v-else />
      </main>
    </div>
  </div>
</template>
