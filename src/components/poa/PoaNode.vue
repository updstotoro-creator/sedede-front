<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  tipo: { type: String, required: true },
})

const emit = defineEmits(['edit', 'add-child'])

const expanded = ref(false)

const childTipo = computed(() => {
  const map = {
    programa: 'proyecto',
    proyecto: 'actividad',
    actividad: 'indicador',
    indicador: 'meta',
  }
  return map[props.tipo] ?? null
})

const childLabel = computed(() => {
  const map = {
    programa: 'Proyecto',
    proyecto: 'Actividad',
    actividad: 'Indicador',
    indicador: 'Meta',
  }
  return map[props.tipo] ?? 'Hijo'
})

const estadoColor = computed(() => {
  const map = {
    borrador: 'bg-slate-100 text-slate-600',
    vigente: 'bg-teal-100 text-teal-700',
    aprobado: 'bg-teal-100 text-teal-700',
    anulada: 'bg-red-100 text-red-600',
  }
  return map[props.node.estado] ?? 'bg-slate-100 text-slate-600'
})

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="ml-0">
    <div
      class="flex items-center gap-2 rounded px-3 py-2 transition-colors hover:bg-slate-50"
      :class="{ 'ml-4': tipo !== 'programa' }"
    >
      <button
        v-if="node.children?.length || childTipo"
        class="flex h-5 w-5 shrink-0 items-center justify-center text-xs text-slate-400 hover:text-slate-600"
        @click="toggle"
      >
        <span :class="expanded ? 'rotate-90' : ''" class="transition-transform">▶</span>
      </button>
      <span v-else class="w-5 shrink-0" />

      <span class="text-xs font-mono text-slate-500">{{ node.codigo }}</span>
      <span class="text-sm font-medium text-ink">{{ node.denominacion }}</span>

      <span
        class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
        :class="estadoColor"
      >
        {{ node.estado ?? 'borrador' }}
      </span>

      <button
        class="ml-2 text-xs font-semibold text-brand-600 hover:underline"
        @click="emit('edit', node)"
      >
        Editar
      </button>

      <button
        v-if="childTipo"
        class="text-xs font-semibold text-slate-500 hover:underline"
        @click="emit('add-child', { parent: node, tipo: childTipo, label: childLabel })"
      >
        + {{ childLabel }}
      </button>
    </div>

    <div v-if="expanded && node.children?.length" class="ml-4 border-l border-slate-100 pl-2">
      <PoaNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :tipo="childTipo"
        @edit="(n) => emit('edit', n)"
        @add-child="(payload) => emit('add-child', payload)"
      />
    </div>
  </div>
</template>
