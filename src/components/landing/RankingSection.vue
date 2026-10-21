<script setup>
import { ref, computed, onMounted } from 'vue'
import { deportistaService } from '../../services/deportistaService'

const loading = ref(true)
const error = ref(null)
const disciplinas = ref([])
const topGalardonados = ref([])
const resumenDeptal = ref({ oro: 0, plata: 0, bronce: 0, total_galardones: 0 })
const seleccionada = ref('cuadro_honor')
const criterio = ref('galardones')

const MEDALLA_ESTILO = {
  1: { ring: 'ring-amber-400 bg-amber-50 text-amber-700', badge: 'bg-amber-400 text-amber-950', icon: '🥇' },
  2: { ring: 'ring-slate-300 bg-slate-50 text-slate-700', badge: 'bg-slate-300 text-slate-800', icon: '🥈' },
  3: { ring: 'ring-amber-700/50 bg-amber-100/50 text-amber-900', badge: 'bg-amber-700 text-amber-100', icon: '🥉' },
}

const esCuadroHonor = computed(() => seleccionada.value === 'cuadro_honor')

const actual = computed(() => {
  if (esCuadroHonor.value) {
    return {
      disciplina: 'Cuadro de Honor Departamental',
      total: topGalardonados.value.length,
      resumen_medallas: resumenDeptal.value,
      deportistas: topGalardonados.value,
    }
  }
  return disciplinas.value.find((d) => d.disciplina === seleccionada.value) ?? null
})

const deportistasAMostrar = computed(() => actual.value?.deportistas ?? [])
const podio = computed(() => deportistasAMostrar.value.slice(0, 3))
const resto = computed(() => deportistasAMostrar.value.slice(3))

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

const entidad = (d) => [d.asociacion?.sigla || d.asociacion?.nombre, d.club?.sigla || d.club?.nombre].filter(Boolean).join(' · ')

async function cargarDatos() {
  loading.value = true
  error.value = null
  try {
    const datos = await deportistaService.getRankingPublico({ criterio: criterio.value })
    disciplinas.value = datos?.disciplinas ?? []
    topGalardonados.value = datos?.top_galardonados ?? []
    resumenDeptal.value = datos?.resumen_departamental ?? { oro: 0, plata: 0, bronce: 0, total_galardones: 0 }
    
    // Si no está seleccionado nada o si está en cuadro_honor, mantenerlo
    if (!seleccionada.value || (seleccionada.value !== 'cuadro_honor' && !disciplinas.value.some(d => d.disciplina === seleccionada.value))) {
      seleccionada.value = 'cuadro_honor'
    }
  } catch (err) {
    console.error('Error al cargar el ranking de deportistas:', err)
    error.value = 'No se pudo cargar el ranking departamental de deportistas en este momento.'
  } finally {
    loading.value = false
  }
}

function cambiarCriterio(nuevo) {
  criterio.value = nuevo
  cargarDatos()
}

onMounted(() => {
  cargarDatos()
})
</script>

