<script setup>
import { usePoaStore } from '../../stores/poa'

// Selector del plan activo, compartido por Estructura, Techos y Dashboard.
const store = usePoaStore()
const emit = defineEmits(['change'])

const estadoLabel = { borrador: 'Borrador', aprobado: 'Aprobado', cerrado: 'Cerrado' }

function onChange(event) {
  store.seleccionarPlan(Number(event.target.value) || null)
  emit('change', store.planId)
}
</script>

<template>
  <label class="flex items-center gap-2 text-sm">
    <span class="font-semibold text-slate-600">Plan</span>
    <select
      :value="store.planId ?? ''"
      class="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-72"
      :disabled="!store.planes.length"
      @change="onChange"
    >
      <option v-if="!store.planes.length" value="">Sin planes registrados</option>
      <option v-for="plan in store.planes" :key="plan.id" :value="plan.id">
        {{ plan.gestion_id }} · {{ plan.denominacion }} ({{ estadoLabel[plan.estado] ?? plan.estado }})
      </option>
    </select>
  </label>
</template>
