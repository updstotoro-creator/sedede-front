<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { poaService, mensajeError } from '../../services/poaService'
import { usePoaStore } from '../../stores/poa'

const props = defineProps({
  indicador: { type: Object, required: true },
  // { estado, tipo_periodo, cantidad_periodos } del plan de la actividad
  plan: { type: Object, required: true },
  actividadAnulada: { type: Boolean, default: false },
})

const emit = defineEmits(['changed'])
const store = usePoaStore()

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const meta = computed(() => props.indicador.meta_vigente)
const historial = computed(() => [...(props.indicador.metas ?? [])].reverse())
const enBorrador = computed(() => props.plan.estado === 'borrador')
const cerrado = computed(() => props.plan.estado === 'cerrado')
const aprobado = computed(() => props.plan.estado === 'aprobado')

const puedeCrear = computed(() => store.puede('poa.crear'))
const puedeEditar = computed(() => store.puede('poa.editar'))
const puedeRegistrarAvance = computed(() => store.puede('poa.registrar_avance') && aprobado.value && !props.actividadAnulada)

function etiquetaPeriodo(n) {
  if (props.plan.tipo_periodo === 'mensual') return MESES[n - 1]
  if (props.plan.tipo_periodo === 'semestral') return `S${n}`
  return `T${n}`
}

const num = (v) => Number(v ?? 0)
const fmt = (v) => num(v).toLocaleString('es-BO', { maximumFractionDigits: 4 })
const fecha = (v) => (v ? new Date(v).toLocaleDateString('es-BO') : '')

// ── Formulario de meta ──────────────────────────────────────
// modo: 'definir' (v1), 'corregir' (plan en borrador), 'reformular' (nueva versión)
const modo = ref(null)
const metaForm = reactive({ linea_base: '', meta_anual: '', motivo: '' })
const guardandoMeta = ref(false)
const metaError = ref('')

function abrirMeta(nuevoModo) {
  modo.value = nuevoModo
  metaError.value = ''
  metaForm.linea_base = meta.value ? num(meta.value.linea_base) : ''
  metaForm.meta_anual = meta.value && nuevoModo === 'corregir' ? num(meta.value.meta_anual) : ''
  metaForm.motivo = ''
}

async function guardarMeta() {
  guardandoMeta.value = true
  metaError.value = ''
  try {
    const payload = {
      linea_base: metaForm.linea_base === '' ? null : Number(metaForm.linea_base),
      meta_anual: Number(metaForm.meta_anual),
    }
    if (modo.value === 'corregir') {
      await poaService.updateMeta(meta.value.id, payload)
    } else {
      await poaService.createMeta({
        ...payload,
        indicador_id: props.indicador.id,
        motivo: metaForm.motivo || null,
      })
    }
    modo.value = null
    emit('changed')
  } catch (e) {
    metaError.value = mensajeError(e, 'No se pudo guardar la meta')
  } finally {
    guardandoMeta.value = false
  }
}

// ── Programación por periodo ────────────────────────────────
const programacion = ref([])
const guardandoProg = ref(false)
const progError = ref('')
const progOk = ref(false)

// Con el plan aprobado la programación guardada queda congelada; una versión
// nueva de la meta (sin programación aún) sí se puede programar.
const progEditable = computed(() =>
  puedeEditar.value && !!meta.value && !cerrado.value && (enBorrador.value || !meta.value.programaciones?.length)
)

watch(
  meta,
  (m) => {
    const guardados = Object.fromEntries((m?.programaciones ?? []).map((p) => [p.numero_periodo, num(p.meta_periodo)]))
    programacion.value = Array.from({ length: props.plan.cantidad_periodos }, (_, i) => guardados[i + 1] ?? '')
    progError.value = ''
    progOk.value = false
  },
  { immediate: true }
)

