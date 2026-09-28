<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  node: { type: Object, required: true },
  tipo: { type: String, required: true },
  level: { type: Number, default: 0 },
})

const emit = defineEmits(['edit', 'add-child', 'delete'])
const router = useRouter()
const expanded = ref(props.level < 2)

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

const nodeConfig = computed(() => {
  const map = {
    programa: { 
      letter: 'PR', 
      bg: 'bg-blue-50', 
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      label: 'Programa'
    },
    proyecto: { 
      letter: 'PY', 
      bg: 'bg-purple-50', 
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-700',
      label: 'Proyecto'
    },
    actividad: { 
      letter: 'AC', 
      bg: 'bg-teal-50', 
      border: 'border-teal-200',
      badge: 'bg-teal-100 text-teal-700',
      label: 'Actividad'
    },
    indicador: { 
      letter: 'IN', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      label: 'Indicador'
    },
    meta: { 
      letter: 'ME', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      label: 'Meta'
    },
  }
  return map[props.tipo] ?? { letter: '?', bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', label: 'Elemento' }
})

const estadoConfig = computed(() => {
  const map = {
    borrador: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' },
    vigente: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Vigente' },
    aprobado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobado' },
    anulada: { bg: 'bg-red-100', text: 'text-red-600', label: 'Anulada' },
  }
  return map[props.node.estado] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' }
})

const hasChildren = computed(() => props.node.children?.length > 0)
const canExpand = computed(() => hasChildren.value || childTipo.value)

function toggle() {
  if (canExpand.value) {
    expanded.value = !expanded.value
  }
}

function viewDetail() {
  if (props.tipo === 'actividad') {
    router.push({ name: 'dashboard-poa-actividad', params: { id: props.node.id } })
  }
}
</script>

<template>
  <div class="group">
    <div
      class="flex items-center gap-3 px-4 py-3 transition-all hover:bg-slate-50"
      :style="{ paddingLeft: `${(level * 24) + 16}px` }"
    >
      <!-- Expand/Collapse -->
      <button
        v-if="canExpand"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
        @click="toggle"
      >
        <svg 
          class="h-4 w-4 transition-transform duration-200" 
          :class="{ 'rotate-90': expanded }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div v-else class="w-6 shrink-0" />

      <!-- Type Badge -->
      <div 
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold leading-none"
        :class="[nodeConfig.bg, nodeConfig.border]"
      >
        {{ nodeConfig.letter }}
      </div>

      <!-- Info -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-semibold text-slate-400">{{ node.codigo }}</span>
          <span class="text-sm font-medium text-ink truncate">{{ node.denominacion }}</span>
        </div>
        <div class="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
          <template v-if="tipo === 'actividad'">
            <span v-if="node.descripcion" class="truncate max-w-[300px]">{{ node.descripcion }}</span>
            <span v-if="node.techo_presupuestario" class="text-emerald-600 font-semibold">
              Bs. {{ node.techo_presupuestario.toLocaleString('es-BO') }}
            </span>
          </template>
          <template v-else-if="tipo === 'indicador'">
            <span v-if="node.unidad_medida" class="text-slate-500">{{ node.unidad_medida }}</span>
            <span v-if="node.tipo" class="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{{ node.tipo }}</span>
            <span v-if="node.meta_vigente" class="text-emerald-600">
              Meta: {{ node.meta_vigente.meta_anual }}
            </span>
          </template>
          <template v-else-if="tipo === 'meta'">
            <span class="text-slate-500">v{{ node.version }}</span>
            <span class="text-slate-500">Base: {{ node.linea_base }}</span>
            <span class="text-emerald-600 font-semibold">Meta: {{ node.meta_anual }}</span>
            <span v-if="node.programaciones?.length" class="text-slate-500">
              {{ node.programaciones.length }} periodos
            </span>
          </template>
          <template v-else-if="node.children?.length">
            <span>{{ node.children.length }} hijos</span>
          </template>
        </div>
      </div>

      <!-- State -->
      <span
        v-if="node.estado"
        class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="[estadoConfig.bg, estadoConfig.text]"
      >
        {{ estadoConfig.label }}
      </span>

      <!-- Actions -->
      <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          v-if="tipo === 'actividad'"
          class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
          @click.stop="viewDetail"
        >
          Ver
        </button>
        <button
          class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          @click.stop="emit('edit', node)"
        >
          Editar
        </button>
        <button
          v-if="childTipo"
          class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          @click.stop="emit('add-child', { parent: node, tipo: childTipo, label: childLabel })"
        >
          + {{ childLabel }}
        </button>
        <button
          v-if="tipo !== 'programa'"
          class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          @click.stop="emit('delete', node)"
        >
          Eliminar
        </button>
      </div>
    </div>

    <!-- Children -->
    <div 
      v-if="expanded && hasChildren" 
      class="relative"
      :style="{ marginLeft: `${(level * 24) + 44}px` }"
    >
      <div class="absolute left-0 top-0 bottom-0 w-px bg-slate-200"></div>
      <div class="relative">
        <PoaNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :tipo="childTipo"
          :level="level + 1"
          @edit="(n) => emit('edit', n)"
          @add-child="(payload) => emit('add-child', payload)"
          @delete="(n) => emit('delete', n)"
        />
      </div>
    </div>

    <!-- Empty Children -->
    <div 
      v-else-if="expanded && !hasChildren && childTipo" 
      class="py-4 text-center text-xs text-slate-400"
      :style="{ marginLeft: `${(level * 24) + 44}px` }"
    >
      Sin {{ childLabel.toLowerCase() }}s registrados
    </div>
  </div>
</template>
