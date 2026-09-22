<script setup>
import { ref, reactive, onMounted } from 'vue'
import { seguimientoService } from '../services/seguimientoService'

const resumenMiembros = ref([])
const kpis = ref({
  total_prorrogas_concedidas: 0,
  total_tareas_rescatadas_lider: 0,
  total_entregas_sin_git: 0,
})
const isLoading = ref(true)
const errorMessage = ref('')

// Expediente modal
const showExpedienteModal = ref(false)
const selectedMiembroDetail = ref(null)
const loadingExpediente = ref(false)

// Prórroga modal
const showProrrogaModal = ref(false)
const selectedTarea = ref(null)
const savingProrroga = ref(false)
const prorrogaError = ref('')

const prorrogaForm = reactive({
  motivo_solicitud: '',
  dias_solicitados: 3,
  nueva_fecha_limite: '',
})

async function fetchResumen() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await seguimientoService.getResumen()
    resumenMiembros.value = data.resumen_miembros || []
    kpis.value = data.kpis || {}
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Error al cargar el tablero de seguimiento.'
  } finally {
    isLoading.value = false
  }
}

async function verExpediente(miembroId) {
  loadingExpediente.value = true
  selectedMiembroDetail.value = null
  showExpedienteModal.value = true
  try {
    selectedMiembroDetail.value = await seguimientoService.getExpedienteMiembro(miembroId)
  } catch (error) {
    alert(error.response?.data?.error || 'Error al cargar el expediente del integrante.')
  } finally {
    loadingExpediente.value = false
  }
}

function abrirProrrogaModal(tarea) {
  selectedTarea.value = tarea
  prorrogaForm.motivo_solicitud = ''
  prorrogaForm.dias_solicitados = 3
  prorrogaForm.nueva_fecha_limite = ''
  prorrogaError.value = ''
  showProrrogaModal.value = true
}

async function guardarProrroga() {
  savingProrroga.value = true
  prorrogaError.value = ''
  try {
    await seguimientoService.registrarProrroga(selectedTarea.value.id, { ...prorrogaForm })
    showProrrogaModal.value = false
    if (selectedMiembroDetail.value) {
      await verExpediente(selectedMiembroDetail.value.id)
    }
    await fetchResumen()
  } catch (error) {
    prorrogaError.value = error.response?.data?.error || 'Error al registrar la prórroga.'
  } finally {
    savingProrroga.value = false
  }
}

function closeModals() {
  showExpedienteModal.value = false
  showProrrogaModal.value = false
  selectedMiembroDetail.value = null
  selectedTarea.value = null
}

onMounted(() => {
  fetchResumen()
})
</script>