// Comparación en diezmilésimas, la escala de DECIMAL(14,4) en la base.
const sumaProgramada = computed(() => programacion.value.reduce((s, v) => s + Math.round(num(v) * 10000), 0) / 10000)
const diferencia = computed(() => (Math.round(num(meta.value?.meta_anual) * 10000) - Math.round(sumaProgramada.value * 10000)) / 10000)
const cuadra = computed(() => diferencia.value === 0 && programacion.value.every((v) => v !== ''))

function repartirIgual() {
  const n = props.plan.cantidad_periodos
  const total = Math.round(num(meta.value?.meta_anual) * 10000)
  const base = Math.floor(total / n)
  // El resto se suma al último periodo para que el cuadre sea exacto.
  programacion.value = Array.from({ length: n }, (_, i) => (i === n - 1 ? total - base * (n - 1) : base) / 10000)
}

async function guardarProgramacion() {
  guardandoProg.value = true
  progError.value = ''
  progOk.value = false
  try {
    await poaService.guardarProgramacion(
      meta.value.id,
      programacion.value.map((v, i) => ({ numero_periodo: i + 1, meta_periodo: num(v) }))
    )
    progOk.value = true
    emit('changed')
  } catch (e) {
    progError.value = mensajeError(e, 'No se pudo guardar la programación')
  } finally {
    guardandoProg.value = false
  }
}

// ── Avance físico ───────────────────────────────────────────
// El avance vigente de cada periodo es el de mayor versión.
const avancesPorPeriodo = computed(() => {
  const mapa = {}
  for (const a of props.indicador.avances ?? []) {
    const actual = mapa[a.numero_periodo]
    if (!actual || a.version > actual.version) mapa[a.numero_periodo] = a
  }
  return mapa
})
const versionesPorPeriodo = computed(() => {
  const mapa = {}
  for (const a of props.indicador.avances ?? []) (mapa[a.numero_periodo] ??= []).push(a)
  return mapa
})
const ejecutadoTotal = computed(() => Object.values(avancesPorPeriodo.value).reduce((s, a) => s + num(a.valor_ejecutado), 0))
const cumplimientoAnual = computed(() =>
  num(meta.value?.meta_anual) > 0 ? Math.round((ejecutadoTotal.value / num(meta.value.meta_anual)) * 1000) / 10 : null
)

const avanceForm = reactive({ numero_periodo: 1, valor_ejecutado: '', observacion: '', motivo: '', archivos: [] })
const avanceAbierto = ref(false)
const guardandoAvance = ref(false)
const avanceError = ref('')
const inputArchivos = ref(null)
const esCorreccion = computed(() => !!avancesPorPeriodo.value[avanceForm.numero_periodo])

function abrirAvance(periodo) {
  Object.assign(avanceForm, { numero_periodo: periodo, valor_ejecutado: '', observacion: '', motivo: '', archivos: [] })
  if (inputArchivos.value) inputArchivos.value.value = ''
  avanceError.value = ''
  avanceAbierto.value = true
}

function onArchivos(event) {
  avanceForm.archivos = Array.from(event.target.files ?? [])
}

async function guardarAvance() {
  guardandoAvance.value = true
  avanceError.value = ''
  try {
    await poaService.registrarAvance({
      indicador_id: props.indicador.id,
      numero_periodo: avanceForm.numero_periodo,
      valor_ejecutado: avanceForm.valor_ejecutado,
      observacion: avanceForm.observacion,
      motivo: esCorreccion.value ? avanceForm.motivo : '',
      archivos: avanceForm.archivos,
    })
    avanceAbierto.value = false
    emit('changed')
  } catch (e) {
    avanceError.value = mensajeError(e, 'No se pudo registrar el avance')
  } finally {
    guardandoAvance.value = false
  }
}

// Integridad de respaldos: id de verificación → true | false | 'cargando'
const integridad = reactive({})
const accionError = ref('')

async function verificar(avance, v) {
  integridad[v.id] = 'cargando'
  try {
    integridad[v.id] = (await poaService.verificarIntegridad(avance.id, v.id)).coincide
  } catch (e) {
    delete integridad[v.id]
    accionError.value = mensajeError(e, 'No se pudo verificar el respaldo')
  }
}

