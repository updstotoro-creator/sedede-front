<script setup>
import { reactive, watch, computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  tipo: { type: String, default: 'programa' },
  editing: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  childInfo: { type: Object, default: null },
  error: { type: String, default: '' },
  // Gestión (año) del plan activo: se asigna a los programas nuevos.
  gestionId: { type: Number, default: null },
  // Catálogo de unidades organizacionales [{ id, nombre }].
  unidades: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  codigo: '',
  denominacion: '',
  objetivo_ptdi: '',
  producto_esperado: '',
  unidad_medida: '',
  tipo: 'producto',
  formula: '',
  unidad_organizacional_id: '',
})

watch(
  () => [props.show, props.editing],
  () => {
    const val = props.editing ?? {}
    form.codigo = val.codigo ?? ''
    form.denominacion = val.denominacion ?? ''
    form.objetivo_ptdi = val.objetivo_ptdi ?? ''
    form.producto_esperado = val.producto_esperado ?? ''
    form.unidad_medida = val.unidad_medida ?? ''
    form.tipo = val.tipo ?? 'producto'
    form.formula = val.formula ?? ''
    form.unidad_organizacional_id = val.unidad_organizacional_id ?? ''
  },
  { immediate: true }
)

const config = computed(() => {
  const map = {
    programa: { 
      letter: 'PR', 
      title: 'Programa',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50'
    },
    proyecto: { 
      letter: 'PY', 
      title: 'Proyecto',
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50'
    },
    actividad: { 
      letter: 'AC', 
      title: 'Actividad',
      color: 'from-teal-500 to-teal-600',
      bg: 'bg-teal-50'
    },
    indicador: { 
      letter: 'IN', 
      title: 'Indicador',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50'
    },
    meta: { 
      letter: 'ME', 
      title: 'Meta',
      color: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50'
    },
  }
  return map[props.tipo] ?? { letter: '?', title: 'Elemento', color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50' }
})

function close() {
  if (!props.saving) {
    emit('close')
  }
}

function submit() {
  const data = {
    codigo: form.codigo.trim(),
    denominacion: form.denominacion.trim(),
  }

  if (props.tipo === 'programa') {
    if (!props.editing) data.gestion_id = props.gestionId
    data.objetivo_ptdi = form.objetivo_ptdi || null
  } else if (props.tipo === 'actividad') {
    data.producto_esperado = form.producto_esperado || null
    // Sin unidad elegida, el backend asigna la unidad ejecutora del plan.
    if (form.unidad_organizacional_id) data.unidad_organizacional_id = form.unidad_organizacional_id
  } else if (props.tipo === 'indicador') {
    data.unidad_medida = form.unidad_medida.trim()
    data.tipo = form.tipo
    data.formula = form.formula || null
  }

  emit('submit', data)
}

const canSubmit = computed(() => {
  if (!form.codigo.trim() || !form.denominacion.trim()) return false
  if (props.tipo === 'indicador' && !form.unidad_medida.trim()) return false
  return true
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
          <!-- Header -->
          <div class="relative border-b border-slate-100 px-6 py-5">
            <div class="absolute inset-0 bg-gradient-to-r opacity-5" :class="config.color"></div>
            <div class="relative flex items-center gap-3">
              <div 
                class="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold"
                :class="[config.bg, 'text-slate-600']"
              >
                {{ config.letter }}
              </div>
              <div>
                <h3 class="font-display text-lg font-bold text-ink">
                  {{ editing ? `Editar ${config.title}` : `Nuevo ${config.title}` }}
                </h3>
                <p class="text-xs text-slate-500">
                  <template v-if="childInfo && !editing">
                    En: <span class="font-semibold">{{ childInfo.parent.denominacion }}</span>
                  </template>
                  <template v-else>
                    {{ editing ? 'Modifica los datos del elemento' : `Crea un nuevo ${config.title.toLowerCase()}` }}
                  </template>
                </p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form novalidate class="max-h-[60vh] overflow-y-auto p-6" @submit.prevent="submit">
            <div class="space-y-5">
              <!-- Codigo -->
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700">
                  Codigo <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="form.codigo" 
                  type="text" 
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  placeholder="Ej: 10, 10.01, 10.01.01"
                  :maxlength="tipo === 'programa' || tipo === 'proyecto' ? 10 : 20"
                  required 
                  :disabled="saving"
                />
              </div>

              <!-- Denominacion -->
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700">
                  Denominacion <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="form.denominacion" 
                  type="text" 
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  placeholder="Nombre descriptivo"
                  maxlength="240"
                  required 
                  :disabled="saving"
                />
              </div>

              <!-- Programa: Objetivo PTDI -->
              <div v-if="tipo === 'programa'">
                <label class="mb-2 block text-sm font-semibold text-slate-700">Objetivo PTDI</label>
                <textarea 
                  v-model="form.objetivo_ptdi" 
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  placeholder="Objetivo del PTDI al que responde"
                  rows="3"
                  :disabled="saving"
                ></textarea>
              </div>

              <!-- Actividad -->
              <template v-if="tipo === 'actividad'">
                <div v-if="unidades.length">
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Unidad responsable</label>
                  <select
                    v-model.number="form.unidad_organizacional_id"
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    :disabled="saving"
                  >
                    <option value="">La unidad ejecutora del plan</option>
                    <option v-for="u in unidades" :key="u.id" :value="u.id">{{ u.nombre }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Producto Esperado</label>
                  <textarea 
                    v-model="form.producto_esperado" 
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                    placeholder="Producto esperado de esta actividad"
                    rows="3"
                    :disabled="saving"
                  ></textarea>
                </div>
              </template>

              <!-- Indicador -->
              <template v-if="tipo === 'indicador'">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">
                    Unidad de Medida <span class="text-red-500">*</span>
                  </label>
                  <input 
                    v-model="form.unidad_medida" 
                    type="text" 
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                    placeholder="Ej: eventos, deportistas, porcentaje"
                    maxlength="40"
                    required 
                    :disabled="saving"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Tipo</label>
                  <select 
                    v-model="form.tipo" 
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    :disabled="saving"
                  >
                    <option value="proceso">Proceso</option>
                    <option value="producto">Producto</option>
                    <option value="resultado">Resultado</option>
                  </select>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Formula de Calculo</label>
                  <textarea 
                    v-model="form.formula" 
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                    placeholder="(Avance Real / Meta Planificada) x 100"
                    rows="2"
                    :disabled="saving"
                  ></textarea>
                </div>
              </template>

            </div>

            <!-- Error -->
            <div v-if="error" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ error }}
            </div>

            <!-- Loading -->
            <div v-if="saving" class="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-r-transparent"></div>
              Guardando...
            </div>

            <!-- Actions -->
            <div class="mt-6 flex items-center justify-end gap-3">
              <button 
                type="button" 
                class="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100" 
                :disabled="saving" 
                @click="close"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50" 
                :class="config.color"
                :disabled="saving || !canSubmit"
              >
                <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                {{ editing ? 'Guardar cambios' : `Crear ${config.title}` }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