<template>
  <section id="ranking" class="relative bg-gradient-to-b from-white via-slate-50/50 to-white py-20 border-b border-slate-100">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Encabezado Principal -->
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-slate-200">
        <div class="max-w-3xl">
          <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3.5 py-1 text-xs font-bold text-brand-800">
            <span>🏛️ GOBIERNO AUTÓNOMO DEPARTAMENTAL DE CHUQUISACA</span>
            <span class="text-brand-300">•</span>
            <span>SEDEDE</span>
          </div>
          <h2 class="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Ranking de Deportistas Más Galardonados
          </h2>
          <p class="mt-2.5 text-sm sm:text-base text-slate-600">
            Conteo oficial de medallas, títulos y méritos deportivos cargados por los deportistas y validados formalmente por cada Asociación Departamental y resoluciones del SEDEDE.
          </p>
        </div>

        <!-- Selector de Criterio de Ordenación -->
        <div class="flex items-center gap-2 self-start md:self-end bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="criterio === 'galardones' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            @click="cambiarCriterio('galardones')"
          >
            🏆 Por Más Galardones
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="criterio === 'ranking_nacional' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            @click="cambiarCriterio('ranking_nacional')"
          >
            🏅 Por Ranking Nacional
          </button>
        </div>
      </div>

      <!-- Resumen Oficial del Medallero Departamental -->
      <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div class="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-900 uppercase tracking-wide">Medallas de Oro</span>
            <span class="text-2xl">🥇</span>
          </div>
          <p class="mt-2 font-display text-3xl font-black text-amber-700">
            {{ resumenDeptal.oro }}
          </p>
          <p class="text-[11px] font-medium text-amber-800/80 mt-0.5">Campeones nacionales e internac.</p>
        </div>

        <div class="rounded-2xl border border-slate-300/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Medallas de Plata</span>
            <span class="text-2xl">🥈</span>
          </div>
          <p class="mt-2 font-display text-3xl font-black text-slate-700">
            {{ resumenDeptal.plata }}
          </p>
          <p class="text-[11px] font-medium text-slate-600 mt-0.5">Subcampeones acreditados</p>
        </div>

        <div class="rounded-2xl border border-amber-900/20 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-900 uppercase tracking-wide">Medallas de Bronce</span>
            <span class="text-2xl">🥉</span>
          </div>
          <p class="mt-2 font-display text-3xl font-black text-amber-800">
            {{ resumenDeptal.bronce }}
          </p>
          <p class="text-[11px] font-medium text-amber-900/80 mt-0.5">Podios y terceros lugares</p>
        </div>

        <div class="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-brand-900 uppercase tracking-wide">Total Galardones</span>
            <span class="text-2xl">🏆</span>
          </div>
          <p class="mt-2 font-display text-3xl font-black text-brand-700">
            {{ resumenDeptal.total_galardones }}
          </p>
          <p class="text-[11px] font-medium text-brand-800 mt-0.5">Acreditados por Asociaciones</p>
        </div>
      </div>

      <!-- Estado de Carga -->
      <div v-if="loading" class="py-20 text-center" aria-live="polite">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-r-transparent"></div>
        <p class="mt-3 text-sm font-semibold text-slate-600">Verificando padrón y medallero de deportistas…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" role="alert" class="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {{ error }}
      </div>

      <!-- Pestañas de Disciplinas / Cuadro de Honor -->
      <template v-else>
        <div class="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Disciplinas">
          <div class="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            <!-- Pestaña Cuadro de Honor -->
            <button
              type="button"
              role="tab"
              :aria-selected="esCuadroHonor"
              class="flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all shadow-sm"
              :class="esCuadroHonor
                ? 'border-brand-700 bg-brand-700 text-white shadow-brand-700/20'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-800'"
              @click="seleccionada = 'cuadro_honor'"
            >
              <span>🌟 Cuadro de Honor General</span>
              <span class="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-black">
                Top {{ topGalardonados.length }}
              </span>
            </button>

            <!-- Pestañas por Disciplina -->
            <button
              v-for="d in disciplinas"
              :key="d.disciplina"
              type="button"
              role="tab"
              :aria-selected="d.disciplina === seleccionada"
              class="flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all"
              :class="d.disciplina === seleccionada
                ? 'border-brand-700 bg-brand-700 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-800'"
              @click="seleccionada = d.disciplina"
            >
              <span>{{ d.disciplina }}</span>
              <span
                class="rounded-full px-1.5 py-0.5 text-[10px]"
                :class="d.disciplina === seleccionada ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'"
              >
                {{ d.resumen_medallas.total_galardones > 0 ? `🏆 ${d.resumen_medallas.total_galardones}` : d.total }}
              </span>
            </button>
          </div>
        </div>

        <!-- Contenido del Ranking / Podio -->
        <div v-if="actual" role="tabpanel" class="mt-8">
          <!-- Cabecera de la Disciplina Seleccionada -->
          <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{{ actual.disciplina }}</span>
                <span v-if="esCuadroHonor" class="rounded bg-brand-100 text-brand-800 text-[10px] font-extrabold px-2 py-0.5">
                  Interdisciplinario
                </span>
              </h3>
              <p class="text-xs text-slate-500">
                Mostrando a los deportistas con mayor cantidad de galardones validados.
              </p>
            </div>

            <!-- Resumen de medallas de esta disciplina -->
            <div class="flex items-center gap-3 text-xs font-bold">
              <span class="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                🥇 {{ actual.resumen_medallas?.oro || 0 }} Oros
              </span>
              <span class="flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                🥈 {{ actual.resumen_medallas?.plata || 0 }} Platas
              </span>
              <span class="flex items-center gap-1 text-amber-900 bg-orange-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                🥉 {{ actual.resumen_medallas?.bronce || 0 }} Bronces
              </span>
            </div>
          </div>

          <!-- Podio (Top 3) -->
          <div v-if="podio.length" class="grid gap-5 md:grid-cols-3">
            <article
              v-for="(d, idx) in podio"
              :key="d.id"
              class="flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden"
              :class="idx === 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'"
            >
              <!-- Cinta superior para el #1 -->
              <div v-if="idx === 0" class="absolute top-0 right-0 bg-amber-400 text-amber-950 font-black text-[9px] uppercase px-3 py-0.5 rounded-bl-lg tracking-wider">
                Líder en Galardones
              </div>

              <!-- Cabecera del Atleta -->
              <div class="flex items-start gap-3.5">
                <div class="relative shrink-0">
                  <div
                    class="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-black border-2"
                    :class="MEDALLA_ESTILO[idx + 1]?.ring || 'ring-slate-200 bg-slate-50 text-slate-700'"
                  >
                    {{ iniciales(d.nombre) }}
                  </div>
                  <span
                    class="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-sm"
                    :class="MEDALLA_ESTILO[idx + 1]?.badge || 'bg-slate-200 text-slate-700'"
                  >
                    {{ idx + 1 }}
                  </span>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <h4 class="font-display text-base font-bold text-slate-900 truncate">
                      {{ d.nombre }}
                    </h4>
                  </div>
                  <p class="text-xs text-brand-700 font-semibold">{{ d.disciplina }} · {{ d.categoria }}</p>
                  <p v-if="entidad(d)" class="text-[11px] text-slate-500 truncate mt-0.5">
                    {{ entidad(d) }}
                  </p>
                </div>
              </div>

              <!-- Tally de Galardones Oficiales -->
              <div class="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-2.5 grid grid-cols-4 gap-1 text-center">
                <div class="border-r border-slate-200/60">
                  <span class="block text-[10px] text-slate-400 font-semibold">Oro</span>
                  <span class="text-xs font-black text-amber-700">🥇 {{ d.galardones.oro }}</span>
                </div>
                <div class="border-r border-slate-200/60">
                  <span class="block text-[10px] text-slate-400 font-semibold">Plata</span>
                  <span class="text-xs font-black text-slate-700">🥈 {{ d.galardones.plata }}</span>
                </div>
                <div class="border-r border-slate-200/60">
                  <span class="block text-[10px] text-slate-400 font-semibold">Bronce</span>
                  <span class="text-xs font-black text-amber-900">🥉 {{ d.galardones.bronce }}</span>
                </div>
                <div>
                  <span class="block text-[10px] text-brand-600 font-semibold">Total</span>
                  <span class="text-xs font-black text-brand-800">🏆 {{ d.galardones.total }}</span>
                </div>
              </div>

              <!-- Lista de Logros Destacados Validados -->
              <div class="mt-4 space-y-2 flex-1">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Logros Validados por Asociación
                </p>
                
                <div v-if="d.logros_destacados?.length" class="space-y-1.5">
                  <div
                    v-for="(logro, lIdx) in d.logros_destacados"
                    :key="lIdx"
                    class="rounded-lg bg-emerald-50/60 border border-emerald-100 px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="font-bold text-emerald-800 flex items-center gap-1">
                        <span>✓</span>
                        <span>{{ logro.origen }}</span>
                      </span>
                      <span v-if="logro.gestion" class="font-mono text-slate-400">{{ logro.gestion }}</span>
                    </div>
                    <p class="font-semibold text-slate-900 mt-0.5 text-xs leading-snug">{{ logro.titulo }}</p>
                  </div>
                </div>

                <p v-else-if="d.logros" class="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg">
                  "{{ d.logros }}"
                </p>
              </div>

              <!-- Pie de Tarjeta con Acreditación -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="font-bold text-slate-500">
                  Ranking Nacional: <strong class="text-slate-800">N° {{ d.posicion_nacional }}</strong>
                </span>
                <span class="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  Acreditado SEDEDE
                </span>
              </div>
            </article>
          </div>

          <!-- Resto de los Atletas en Lista Oficial -->
          <div v-if="resto.length" class="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-600">
                Otros Deportistas Acreditados en {{ actual.disciplina }}
              </span>
              <span class="text-xs text-slate-400">{{ resto.length }} deportistas</span>
            </div>

            <ol class="divide-y divide-slate-100">
              <li
                v-for="(d, rIdx) in resto"
                :key="d.id"
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors"
              >
                <div class="flex items-center gap-3.5">
                  <span class="w-8 shrink-0 font-display text-lg font-black tabular-nums text-slate-400">
                    {{ rIdx + 4 }}.º
                  </span>

                  <div class="min-w-0">
                    <p class="font-bold text-slate-900">{{ d.nombre }}</p>
                    <p class="text-xs text-slate-500">
                      {{ d.disciplina }} · {{ d.categoria }}
                      <template v-if="entidad(d)"> · {{ entidad(d) }}</template>
                    </p>
                    <p v-if="d.logros" class="mt-0.5 text-xs text-slate-600 line-clamp-1 italic">
                      {{ d.logros }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div class="flex items-center gap-2 text-xs font-bold bg-slate-100 px-3 py-1 rounded-xl">
                    <span v-if="d.galardones.oro" class="text-amber-700">🥇 {{ d.galardones.oro }}</span>
                    <span v-if="d.galardones.plata" class="text-slate-700">🥈 {{ d.galardones.plata }}</span>
                    <span v-if="d.galardones.bronce" class="text-amber-900">🥉 {{ d.galardones.bronce }}</span>
                    <span class="text-brand-800">🏆 {{ d.galardones.total }} galardones</span>
                  </div>

                  <span class="text-xs text-slate-400 font-semibold">
                    Pos. Nac: #{{ d.posicion_nacional }}
                  </span>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <!-- Nota Legal de Privacidad de Menores -->
        <div class="mt-8 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-4">
          <span class="text-brand-600 text-sm">🛡️</span>
          <span>
            En estricto cumplimiento de la Ley N° 548 (Código Niña, Niño y Adolescente), los nombres de atletas menores de 18 años se muestran abreviados y se protegen sus datos personales y domiciliarios.
          </span>
        </div>
      </template>
    </div>
  </section>
</template>