async function descargar(avance, v) {
  accionError.value = ''
  try {
    await poaService.descargarVerificacion(avance.id, v)
  } catch (e) {
    accionError.value = mensajeError(e, 'No se pudo descargar el respaldo')
  }
}
</script>

<template>
  <div class="px-6 py-5">
    <!-- Cabecera del indicador -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono text-xs font-bold text-slate-400">{{ indicador.codigo }}</span>
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-amber-700">{{ indicador.tipo }}</span>
        </div>
        <p class="mt-1 text-sm font-medium text-ink">{{ indicador.denominacion }}</p>
        <p class="mt-1 text-xs text-slate-400">
          Unidad: {{ indicador.unidad_medida }}<span v-if="indicador.formula"> · Fórmula: {{ indicador.formula }}</span>
        </p>
      </div>

      <div v-if="meta" class="shrink-0 text-left sm:text-right">
        <p class="text-xs text-slate-400">Meta vigente v{{ meta.version }}</p>
        <p class="font-display text-2xl font-bold text-emerald-600">{{ fmt(meta.meta_anual) }}</p>
        <p class="text-xs text-slate-400">Línea base: {{ fmt(meta.linea_base) }}</p>
      </div>
      <span v-else class="shrink-0 self-start rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Sin meta</span>
    </div>

    <!-- Acciones de meta -->
    <div v-if="!cerrado && !modo" class="mt-3 flex flex-wrap gap-2">
      <button v-if="!meta && puedeCrear" class="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100" @click="abrirMeta('definir')">Definir meta</button>
      <button v-else-if="meta && enBorrador && puedeEditar" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100" @click="abrirMeta('corregir')">Corregir meta</button>
      <button v-else-if="meta && !enBorrador && puedeCrear" class="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100" @click="abrirMeta('reformular')">Reformular meta (nueva versión)</button>
    </div>

    <!-- Formulario de meta -->
    <form v-if="modo" novalidate class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4" @submit.prevent="guardarMeta">
      <p class="mb-3 text-xs font-semibold text-slate-600">
        {{ modo === 'definir' ? 'Definir meta (línea base v1)' : modo === 'corregir' ? `Corregir meta v${meta.version} (plan en borrador)` : `Nueva versión v${meta.version + 1}` }}
      </p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label class="block text-xs font-semibold text-slate-600">
          Línea base
          <input v-model="metaForm.linea_base" type="number" min="0" step="0.0001" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="guardandoMeta" />
        </label>
        <label class="block text-xs font-semibold text-slate-600">
          Meta anual <span class="text-red-500">*</span>
          <input v-model="metaForm.meta_anual" type="number" min="0" step="0.0001" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="guardandoMeta" />
        </label>
        <label v-if="modo === 'reformular'" class="block text-xs font-semibold text-slate-600 sm:col-span-3">
          Motivo de la reformulación <span class="text-red-500">*</span>
          <input v-model="metaForm.motivo" type="text" maxlength="240" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Ej: modificación presupuestaria MP-03/2026" :disabled="guardandoMeta" />
        </label>
      </div>
      <p v-if="metaError" role="alert" class="mt-3 text-xs text-red-600">{{ metaError }}</p>
      <div class="mt-3 flex justify-end gap-2">
        <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200" :disabled="guardandoMeta" @click="modo = null">Cancelar</button>
        <button type="submit" class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50" :disabled="guardandoMeta || metaForm.meta_anual === '' || (modo === 'reformular' && !metaForm.motivo.trim())">
          {{ guardandoMeta ? 'Guardando…' : 'Guardar meta' }}
        </button>
      </div>
    </form>

    <!-- Programación por periodo -->
    <div v-if="meta" class="mt-5">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs font-semibold text-slate-500">Programación {{ plan.tipo_periodo }} · meta v{{ meta.version }}</p>
        <button v-if="progEditable" type="button" class="text-xs font-semibold text-brand-600 hover:underline" @click="repartirIgual">Repartir en partes iguales</button>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <label v-for="(_, i) in programacion" :key="i" class="block rounded-lg bg-slate-50 px-3 py-2">
          <span class="text-[11px] font-semibold text-slate-400">{{ etiquetaPeriodo(i + 1) }}</span>
          <input
            v-model="programacion[i]"
            type="number"
            min="0"
            step="0.0001"
            class="mt-0.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-ink disabled:border-transparent disabled:bg-transparent"
            :disabled="!progEditable || guardandoProg"
          />
          <span v-if="!enBorrador" class="mt-0.5 block text-[11px] text-slate-500">
            Ejecutado:
            <span class="font-semibold" :class="avancesPorPeriodo[i + 1] ? 'text-emerald-700' : 'text-slate-400'">
              {{ avancesPorPeriodo[i + 1] ? fmt(avancesPorPeriodo[i + 1].valor_ejecutado) : '—' }}
            </span>
          </span>
        </label>
      </div>
      <div v-if="enBorrador || progEditable" class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p :class="cuadra ? 'text-emerald-600' : 'text-amber-700'">
          Suma programada {{ fmt(sumaProgramada) }} de {{ fmt(meta.meta_anual) }}
          <span v-if="!cuadra"> · diferencia {{ fmt(diferencia) }}</span>
          <span v-else> · cuadra</span>
        </p>
        <button v-if="progEditable" type="button" class="rounded-lg bg-brand-500 px-3 py-1.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-50" :disabled="!cuadra || guardandoProg" @click="guardarProgramacion">
          {{ guardandoProg ? 'Guardando…' : 'Guardar programación' }}
        </button>
      </div>
      <p v-if="progError" role="alert" class="mt-2 text-xs text-red-600">{{ progError }}</p>
      <p v-if="progOk" class="mt-2 text-xs text-emerald-600">Programación guardada.</p>
    </div>

    <!-- Avance físico -->
    <div v-if="meta && !enBorrador" class="mt-5 rounded-xl border border-slate-100">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <p class="text-xs font-semibold text-slate-600">
          Avance físico · ejecutado {{ fmt(ejecutadoTotal) }} de {{ fmt(meta.meta_anual) }}
          <span v-if="cumplimientoAnual !== null" class="text-slate-400">({{ cumplimientoAnual }} % de la meta anual)</span>
        </p>
        <button v-if="puedeRegistrarAvance && !avanceAbierto" class="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100" @click="abrirAvance(1)">
          + Registrar avance
        </button>
      </div>

      <!-- Formulario de avance -->
      <form v-if="avanceAbierto" novalidate class="border-b border-slate-100 bg-slate-50 p-4" @submit.prevent="guardarAvance">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="block text-xs font-semibold text-slate-600">
            Periodo
            <select v-model.number="avanceForm.numero_periodo" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="guardandoAvance">
              <option v-for="n in plan.cantidad_periodos" :key="n" :value="n">
                {{ etiquetaPeriodo(n) }}{{ avancesPorPeriodo[n] ? ' (ya registrado: corrección)' : '' }}
              </option>
            </select>
          </label>
          <label class="block text-xs font-semibold text-slate-600">
            Valor ejecutado ({{ indicador.unidad_medida }}) <span class="text-red-500">*</span>
            <input v-model="avanceForm.valor_ejecutado" type="number" min="0" step="0.0001" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="guardandoAvance" />
          </label>
          <label class="block text-xs font-semibold text-slate-600">
            Medio de verificación <span class="text-red-500">*</span>
            <input ref="inputArchivos" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" class="mt-1 block w-full text-xs font-normal text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1.5 file:text-xs file:font-semibold" :disabled="guardandoAvance" @change="onArchivos" />
          </label>
          <label class="block text-xs font-semibold text-slate-600 sm:col-span-3">
            Observación
            <input v-model="avanceForm.observacion" type="text" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Qué se hizo y, si hay rezago, por qué" :disabled="guardandoAvance" />
          </label>
          <label v-if="esCorreccion" class="block text-xs font-semibold text-slate-600 sm:col-span-3">
            Motivo de la corrección <span class="text-red-500">*</span>
            <input v-model="avanceForm.motivo" type="text" maxlength="240" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Ej: la planilla duplicaba registros" :disabled="guardandoAvance" />
          </label>
        </div>
        <p class="mt-2 text-[11px] text-slate-400">PDF, imagen, Excel o Word, hasta 10 MB cada uno y 5 archivos. Se guarda el hash SHA-256 de cada archivo.</p>
        <p v-if="avanceError" role="alert" class="mt-2 text-xs text-red-600">{{ avanceError }}</p>
        <div class="mt-3 flex justify-end gap-2">
          <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200" :disabled="guardandoAvance" @click="avanceAbierto = false">Cancelar</button>
          <button type="submit" class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50" :disabled="guardandoAvance || avanceForm.valor_ejecutado === '' || !avanceForm.archivos.length || (esCorreccion && !avanceForm.motivo.trim())">
            {{ guardandoAvance ? 'Guardando…' : esCorreccion ? 'Registrar corrección' : 'Registrar avance' }}
          </button>
        </div>
      </form>

      <p v-if="accionError" role="alert" class="px-4 pt-3 text-xs text-red-600">{{ accionError }}</p>

      <!-- Avances por periodo -->
      <ul v-if="Object.keys(avancesPorPeriodo).length" class="divide-y divide-slate-100">
        <li v-for="(versiones, periodo) in versionesPorPeriodo" :key="periodo" class="px-4 py-3 text-xs">
          <div v-for="a in [...versiones].sort((x, y) => y.version - x.version)" :key="a.id" class="py-1" :class="a.id !== avancesPorPeriodo[periodo].id && 'opacity-60'">
            <div class="flex flex-wrap items-baseline gap-x-2">
              <span class="font-semibold text-ink">{{ etiquetaPeriodo(Number(periodo)) }}</span>
              <span class="font-bold text-emerald-700">{{ fmt(a.valor_ejecutado) }}</span>
              <span class="text-slate-400">v{{ a.version }}<template v-if="a.id !== avancesPorPeriodo[periodo].id"> (reemplazada)</template> · {{ fecha(a.registrado_en) }}</span>
            </div>
            <p v-if="a.motivo" class="text-amber-700">Corrección: {{ a.motivo }}</p>
            <p v-if="a.observacion" class="text-slate-500">{{ a.observacion }}</p>
            <div class="mt-1 flex flex-wrap gap-2">
              <span v-for="v in a.verificaciones" :key="v.id" class="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1">
                <button type="button" class="font-semibold text-brand-600 hover:underline" @click="descargar(a, v)">{{ v.nombre_archivo }}</button>
                <button type="button" class="text-slate-400 hover:text-ink" :title="`SHA-256 ${v.hash_sha256}`" @click="verificar(a, v)">
                  <template v-if="integridad[v.id] === 'cargando'">verificando…</template>
                  <template v-else-if="integridad[v.id] === true"><span class="text-emerald-600">✓ íntegro</span></template>
                  <template v-else-if="integridad[v.id] === false"><span class="text-red-600">✗ alterado</span></template>
                  <template v-else>verificar</template>
                </button>
              </span>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="px-4 py-3 text-xs text-slate-400">Sin avances registrados.</p>
    </div>

    <!-- Historial de versiones -->
    <div v-if="historial.length > 1" class="mt-4">
      <p class="mb-1 text-xs font-semibold text-slate-500">Versiones de la meta</p>
      <ul class="space-y-1 text-xs">
        <li v-for="m in historial" :key="m.id" class="flex flex-wrap gap-x-2 text-slate-600">
          <span class="font-semibold">v{{ m.version }}</span>
          <span class="text-ink">{{ fmt(m.meta_anual) }}</span>
          <span v-if="m.motivo" class="text-slate-400">— {{ m.motivo }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
