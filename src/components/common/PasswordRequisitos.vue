<script setup>
import { computed } from 'vue'
import { requisitosPassword } from '../../utils/validaciones'

// Lista de requisitos de contraseña junto al campo. Se marca cada uno al
// cumplirse; no bloquea nada por sí sola (lo hace el formulario y el servidor).
const props = defineProps({
  valor: { type: String, default: '' },
  // Estilo claro u oscuro según el fondo del formulario donde se use.
  oscuro: { type: Boolean, default: false },
})

const requisitos = computed(() => requisitosPassword(props.valor))
const hayTexto = computed(() => props.valor.length > 0)
</script>

<template>
  <ul class="mt-1.5 space-y-0.5 text-[11px]" aria-live="polite">
    <li
      v-for="r in requisitos"
      :key="r.clave"
      class="flex items-center gap-1.5"
      :class="
        r.cumple
          ? oscuro ? 'text-emerald-400' : 'text-emerald-700'
          : hayTexto ? (oscuro ? 'text-amber-300' : 'text-red-600') : (oscuro ? 'text-slate-400' : 'text-slate-500')
      "
    >
      <span aria-hidden="true" class="w-3 text-center font-bold">{{ r.cumple ? '✓' : '○' }}</span>
      <span>{{ r.texto }}</span>
    </li>
  </ul>
</template>
