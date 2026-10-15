<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePoaStore } from '../stores/poa'

const store = usePoaStore()
const route = useRoute()

const filtroIndicador = ref(route.query.indicador_id ?? '')
const filtroEvento = ref('')

const eventoConfig = {
  creacion: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Creación', sigla: 'CR' },
  aprobacion: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobación', sigla: 'AP' },
  reformulacion: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Reformulación', sigla: 'RF' },
  anulacion: { bg: 'bg-red-100', text: 'text-red-600', label: 'Anulación', sigla: 'AN' },
}
const evento = (t) => eventoConfig[t.evento] ?? eventoConfig.creacion
const fmt = (v) => Number(v).toLocaleString('es-BO', { maximumFractionDigits: 4 })
const fecha = (v) => (v ? new Date(v).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '')

function cargar() {
  const params = {}
  if (filtroIndicador.value) params.indicador_id = filtroIndicador.value
  if (filtroEvento.value) params.evento = filtroEvento.value
  store.fetchTransiciones(params)
}

onMounted(() => { cargar() })
</script>

<template>
  <section class="mt-8">
    <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink">Bitácora de metas</h2>
        <p class="mt-1 text-sm text-slate-500">Registro inmutable de la creación, aprobación y reformulación de cada meta</p>
      </div>
      <form class="flex flex-col gap-2 sm:flex-row sm:items-center" @submit.prevent="cargar">
        <select v-model="filtroEvento" class="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
          <option value="">Todos los eventos</option>
          <option v-for="(cfg, key) in eventoConfig" :key="key" :value="key">{{ cfg.label }}</option>
        </select>
        <input
          v-model="filtroIndicador"
          type="number"
          min="1"
          placeholder="ID de indicador"
          class="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-40"
        />
        <button type="submit" class="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Filtrar</button>
      </form>
    </div>

    <div v-if="store.loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="store.error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{{ store.error }}</div>

    <div v-else-if="store.transiciones.length" class="relative">
      <div class="absolute bottom-0 left-8 top-0 w-px bg-slate-200"></div>
      <ol class="space-y-4">
        <li v-for="t in store.transiciones" :key="t.id" class="relative flex gap-4 pl-4">
          <div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow-sm" :class="[evento(t).bg, evento(t).text]">
            {{ evento(t).sigla }}
          </div>
          <div class="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="[evento(t).bg, evento(t).text]">{{ evento(t).label }}</span>
                  <span v-if="t.indicador" class="text-xs text-slate-500">
                    <span class="font-mono font-semibold">{{ t.indicador.codigo }}</span> {{ t.indicador.denominacion }}
                  </span>
                </div>
                <p class="mt-2 text-sm text-ink">
                  <template v-if="t.version_anterior">v{{ t.version_anterior }} ({{ fmt(t.meta_anual_anterior) }}) &rarr; </template>
                  <span class="font-semibold">v{{ t.version_nueva }}</span>
                  · meta <span class="font-semibold text-emerald-600">{{ fmt(t.meta_anual_nueva) }}</span>
                </p>
                <p v-if="t.motivo" class="mt-1 text-xs italic text-slate-500">{{ t.motivo }}</p>
              </div>
              <div class="shrink-0 text-xs text-slate-400 sm:text-right">
                <p>{{ t.usuario_nombre ?? `Usuario #${t.usuario_id}` }}</p>
                <p>{{ fecha(t.registrado_en) }}</p>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </div>

    <div v-else class="py-16 text-center">
      <p class="text-sm font-medium text-slate-600">No hay transiciones registradas</p>
    </div>
  </section>
</template>
