<script setup>
import { ref, onMounted } from 'vue'
import { deportistaService } from '../../services/deportistaService'

const loading = ref(true)
const error = ref(null)
const disciplinas = ref([])
const totales = ref({
  atletas_registrados: 0,
  medallistas_activos: 0,
  medallas_oro: 0,
  medallas_plata: 0,
  medallas_bronce: 0,
  total_galardones: 0,
  disciplina_lider: '',
})

async function cargarEstadisticas() {
  loading.value = true
  error.value = null
  try {
    const data = await deportistaService.getEstadisticasMedallas()
    disciplinas.value = data?.disciplinas ?? []
    totales.value = data?.totales ?? totales.value
  } catch (err) {
    console.error('Error cargando estadísticas de medallistas:', err)
    error.value = 'No se pudieron cargar las métricas de medallistas en este momento.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarEstadisticas()
})
</script>

<template>
  <section id="estadisticas" class="bg-slate-900 text-white py-20 relative overflow-hidden">
    <!-- Fondos decorativos -->
    <div class="absolute -top-24 -right-24 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la Sección -->
      <div class="max-w-3xl">
        <span class="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300">
          <span>📊 RENDIMIENTO DEPORTIVO DEPARTAMENTAL</span>
        </span>
        <h2 class="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
          Deportes con Más Medallistas de Chuquisaca
        </h2>
        <p class="mt-2 text-sm sm:text-base text-slate-300">
          Monitoreo estadístico oficial del impacto y efectividad competitiva por disciplina deportiva, sustentado en las acreditaciones técnicas de las asociaciones departamentales.
        </p>
      </div>

      <!-- Métricas Clave Superiores -->
      <div class="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-2xl border border-slate-800 bg-slate-800/60 p-5 backdrop-blur-sm">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Disciplina Líder</p>
          <p class="mt-2 font-display text-2xl font-black text-amber-400 truncate">
            {{ totales.disciplina_lider || 'En proceso' }}
          </p>
          <p class="mt-1 text-[11px] text-slate-400">Mayor producción de galardones</p>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-800/60 p-5 backdrop-blur-sm">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Medallistas Activos</p>
          <p class="mt-2 font-display text-2xl font-black text-white">
            {{ totales.medallistas_activos }}
          </p>
          <p class="mt-1 text-[11px] text-slate-400">Atletas con podio acreditado</p>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-800/60 p-5 backdrop-blur-sm">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Oros Departamentales</p>
          <p class="mt-2 font-display text-2xl font-black text-amber-300">
            🥇 {{ totales.medallas_oro }}
          </p>
          <p class="mt-1 text-[11px] text-slate-400">Campeonatos de máxima categoría</p>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-800/60 p-5 backdrop-blur-sm">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Galardones</p>
          <p class="mt-2 font-display text-2xl font-black text-emerald-400">
            🏆 {{ totales.total_galardones }}
          </p>
          <p class="mt-1 text-[11px] text-slate-400">Títulos y méritos acumulados</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-16 text-center text-slate-400">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-r-transparent"></div>
        <p class="mt-3 text-xs">Cargando métricas oficiales por disciplina…</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="mt-8 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200">
        {{ error }}
      </div>

      <!-- Ranking de Disciplinas y Barras de Efectividad -->
      <div v-else class="mt-10 space-y-4">
        <div
          v-for="(disc, idx) in disciplinas"
          :key="disc.disciplina"
          class="rounded-2xl border border-slate-800 bg-slate-800/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/80"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black"
                :class="idx === 0 
                  ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-400/50' 
                  : idx === 1 
                    ? 'bg-slate-300 text-slate-900' 
                    : idx === 2 
                      ? 'bg-amber-700 text-white' 
                      : 'bg-slate-700 text-slate-300'"
              >
                #{{ idx + 1 }}
              </span>

              <div>
                <h3 class="font-display text-lg font-bold text-white flex items-center gap-2">
                  <span>{{ disc.disciplina }}</span>
                  <span
                    v-if="disc.porcentaje_medallistas >= 75"
                    class="rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30"
                  >
                    Alta Efectividad
                  </span>
                </h3>
                <p class="text-xs text-slate-400">
                  {{ disc.total_medallistas }} medallistas de {{ disc.total_atletas }} atletas registrados
                  <span class="text-slate-500">({{ disc.porcentaje_medallistas }}% de efectividad)</span>
                </p>
              </div>
            </div>

            <!-- Medallas acumuladas de esta disciplina -->
            <div class="flex items-center gap-2 text-xs font-bold self-start sm:self-auto">
              <span class="rounded-lg bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 text-amber-300">
                🥇 {{ disc.medallas.oro }}
              </span>
              <span class="rounded-lg bg-slate-300/10 border border-slate-300/20 px-2.5 py-1 text-slate-300">
                🥈 {{ disc.medallas.plata }}
              </span>
              <span class="rounded-lg bg-amber-700/20 border border-amber-700/30 px-2.5 py-1 text-amber-400">
                🥉 {{ disc.medallas.bronce }}
              </span>
              <span class="rounded-lg bg-brand-500/20 border border-brand-500/30 px-3 py-1 text-brand-300 font-extrabold">
                🏆 {{ disc.medallas.total }} Galardones
              </span>
            </div>
          </div>

          <!-- Barra de Producción de Medallas -->
          <div class="mt-4">
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                class="h-full rounded-full bg-gradient-to-r from-brand-600 via-amber-500 to-amber-300 transition-all duration-500"
                :style="{ width: `${Math.min(100, Math.max(10, (disc.medallas.total / (totales.total_galardones || 1)) * 100))}%` }"
              ></div>
            </div>
          </div>

          <!-- Atletas Destacados de la Disciplina -->
          <div v-if="disc.destacados?.length" class="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Medallistas Clave:
            </span>
            <div
              v-for="atleta in disc.destacados"
              :key="atleta.id"
              class="inline-flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2 py-0.5 text-xs text-slate-200 border border-slate-700"
            >
              <span class="text-[11px]">🏅</span>
              <span class="font-medium text-[11px]">{{ atleta.nombre }}</span>
              <span class="text-[10px] text-amber-400 font-bold">({{ atleta.galardones.total }} galard.)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