<template>
  <div class="mt-8">
    <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-display text-2xl font-bold text-brand-700">Seguimiento de Equipo</h1>
          <span class="rounded bg-brand-100 px-2.5 py-0.5 text-xs font-extrabold text-brand-800">Privado</span>
        </div>
        <p class="text-sm text-slate-500">Métricas de avance y prórrogas.</p>
      </div>
      <button class="btn-primary" @click="fetchResumen">Actualizar Métricas</button>
    </div>

    <!-- Tarjetas KPI Superiores -->
    <div class="mb-8 grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Prórrogas Otorgadas</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-3xl font-extrabold text-amber-600">{{ kpis.total_prorrogas_concedidas }}</span>
          <span class="text-xs text-slate-500">ampliaciones de plazo registradas</span>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Tareas Rescatadas por Líder</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-3xl font-extrabold text-indigo-600">{{ kpis.total_tareas_rescatadas_lider }}</span>
          <span class="text-xs text-slate-500">completadas por Pedro López</span>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Demos / Entregas Sin Repo Git</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-3xl font-extrabold text-red-600">{{ kpis.total_entregas_sin_git }}</span>
          <span class="text-xs text-slate-500">avances por pantalla no subidos</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando métricas de equipo...</div>
    <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <!-- Tabla Principal de Evaluación de Integrantes -->
    <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Integrante</th>
            <th class="px-4 py-3">Rol / Equipo</th>
            <th class="px-4 py-3 text-center">Tareas</th>
            <th class="px-4 py-3 text-center">A Tiempo</th>
            <th class="px-4 py-3 text-center">Prórrogas</th>
            <th class="px-4 py-3 text-center">Rescatadas x Líder</th>
            <th class="px-4 py-3 text-center">Scoring (%)</th>
            <th class="px-4 py-3">Desempeño</th>
            <th class="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="m in resumenMiembros" :key="m.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-semibold text-slate-900">
              {{ m.nombre_completo }}
              <span v-if="m.equipo === 'Liderazgo'" class="ml-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">Líder</span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-600">
              <div>{{ m.rol_proyecto }}</div>
              <span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{{ m.equipo }}</span>
            </td>
            <td class="px-4 py-3 text-center font-mono font-bold text-slate-800">{{ m.tareas_total }}</td>
            <td class="px-4 py-3 text-center font-mono font-bold text-emerald-700">{{ m.tareas_cumplidas_a_tiempo }}</td>
            <td class="px-4 py-3 text-center font-mono font-bold" :class="m.total_prorrogas > 0 ? 'text-amber-700' : 'text-slate-400'">
              {{ m.total_prorrogas }}
            </td>
            <td class="px-4 py-3 text-center font-mono font-bold" :class="m.tareas_rescatadas_por_lider > 0 ? 'text-indigo-700' : 'text-slate-400'">
              {{ m.tareas_rescatadas_por_lider }}
            </td>
            <td class="px-4 py-3 text-center font-mono text-base font-extrabold" :class="{
              'text-emerald-600': m.scoring_porcentaje >= 80,
              'text-amber-600': m.scoring_porcentaje >= 50 && m.scoring_porcentaje < 80,
              'text-red-600': m.scoring_porcentaje < 50
            }">
              {{ m.scoring_porcentaje }}%
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold" :class="{
                'bg-emerald-100 text-emerald-800': m.estado_desempeno === 'Excelente',
                'bg-amber-100 text-amber-800': m.estado_desempeno.includes('Regular'),
                'bg-red-100 text-red-800': m.estado_desempeno.includes('Alerta'),
              }">
                {{ m.estado_desempeno }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="verExpediente(m.id)">
                Ver Expediente →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Expediente del Integrante -->
    <div v-if="showExpedienteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="font-display text-lg font-bold text-brand-700">Expediente de Desempeño: {{ selectedMiembroDetail?.nombre_completo }}</h3>
            <p class="text-xs text-slate-500">{{ selectedMiembroDetail?.rol_proyecto }} | Equipo: {{ selectedMiembroDetail?.equipo }}</p>
          </div>
          <button class="font-bold text-slate-400 hover:text-slate-600" @click="closeModals">✕</button>
        </div>

        <div v-if="loadingExpediente" class="py-8 text-center text-slate-400">Cargando tareas y prórrogas...</div>

        <div v-else-if="selectedMiembroDetail" class="space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wide text-slate-700">Historial de Tareas y Entregas</h4>

          <div v-for="t in selectedMiembroDetail.tareas" :key="t.id" class="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-bold text-brand-700">{{ t.codigo_tarea }}</span>
                <span class="font-semibold text-slate-900 text-sm">{{ t.titulo }}</span>
                <span class="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">{{ t.sprint }}</span>
              </div>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="{
                'bg-emerald-100 text-emerald-800': t.estado === 'Entregado',
                'bg-indigo-100 text-indigo-800': t.estado === 'Rescatado por Lider',
                'bg-amber-100 text-amber-800': t.estado === 'En Progreso',
                'bg-red-100 text-red-800': t.estado === 'Incompleto' || t.estado === 'Pendiente',
              }">
                {{ t.estado }}
              </span>
            </div>

            <div class="flex items-center gap-4 text-xs text-slate-500">
              <span>Compromiso Inicial: <strong>{{ t.fecha_compromiso_inicial ? t.fecha_compromiso_inicial.split('T')[0] : '—' }}</strong></span>
              <span>Entrega Real: <strong>{{ t.fecha_entrega_real ? t.fecha_entrega_real.split('T')[0] : 'No entregado' }}</strong></span>
              <span class="font-semibold" :class="t.verificado_git ? 'text-emerald-700' : 'text-red-600'">
                {{ t.verificado_git ? '✓ Verificado en Git' : '⚠️ Sin Commits en Git' }}
              </span>
            </div>

            <p v-if="t.observaciones" class="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-100">
              <strong>Nota del Líder:</strong> {{ t.observaciones }}
            </p>

            <!-- Prórrogas asociadas a la tarea -->
            <div v-if="t.prorrogas && t.prorrogas.length > 0" class="mt-2 rounded bg-amber-50 p-2.5 border border-amber-200 text-xs space-y-1">
              <span class="font-bold text-amber-900">Historial de Prórrogas Solicitadas ({{ t.prorrogas.length }}):</span>
              <div v-for="p in t.prorrogas" :key="p.id" class="text-[11px] text-amber-800">
                • <strong>Prórroga #{{ p.numero_prorroga }}</strong> (+{{ p.dias_solicitados }} días): {{ p.motivo_solicitud }} 
                (Límite previo: {{ p.fecha_anterior?.split('T')[0] }} $\rightarrow$ Nueva fecha: {{ p.nueva_fecha_limite?.split('T')[0] }})
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <button class="text-xs font-semibold text-amber-700 hover:underline" @click="abrirProrrogaModal(t)">
                + Registrar Nueva Prórroga
              </button>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button class="btn-secondary" @click="closeModals">Cerrar Expediente</button>
        </div>
      </div>
    </div>

    <!-- Modal Registrar Prórroga -->
    <div v-if="showProrrogaModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-1 font-display text-lg font-bold text-brand-700">Registrar Prórroga a Tarea</h3>
        <p class="mb-4 text-xs text-slate-500">{{ selectedTarea?.codigo_tarea }}: {{ selectedTarea?.titulo }}</p>

        <form class="space-y-4" @submit.prevent="guardarProrroga">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Motivo de la Solicitud *</label>
            <textarea v-model="prorrogaForm.motivo_solicitud" rows="3" class="input-field text-sm" placeholder="ej. Demora en integración de componentes..." required :disabled="savingProrroga"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Días Solicitados *</label>
              <input v-model="prorrogaForm.dias_solicitados" type="number" class="input-field text-sm" required :disabled="savingProrroga" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Nueva Fecha Límite *</label>
              <input v-model="prorrogaForm.nueva_fecha_limite" type="date" class="input-field text-sm" required :disabled="savingProrroga" />
            </div>
          </div>

          <div v-if="prorrogaError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ prorrogaError }}
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="btn-secondary" :disabled="savingProrroga" @click="showProrrogaModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="savingProrroga">{{ savingProrroga ? 'Guardando…' : 'Conceder Prórroga' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
