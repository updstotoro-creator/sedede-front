<script setup>
import { ref, computed, onMounted } from 'vue'
import { deportistaService } from '../../services/deportistaService'

const loading = ref(true)
const error = ref(null)
const disciplinas = ref([])
const seleccionada = ref(null)

const MEDALLA = {
  1: { label: '1.º', ring: 'ring-amber-400', badge: 'bg-amber-400 text-amber-950' },
  2: { label: '2.º', ring: 'ring-slate-300', badge: 'bg-slate-300 text-slate-800' },
  3: { label: '3.º', ring: 'ring-orange-300', badge: 'bg-orange-300 text-orange-950' },
}

const actual = computed(() => disciplinas.value.find((d) => d.disciplina === seleccionada.value) ?? null)
const podio = computed(() => (actual.value?.deportistas ?? []).filter((d) => d.posicion_nacional >= 1 && d.posicion_nacional <= 3))
const resto = computed(() => (actual.value?.deportistas ?? []).filter((d) => !(d.posicion_nacional >= 1 && d.posicion_nacional <= 3)))

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

const entidad = (d) => [d.asociacion?.sigla || d.asociacion?.nombre, d.club?.sigla || d.club?.nombre].filter(Boolean).join(' · ')

onMounted(async () => {
  try {
    const datos = await deportistaService.getRankingPublico()
    disciplinas.value = datos?.disciplinas ?? []
    seleccionada.value = disciplinas.value[0]?.disciplina ?? null
  } catch (err) {
    console.error('Error al cargar el ranking público:', err)
    error.value = 'No se pudo cargar el ranking de deportistas en este momento.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section id="ranking" class="bg-white py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <p class="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Deportistas de Chuquisaca
        </p>
        <h2 class="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Ranking de deportistas</h2>
        <p class="mt-3 text-base text-slate-600">
          Posición de nuestros deportistas en el ranking nacional de su disciplina, según el registro del SEDEDE.
        </p>
      </div>

      <div v-if="loading" class="py-16 text-center" aria-live="polite">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent"></div>
        <p class="mt-3 text-sm text-slate-500">Cargando ranking…</p>
      </div>

      <div v-else-if="error" role="alert" class="mt-10 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {{ error }}
      </div>

      <div v-else-if="!disciplinas.length" class="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
        Todavía no hay deportistas con posición en el ranking nacional.
      </div>

      <template v-else>
        <!-- Disciplinas -->
        <div class="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Disciplinas">
          <div class="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            <button
              v-for="d in disciplinas"
              :key="d.disciplina"
              type="button"
              role="tab"
              :aria-selected="d.disciplina === seleccionada"
              class="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              :class="d.disciplina === seleccionada
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700'"
              @click="seleccionada = d.disciplina"
            >
              {{ d.disciplina }}
              <span class="ml-1 text-xs font-normal opacity-75">({{ d.total }})</span>
            </button>
          </div>
        </div>

        <div v-if="actual" role="tabpanel" class="mt-8">
          <!-- Podio -->
          <div v-if="podio.length" class="grid gap-4 md:grid-cols-3">
            <article
              v-for="d in podio"
              :key="d.id"
              class="flex flex-col rounded-2xl border border-slate-100 bg-paper p-5 shadow-sm"
            >
              <div class="flex items-center gap-4">
                <div class="relative">
                  <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-bold text-brand-700 ring-4" :class="MEDALLA[d.posicion_nacional].ring">
                    {{ iniciales(d.nombre) }}
                  </div>
                  <span class="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold" :class="MEDALLA[d.posicion_nacional].badge">
                    {{ MEDALLA[d.posicion_nacional].label }}
                  </span>
                </div>
                <div class="min-w-0">
                  <h3 class="font-display text-lg font-bold leading-tight text-ink">{{ d.nombre }}</h3>
                  <p class="text-xs text-slate-500">{{ d.categoria }}<template v-if="entidad(d)"> · {{ entidad(d) }}</template></p>
                </div>
              </div>
              <p v-if="d.logros" class="mt-4 line-clamp-3 text-sm text-slate-600">{{ d.logros }}</p>
              <p class="mt-auto pt-4 text-xs font-semibold text-navyflag">Puesto {{ d.posicion_nacional }} del ranking nacional</p>
            </article>
          </div>

          <!-- Resto -->
          <ol v-if="resto.length" class="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
            <li v-for="d in resto" :key="d.id" class="flex items-start gap-4 px-5 py-4">
              <span class="w-10 shrink-0 font-display text-xl font-bold tabular-nums text-slate-400">{{ d.posicion_nacional }}.º</span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-ink">{{ d.nombre }}</p>
                <p class="text-xs text-slate-500">{{ d.categoria }}<template v-if="entidad(d)"> · {{ entidad(d) }}</template></p>
                <p v-if="d.logros" class="mt-1 line-clamp-2 text-sm text-slate-600">{{ d.logros }}</p>
              </div>
            </li>
          </ol>

          <p v-if="actual.total > actual.deportistas.length" class="mt-4 text-xs text-slate-500">
            Se muestran los {{ actual.deportistas.length }} primeros de {{ actual.total }} deportistas en {{ actual.disciplina }}.
          </p>
        </div>

        <p class="mt-8 text-xs text-slate-400">
          Por protección de datos, los deportistas menores de edad se muestran con su nombre y la inicial del apellido.
        </p>
      </template>
    </div>
  </section>
</template>
