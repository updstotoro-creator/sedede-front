<script setup>
import { ref, reactive, onMounted } from 'vue'
import { escenarioService } from '../services/escenarioService'

const escenarios = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const showEscenarioModal = ref(false)
const showProgModal = ref(false)
const editingEscenario = ref(null)
const targetEscenario = ref(null)

const formError = ref('')
const saving = ref(false)

const escenarioForm = reactive({
  nombre: '',
  espacio: '',
  ubicacion: '',
  capacidad_espectadores: '',
  tiene_iluminacion: true,
})

const progForm = reactive({
  dia_semana: 'Lunes',
  hora_inicio: '14:00',
  hora_fin: '16:00',
  usuario_asignado: '',
  tipo_evento: 'Entrenamiento',
  turno: 'Día',
})

function resetEscenarioForm() {
  escenarioForm.nombre = ''
  escenarioForm.espacio = ''
  escenarioForm.ubicacion = ''
  escenarioForm.capacidad_espectadores = ''
  escenarioForm.tiene_iluminacion = true
  formError.value = ''
}

function resetProgForm() {
  progForm.dia_semana = 'Lunes'
  progForm.hora_inicio = '14:00'
  progForm.hora_fin = '16:00'
  progForm.usuario_asignado = ''
  progForm.tipo_evento = 'Entrenamiento'
  progForm.turno = 'Día'
  formError.value = ''
}

async function fetchEscenarios() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    escenarios.value = await escenarioService.list()
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Error al cargar escenarios deportivos.'
  } finally {
    isLoading.value = false
  }
}

function openCreateEscenarioModal() {
  editingEscenario.value = null
  resetEscenarioForm()
  showEscenarioModal.value = true
}

function openEditEscenarioModal(esc) {
  editingEscenario.value = esc
  escenarioForm.nombre = esc.nombre
  escenarioForm.espacio = esc.espacio
  escenarioForm.ubicacion = esc.ubicacion || ''
  escenarioForm.capacidad_espectadores = esc.capacidad_espectadores || ''
  escenarioForm.tiene_iluminacion = Boolean(esc.tiene_iluminacion)
  formError.value = ''
  showEscenarioModal.value = true
}

function openProgModal(esc) {
  targetEscenario.value = esc
  resetProgForm()
  showProgModal.value = true
}

function closeModals() {
  showEscenarioModal.value = false
  showProgModal.value = false
  editingEscenario.value = null
  targetEscenario.value = null
}

async function submitEscenarioForm() {
  saving.value = true
  formError.value = ''
  try {
    if (editingEscenario.value) {
      await escenarioService.update(editingEscenario.value.id, { ...escenarioForm })
    } else {
      await escenarioService.create({ ...escenarioForm })
    }
    closeModals()
    await fetchEscenarios()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Campos requeridos vacíos o inválidos.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar escenario.'
    }
  } finally {
    saving.value = false
  }
}

