<script setup>
import { onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'

const store = usePoaStore()

onMounted(() => { store.fetchTechos() })
</script>

<template>
  <section class="mt-8">
    <div class="mb-8">
      <h2 class="font-display text-2xl font-bold text-ink">Techos Presupuestarios</h2>
      <p class="mt-1 text-sm text-slate-500">Monto solicitado por actividad</p>
    </div>

    <div v-if="store.loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="store.error" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{{ store.error }}</div>

    <div v-else-if="store.techos.length" class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50">
            <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actividad</th>
            <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Monto (Bs.)</th>
            <th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Version</th>
            <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Justificacion</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="techo in store.techos" :key="techo.id" class="hover:bg-slate-50">
            <td class="px-5 py-3">
              <span class="font-mono text-xs text-slate-400">{{ techo.actividad?.codigo }}</span>
              <span class="ml-2 text-sm font-medium text-ink">{{ techo.actividad?.denominacion }}</span>
            </td>
            <td class="px-5 py-3 text-right">
              <span class="font-display font-bold text-emerald-600">
                {{ Number(techo.monto_solicitado_bs).toLocaleString('es-BO', { minimumFractionDigits: 2 }) }}
              </span>
            </td>
            <td class="px-5 py-3 text-center">
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">v{{ techo.version }}</span>
            </td>
            <td class="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate">{{ techo.justificacion ?? '-' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t border-slate-200 bg-slate-50">
            <td class="px-5 py-3 text-sm font-bold text-ink">Total</td>
            <td class="px-5 py-3 text-right">
              <span class="font-display text-lg font-bold text-emerald-600">
                {{ store.techos.reduce((sum, t) => sum + Number(t.monto_solicitado_bs), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 }) }}
              </span>
            </td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-else class="py-16 text-center">
      <p class="text-sm font-medium text-slate-600">No hay techos presupuestarios registrados</p>
    </div>
  </section>
</template>
