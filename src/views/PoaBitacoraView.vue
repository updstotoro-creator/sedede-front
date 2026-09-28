<script setup>
import { ref, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'

const store = usePoaStore()
const filtroMeta = ref('')

const eventoConfig = {
  creacion: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Creacion' },
  aprobacion: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobacion' },
  reformulacion: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Reformulacion' },
  anulacion: { bg: 'bg-red-100', text: 'text-red-600', label: 'Anulacion' },
}

function cargar() {
  const params = {}
  if (filtroMeta.value) params.meta_id = filtroMeta.value
  store.fetchTransiciones(params)
}

onMounted(() => { cargar() })
</script>

<template>
  <section class="mt-8">
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink">Bitacora de Metas</h2>
        <p class="mt-1 text-sm text-slate-500">Historial inmutable de cambios en metas (append-only)</p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="filtroMeta"
          type="number"
          placeholder="Filtrar por meta ID"
          class="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          @keyup.enter="cargar"
        />
        <button class="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600" @click="cargar">Buscar</button>
      </div>
    </div>

    <div v-if="store.loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="store.error" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{{ store.error }}</div>

    <div v-else-if="store.transiciones.length" class="relative">
      <div class="absolute left-8 top-0 bottom-0 w-px bg-slate-200"></div>
      <div class="space-y-4">
        <div v-for="t in store.transiciones" :key="t.id" class="relative flex gap-4 pl-4">
          <div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow-sm" :class="(eventoConfig[t.evento] ?? eventoConfig.creacion).bg + ' ' + (eventoConfig[t.evento] ?? eventoConfig.creacion).text">
            {{ (eventoConfig[t.evento] ?? eventoConfig.creacion).label.substring(0, 2).toUpperCase() }}
          </div>
          <div class="flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="(eventoConfig[t.evento] ?? eventoConfig.creacion).bg + ' ' + (eventoConfig[t.evento] ?? eventoConfig.creacion).text">
                    {{ (eventoConfig[t.evento] ?? eventoConfig.creacion).label }}
                  </span>
                  <span class="text-xs text-slate-400">Meta #{{ t.meta_id }}</span>
                </div>
                <p class="mt-2 text-sm text-ink">
                  <span class="text-slate-400">v{{ t.version_anterior ?? '-' }}</span>
                  &rarr;
                  <span class="font-semibold">v{{ t.version_nueva }}</span>
                </p>
                <div class="mt-1 flex items-center gap-4 text-xs text-slate-500">
                  <span v-if="t.meta_anual_anterior != null">
                    Meta: {{ t.meta_anual_anterior }} &rarr; <span class="font-semibold text-emerald-600">{{ t.meta_anual_nueva }}</span>
                  </span>
                  <span v-else>
                    Meta: <span class="font-semibold text-emerald-600">{{ t.meta_anual_nueva }}</span>
                  </span>
                </div>
                <p v-if="t.motivo" class="mt-1 text-xs text-slate-500 italic">{{ t.motivo }}</p>
              </div>
              <span class="text-xs text-slate-400">{{ t.usuario_nombre ?? `User #${t.usuario_id}` }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-16 text-center">
      <p class="text-sm font-medium text-slate-600">No hay transiciones registradas</p>
    </div>
  </section>
</template>
