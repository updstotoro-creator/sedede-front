<script setup>
import PoaNode from './PoaNode.vue'

defineProps({
  programas: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'add-child'])
</script>

<template>
  <div class="space-y-1">
    <PoaNode
      v-for="prog in programas"
      :key="prog.id"
      :node="prog"
      tipo="programa"
      @edit="(n) => emit('edit', n)"
      @add-child="(payload) => emit('add-child', payload)"
    />

    <div v-if="!programas.length" class="py-10 text-center text-sm text-slate-400">
      No hay programas registrados.
    </div>
  </div>
</template>