async function submitProgForm() {
  saving.value = true
  formError.value = ''
  try {
    await escenarioService.createProgramacion(targetEscenario.value.id, { ...progForm })
    closeModals()
    await fetchEscenarios()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Verifique los datos de la reserva.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar la programación.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActiveEscenario(esc) {
  try {
    if (esc.activo) {
      await escenarioService.delete(esc.id)
    } else {
      await escenarioService.reactivar(esc.id)
    }
    await fetchEscenarios()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar estado del escenario.')
  }
}

onMounted(fetchEscenarios)
</script>

<template>
  <div class="mt-8">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-brand-700">Programación de Escenarios Deportivos</h1>
        <p class="text-sm text-slate-500">Asignación de infraestructura, franjas horarias y eventos institucionales SEDEDE</p>
      </div>
      <button class="btn-primary" @click="openCreateEscenarioModal">+ Nuevo Escenario</button>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando programación de escenarios...</div>
    <div v-else-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="space-y-6">
      <div v-for="esc in escenarios" :key="esc.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-display text-lg font-bold text-slate-800">{{ esc.nombre }} — <span class="text-brand-600">{{ esc.espacio }}</span></h2>
              <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="esc.activo ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'">
                {{ esc.activo ? 'Habilitado' : 'Mantenimiento / Baja' }}
              </span>
            </div>
            <p class="text-xs text-slate-400">Ubicación: {{ esc.ubicacion || 'Estadio Patria' }} | Capacidad: {{ esc.capacidad_espectadores ? esc.capacidad_espectadores.toLocaleString() : 'N/A' }} personas</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {{ esc.tiene_iluminacion ? 'Con Iluminación (Noche)' : 'Sin Iluminación' }}
            </span>
            <button class="btn-primary py-1 px-3 text-xs bg-slate-800 hover:bg-slate-900 border-none" @click="openProgModal(esc)">+ Reservar Horario</button>
            <button class="text-xs font-semibold text-slate-600 hover:underline px-1" @click="openEditEscenarioModal(esc)">Editar</button>
            <button
              class="text-xs font-semibold hover:underline px-1"
              :class="esc.activo ? 'text-red-600' : 'text-teal-700'"
              @click="toggleActiveEscenario(esc)"
            >
              {{ esc.activo ? 'Inactivar' : 'Reactivar' }}
            </button>
          </div>
        </div>

        <div v-if="!esc.programaciones || esc.programaciones.length === 0" class="text-xs text-slate-400 py-2">
          Sin reservas de franjas horarias registradas para esta infraestructura.
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="p in esc.programaciones" :key="p.id" class="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div class="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{{ p.dia_semana }}</span>
              <span class="font-mono text-brand-700">{{ p.hora_inicio }} - {{ p.hora_fin }}</span>
            </div>
            <p class="text-xs font-semibold text-slate-900">{{ p.usuario_asignado }}</p>
            <div class="mt-2 flex items-center justify-between text-[11px]">
              <span class="rounded bg-slate-200 px-1.5 py-0.5 text-slate-700 font-medium">{{ p.tipo_evento }}</span>
              <span class="font-bold" :class="p.turno === 'Noche' ? 'text-indigo-600' : 'text-amber-600'">Turno {{ p.turno }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear / Editar Escenario -->
    <div v-if="showEscenarioModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">
          {{ editingEscenario ? 'Editar Escenario Deportivo' : 'Nuevo Escenario Deportivo' }}
        </h3>

        <form class="space-y-4" @submit.prevent="submitEscenarioForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre del Escenario / Recinto *</label>
            <input v-model="escenarioForm.nombre" type="text" class="input-field" placeholder="ej. Estadio Patria" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Espacio Específico *</label>
            <input v-model="escenarioForm.espacio" type="text" class="input-field" placeholder="ej. Campo Principal / Pista Atletismo" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Ubicación</label>
            <input v-model="escenarioForm.ubicacion" type="text" class="input-field" placeholder="ej. Av. Jaime Mendoza" :disabled="saving" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Capacidad Espectadores</label>
              <input v-model="escenarioForm.capacidad_espectadores" type="number" class="input-field" placeholder="ej. 32000" :disabled="saving" />
            </div>
            <div class="flex items-center pt-5">
              <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input v-model="escenarioForm.tiene_iluminacion" type="checkbox" class="rounded border-slate-300 text-brand-600 shadow-sm" :disabled="saving" />
                Tiene Iluminación Noche
              </label>
            </div>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700" :disabled="saving" @click="closeModals">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Reservar Programación Horaria -->
    <div v-if="showProgModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-1 font-display text-lg font-bold text-ink">Reservar Franja Horaria</h3>
        <p class="mb-4 text-xs text-slate-500">{{ targetEscenario?.nombre }} — {{ targetEscenario?.espacio }}</p>

        <form class="space-y-4" @submit.prevent="submitProgForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Entidad / Usuario Asignado *</label>
            <input v-model="progForm.usuario_asignado" type="text" class="input-field" placeholder="ej. Asociación Departamental de Fútbol" required :disabled="saving" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Día de la semana *</label>
              <select v-model="progForm.dia_semana" class="input-field" required :disabled="saving">
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Turno *</label>
              <select v-model="progForm.turno" class="input-field" required :disabled="saving">
                <option value="Día">Día</option>
                <option value="Noche">Noche</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Hora Inicio *</label>
              <input v-model="progForm.hora_inicio" type="text" class="input-field" placeholder="ej. 14:00" required :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Hora Fin *</label>
              <input v-model="progForm.hora_fin" type="text" class="input-field" placeholder="ej. 16:00" required :disabled="saving" />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Tipo de Evento *</label>
            <input v-model="progForm.tipo_evento" type="text" class="input-field" placeholder="ej. Entrenamiento / Competencia Oficial" required :disabled="saving" />
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700" :disabled="saving" @click="closeModals">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Reservar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
