<script setup>
import { computed, reactive, ref } from 'vue'
import { useFormacionStore, edadA, esMenorDeEdad } from '../stores/formacion'

const store = useFormacionStore()

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const TIPOS = { sedede: 'SEDEDE', asociacion: 'Asociación', club: 'Club', privada: 'Privada' }
const ESTADOS = {
  activa: { label: 'Activa', clase: 'bg-teal-100 text-teal-700' },
  suspendida: { label: 'Suspendida', clase: 'bg-amber-100 text-amber-700' },
  retirada: { label: 'Retirada', clase: 'bg-slate-100 text-slate-500' },
  finalizada: { label: 'Finalizada', clase: 'bg-blue-100 text-blue-700' },
}

const escuelaId = ref(store.escuelas[0]?.id ?? null)
const grupoId = ref(null)

const escuela = computed(() => store.escuelas.find((e) => e.id === escuelaId.value))
const grupos = computed(() => (escuelaId.value ? store.gruposDeEscuela(escuelaId.value) : []))
const grupo = computed(() => store.grupos.find((g) => g.id === grupoId.value))
const inscripciones = computed(() => (grupoId.value ? store.inscripcionesDeGrupo(grupoId.value) : []))

function elegirEscuela(id) {
  escuelaId.value = id
  grupoId.value = null
}

const porcentajeCupo = (g) => (g.cupo ? Math.min(100, Math.round((store.ocupados(g.id) / g.cupo) * 100)) : 0)

// --- Modal: inscribir ---
const showInscribir = ref(false)
const errores = ref([])
const form = reactive({
  nombre: '',
  fecha_nacimiento: '',
  documento_numero: '',
  tutor_nombre: '',
  tutor_telefono: '',
})

// El tutor solo se pide cuando el participante es menor
const requiereTutor = computed(() => !!form.fecha_nacimiento && esMenorDeEdad(form.fecha_nacimiento))
const edadAlInicio = computed(() =>
  form.fecha_nacimiento && grupo.value ? edadA(form.fecha_nacimiento, grupo.value.fecha_inicio) : null
)

function abrirInscribir() {
  Object.assign(form, { nombre: '', fecha_nacimiento: '', documento_numero: '', tutor_nombre: '', tutor_telefono: '' })
  errores.value = []
  showInscribir.value = true
}

function enviarInscripcion() {
  const res = store.inscribir(grupoId.value, { ...form })
  if (res.ok) {
    showInscribir.value = false
  } else {
    errores.value = res.errores
  }
}

// --- Modal: retirar ---
const showRetiro = ref(false)
const retiroInscripcion = ref(null)
const retiroErrores = ref([])
const retiro = reactive({ fecha: '', motivo: '' })

function abrirRetiro(insc) {
  retiroInscripcion.value = insc
  retiro.fecha = new Date().toISOString().slice(0, 10)
  retiro.motivo = ''
  retiroErrores.value = []
  showRetiro.value = true
}

function confirmarRetiro() {
  const res = store.retirar(retiroInscripcion.value.id, retiro.fecha, retiro.motivo)
  if (res.ok) showRetiro.value = false
  else retiroErrores.value = res.errores
}

// --- Cambios de estado simples ---
const avisoEstado = ref('')
function cambiar(insc, estado) {
  const res = store.cambiarEstado(insc.id, estado)
  avisoEstado.value = res.ok ? '' : res.errores.join(' ')
}
</script>

