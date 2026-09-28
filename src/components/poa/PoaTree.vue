<script setup>
import PoaNode from './PoaNode.vue'

defineProps({
  programas: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'add-child', 'delete'])
</script>

<template>
  <div>
    <div v-if="!programas.length" class="py-16 text-center">
      <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <span class="text-2xl font-bold text-slate-400">POA</span>
      </div>
      <p class="mt-4 text-sm font-medium text-slate-600">No hay programas registrados</p>
      <p class="mt-1 text-xs text-slate-400">Comienza creando un nuevo programa</p>
    </div>

    <div v-else class="divide-y divide-slate-100">
      <PoaNode
        v-for="prog in programas"
        :key="prog.id"
        :node="prog"
        tipo="programa"
        :level="0"
        @edit="(n) => emit('edit', n)"
        @add-child="(payload) => emit('add-child', payload)"
        @delete="(n) => emit('delete', n)"
      />
    </div>
  </div>
</template>