<template>
  <section>
    <p class="mb-6 text-sm text-slate-500">
      Inscripción de participantes a los grupos de las escuelas de formación.
    </p>

    <!-- Selector de escuela -->
    <div class="mb-6 flex flex-wrap gap-3">
      <button
        v-for="e in store.escuelas"
        :key="e.id"
        class="rounded-lg border px-4 py-3 text-left transition-colors"
        :class="e.id === escuelaId ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'"
        @click="elegirEscuela(e.id)"
      >
        <p class="text-sm font-semibold text-ink">{{ e.nombre }}</p>
        <p class="text-xs text-slate-500">{{ TIPOS[e.tipo] }} · {{ e.disciplina }}</p>
      </button>
    </div>

    <!-- Grupos de la escuela -->
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
      Grupos de {{ escuela?.nombre }}
    </h3>

    <div v-if="!grupos.length" class="rounded-lg border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-400">
      Esta escuela aún no tiene grupos registrados.
    </div>

    <div v-else class="mb-8 grid gap-4 md:grid-cols-2">
      <button
        v-for="g in grupos"
        :key="g.id"
        class="rounded-lg border p-4 text-left transition-colors"
        :class="g.id === grupoId ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'"
        @click="grupoId = g.id"
      >
        <div class="flex items-start justify-between">
          <p class="font-display font-bold text-ink">{{ g.nombre }}</p>
          <span class="text-xs text-slate-400">Gestión {{ g.gestion }}</span>
        </div>
        <p class="mt-1 text-xs text-slate-500">{{ g.edad_minima }}–{{ g.edad_maxima }} años · inicio {{ g.fecha_inicio }}</p>

        <div class="mt-3">
          <div class="mb-1 flex justify-between text-xs">
            <span class="text-slate-500">Cupo</span>
            <span class="font-semibold" :class="g.cupo && store.ocupados(g.id) >= g.cupo ? 'text-red-600' : 'text-ink'">
              {{ store.ocupados(g.id) }} / {{ g.cupo ?? 'sin límite' }}
            </span>
          </div>
          <div v-if="g.cupo" class="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full"
              :class="porcentajeCupo(g) >= 100 ? 'bg-red-500' : 'bg-brand-600'"
              :style="{ width: porcentajeCupo(g) + '%' }"
            ></div>
          </div>
        </div>

        <ul class="mt-3 space-y-0.5 text-xs text-slate-500">
          <li v-for="(h, i) in g.horarios" :key="i">
            {{ DIAS[h.dia_semana] }} {{ h.hora_inicio }}–{{ h.hora_fin }} · {{ h.espacio }}
          </li>
        </ul>
      </button>
    </div>

    <!-- Inscritos del grupo elegido -->
    <template v-if="grupo">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Inscritos en «{{ grupo.nombre }}»</h3>
        <button class="btn-primary" @click="abrirInscribir">+ Inscribir participante</button>
      </div>

      <div v-if="avisoEstado" role="alert" class="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ avisoEstado }}
      </div>

      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Participante</th>
              <th class="px-4 py-3">Edad</th>
              <th class="px-4 py-3">Tutor</th>
              <th class="px-4 py-3">Inscripción</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="insc in inscripciones" :key="insc.id">
              <td class="px-4 py-3 font-medium text-ink">{{ store.getParticipante(insc.participante_id)?.nombre }}</td>
              <td class="px-4 py-3 text-slate-600">{{ edadA(store.getParticipante(insc.participante_id)?.fecha_nacimiento) }} años</td>
              <td class="px-4 py-3 text-slate-600">{{ store.getParticipante(insc.participante_id)?.tutor_nombre ?? '—' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ insc.fecha_inscripcion }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="ESTADOS[insc.estado].clase">
                  {{ ESTADOS[insc.estado].label }}
                </span>
                <p v-if="insc.estado === 'retirada'" class="mt-1 text-xs text-slate-400">
                  {{ insc.fecha_baja }} · {{ insc.motivo_baja }}
                </p>
              </td>
              <td class="px-4 py-3 text-right">
                <template v-if="insc.estado === 'activa'">
                  <button class="mr-3 text-xs font-semibold text-amber-700 hover:underline" @click="cambiar(insc, 'suspendida')">Suspender</button>
                  <button class="mr-3 text-xs font-semibold text-blue-700 hover:underline" @click="cambiar(insc, 'finalizada')">Finalizar</button>
                  <button class="text-xs font-semibold text-red-600 hover:underline" @click="abrirRetiro(insc)">Retirar</button>
                </template>
                <template v-else-if="insc.estado === 'suspendida'">
                  <button class="mr-3 text-xs font-semibold text-teal-700 hover:underline" @click="cambiar(insc, 'activa')">Reactivar</button>
                  <button class="text-xs font-semibold text-red-600 hover:underline" @click="abrirRetiro(insc)">Retirar</button>
                </template>
                <span v-else class="text-xs text-slate-400">Historial</span>
              </td>
            </tr>
            <tr v-if="!inscripciones.length">
              <td colspan="6" class="px-4 py-8 text-center text-slate-400">Este grupo aún no tiene inscripciones.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <p class="mt-6 text-xs text-slate-400">
      Vista funcional con datos en memoria — el backend de Formación tiene esquema y modelos, pero sus endpoints están pendientes.
    </p>

    <!-- Modal: inscribir -->
    <div v-if="showInscribir" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-1 font-display text-lg font-bold text-ink">Inscribir participante</h3>
        <p class="mb-4 text-xs text-slate-500">
          {{ grupo.nombre }} · {{ grupo.edad_minima }}–{{ grupo.edad_maxima }} años al {{ grupo.fecha_inicio }}
        </p>

        <form novalidate class="space-y-4" @submit.prevent="enviarInscripcion">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre completo</label>
            <input v-model="form.nombre" type="text" class="input-field" required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Fecha de nacimiento</label>
              <input v-model="form.fecha_nacimiento" type="date" class="input-field" required />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Documento (opcional)</label>
              <input v-model="form.documento_numero" type="text" class="input-field" />
            </div>
          </div>

          <p v-if="edadAlInicio !== null" class="text-xs text-slate-500">
            Edad al inicio del grupo: <span class="font-semibold text-ink">{{ edadAlInicio }} años</span>
          </p>

          <div v-if="requiereTutor" class="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs font-semibold text-slate-600">Datos del tutor (obligatorios para menores)</p>
            <input v-model="form.tutor_nombre" type="text" placeholder="Nombre del tutor" class="input-field" />
            <input v-model="form.tutor_telefono" type="tel" placeholder="Teléfono del tutor" class="input-field" />
          </div>

          <ul v-if="errores.length" role="alert" class="space-y-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <li v-for="(e, i) in errores" :key="i">• {{ e }}</li>
          </ul>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="showInscribir = false">Cancelar</button>
            <button type="submit" class="btn-primary">Inscribir</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: retirar -->
    <div v-if="showRetiro" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">Retirar inscripción</h3>
        <form novalidate class="space-y-4" @submit.prevent="confirmarRetiro">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Fecha de retiro</label>
            <input v-model="retiro.fecha" type="date" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Motivo</label>
            <input v-model="retiro.motivo" type="text" class="input-field" required />
          </div>
          <ul v-if="retiroErrores.length" role="alert" class="space-y-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <li v-for="(e, i) in retiroErrores" :key="i">• {{ e }}</li>
          </ul>
          <p class="text-xs text-slate-400">La inscripción no se borra: queda en el historial como «retirada».</p>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="showRetiro = false">Cancelar</button>
            <button type="submit" class="btn-primary">Confirmar retiro</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
