<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { registroService } from '../services/registroService'
import logo from '../assets/images/logo-sedede.png'

const route = useRoute()
const router = useRouter()

// Pestaña activa: 'comunidad' | 'deportista' | 'asociacion' | 'club'
const currentTab = ref('comunidad')

// Catálogos
const catalogos = reactive({
  asociaciones: [],
  clubes: [],
  municipios: [],
})

const isLoadingCatalogos = ref(true)
const isSubmitting = ref(false)
const submitSuccess = ref(null)
const submitError = ref(null)

// ----------------------------------------------------
// FORMULARIO 1: COMUNIDAD RURAL / MANCOMUNIDAD (Tarea 5)
// ----------------------------------------------------
const formComunidad = reactive({
  nombre: '',
  nit: '',
  sigla: '',
  municipio_id: '',
  direccion: '',
  telefono: '',
  correo: '',
  representante_nombre: '',
  password: '',
  password_confirm: '',
  documento_file: null,
})

// ----------------------------------------------------
// FORMULARIO 2: DEPORTISTA (Tarea 3)
// ----------------------------------------------------
const formDeportista = reactive({
  nombres: '',
  apellidos: '',
  ci: '',
  expedido: 'CH',
  fecha_nacimiento: '',
  sexo: 'M',
  es_menor_de_edad: false,
  tutor_nombre: '',
  tutor_ci: '',
  tutor_telefono: '',
  disciplina: 'Tenis',
  categoria: 'Junior',
  asociacion_id: '',
  club_id: '',
  telefono: '',
  direccion: '',
  email: '',
  password: '',
  password_confirm: '',
})

// ----------------------------------------------------
// FORMULARIO 3: ASOCIACIÓN DEPARTAMENTAL (Tarea 3)
// ----------------------------------------------------
const formAsociacion = reactive({
  nombre: '',
  sigla: '',
  nit: '',
  personeria_juridica: '',
  fecha_constitucion: '',
  disciplina_principal: 'Tenis',
  tipo_disciplina: 'individual',
  direccion: '',
  telefono: '',
  correo: '',
  representante_nombre: '',
  password: '',
  password_confirm: '',
})

// ----------------------------------------------------
// FORMULARIO 4: CLUB DEPORTIVO (Tarea 3)
// ----------------------------------------------------
const formClub = reactive({
  asociacion_id: '',
  nombre: '',
  sigla: '',
  personeria_juridica: '',
  direccion: '',
  telefono: '',
  email: '',
  presidente_nombre: '',
  password: '',
  password_confirm: '',
})

// Disciplinas disponibles
const disciplinasDisponibles = [
  'Atletismo',
  'Baloncesto',
  'Fútbol',
  'Fútbol de Salón',
  'Natación',
  'Tenis',
  'Voleibol',
  'Ciclismo',
  'Boxeo',
  'Gimnasia',
  'Taekwondo',
  'Judo',
  'Ajedrez',
  'Pelota de Mano',
  'Raquetbol',
]

// Expedidos CI
const expedidosCI = ['CH', 'LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'BE', 'PD']

// Filtrar clubes por la asociación seleccionada en el formulario de deportista
const clubesFiltrados = computed(() => {
  if (!formDeportista.asociacion_id) return catalogos.clubes
  return catalogos.clubes.filter(
    (c) => String(c.asociacion_id) === String(formDeportista.asociacion_id)
  )
})

// Cálculo de edad para autodetección de menor de edad
function calcularEdad(fechaStr) {
  if (!fechaStr) return null
  let y, m, d
  if (fechaStr.includes('-')) {
    const parts = fechaStr.split('-')
    y = parseInt(parts[0], 10)
    m = parseInt(parts[1], 10) - 1
    d = parseInt(parts[2], 10)
  } else if (fechaStr.includes('/')) {
    const parts = fechaStr.split('/')
    d = parseInt(parts[0], 10)
    m = parseInt(parts[1], 10) - 1
    y = parseInt(parts[2], 10)
  } else {
    return null
  }
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - y
  const mesActual = hoy.getMonth()
  const diaActual = hoy.getDate()
  if (mesActual < m || (mesActual === m && diaActual < d)) {
    edad--
  }
  return edad >= 0 ? edad : null
}

const edadDeportista = computed(() => calcularEdad(formDeportista.fecha_nacimiento))
const esMenorCalculado = computed(() => {
  const edad = edadDeportista.value
  return edad !== null && edad < 18
})

// Observador para desplegar el apartado de tutor automáticamente cuando sea menor de edad
watch(
  () => formDeportista.fecha_nacimiento,
  (nuevaFecha) => {
    const edad = calcularEdad(nuevaFecha)
    if (edad !== null) {
      if (edad < 18) {
        formDeportista.es_menor_de_edad = true
      } else {
        formDeportista.es_menor_de_edad = false
      }
    }
  }
)

// Manejo de carga de documento
function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      submitError.value = 'El archivo supera el tamaño máximo de 10 MB.'
      e.target.value = null
      return
    }
    formComunidad.documento_file = file
    submitError.value = null
  }
}

// Cargar catálogos
async function loadCatalogos() {
  isLoadingCatalogos.value = true
  try {
    const data = await registroService.getCatalogos()
    catalogos.asociaciones = data.asociaciones || []
    catalogos.clubes = data.clubes || []
    catalogos.municipios = data.municipios || []
    if (catalogos.asociaciones.length > 0 && !formClub.asociacion_id) {
      formClub.asociacion_id = catalogos.asociaciones[0].id
    }
  } catch (err) {
    console.error('Error cargando catálogos:', err)
  } finally {
    isLoadingCatalogos.value = false
  }
}

// Inicialización según ruta o query
onMounted(() => {
  if (route.params.tipo) {
    currentTab.value = route.params.tipo
  } else if (route.query.tipo) {
    currentTab.value = route.query.tipo
  }
  loadCatalogos()
})

// Cambiar pestaña
function setTab(tab) {
  currentTab.value = tab
  submitSuccess.value = null
  submitError.value = null
}

// Enviar Registro de Comunidad
async function submitComunidad() {
  if (formComunidad.password !== formComunidad.password_confirm) {
    submitError.value = 'Las contraseñas ingresadas no coinciden.'
    return
  }
  isSubmitting.value = true
  submitError.value = null
  try {
    const fd = new FormData()
    fd.append('nombre', formComunidad.nombre)
    fd.append('nit', formComunidad.nit)
    if (formComunidad.sigla) fd.append('sigla', formComunidad.sigla)
    if (formComunidad.direccion) fd.append('direccion', formComunidad.direccion)
    fd.append('telefono', formComunidad.telefono)
    fd.append('correo', formComunidad.correo)
    fd.append('representante_nombre', formComunidad.representante_nombre)
    fd.append('password', formComunidad.password)
    if (formComunidad.documento_file) {
      fd.append('documento_adjunto', formComunidad.documento_file)
    }

    const res = await registroService.registrarComunidad(fd)
    submitSuccess.value = {
      title: '¡Registro de Comunidad Recibido!',
      message: res.message || 'Su solicitud comunitaria ha sido registrada. Podrá iniciar sesión una vez validado su expediente.',
      email: formComunidad.correo,
    }
  } catch (err) {
    submitError.value = err.response?.data?.message || err.response?.data?.error || 'Error al procesar el registro comunal.'
  } finally {
    isSubmitting.value = false
  }
}

// Enviar Registro de Deportista
async function submitDeportista() {
  if (formDeportista.password !== formDeportista.password_confirm) {
    submitError.value = 'Las contraseñas ingresadas no coinciden.'
    return
  }
  isSubmitting.value = true
  submitError.value = null
  try {
    const isMinor = Boolean(formDeportista.es_menor_de_edad || esMenorCalculado.value)
    const payload = {
      nombres: formDeportista.nombres,
      apellidos: formDeportista.apellidos,
      ci: formDeportista.ci,
      expedido: formDeportista.expedido,
      fecha_nacimiento: formDeportista.fecha_nacimiento,
      sexo: formDeportista.sexo,
      disciplina: formDeportista.disciplina,
      categoria: formDeportista.categoria,
      asociacion_id: formDeportista.asociacion_id || null,
      club_id: formDeportista.club_id || null,
      telefono: formDeportista.telefono,
      direccion: formDeportista.direccion || 'Chuquisaca',
      email: formDeportista.email,
      password: formDeportista.password,
      es_menor_de_edad: isMinor,
      tutor_nombre: isMinor ? formDeportista.tutor_nombre : null,
      tutor_ci: isMinor ? formDeportista.tutor_ci : null,
      tutor_telefono: isMinor ? formDeportista.tutor_telefono : null,
    }

    const res = await registroService.registrarDeportista(payload)
    submitSuccess.value = {
      title: '¡Registro de Deportista Exitoso!',
      message: res.message || 'Tu cuenta ha sido creada. Ya puedes iniciar sesión con tu correo.',
      email: formDeportista.email,
    }
  } catch (err) {
    submitError.value = err.response?.data?.message || err.response?.data?.error || 'Error al procesar el registro de deportista.'
  } finally {
    isSubmitting.value = false
  }
}

// Enviar Registro de Asociación
async function submitAsociacion() {
  if (formAsociacion.password !== formAsociacion.password_confirm) {
    submitError.value = 'Las contraseñas ingresadas no coinciden.'
    return
  }
  isSubmitting.value = true
  submitError.value = null
  try {
    const payload = {
      nombre: formAsociacion.nombre,
      sigla: formAsociacion.sigla,
      nit: formAsociacion.nit,
      personeria_juridica: formAsociacion.personeria_juridica,
      fecha_constitucion: formAsociacion.fecha_constitucion || null,
      disciplina_principal: formAsociacion.disciplina_principal,
      tipo_disciplina: formAsociacion.tipo_disciplina,
      direccion: formAsociacion.direccion || 'Sucre',
      telefono: formAsociacion.telefono,
      correo: formAsociacion.correo,
      representante_nombre: formAsociacion.representante_nombre,
      password: formAsociacion.password,
    }

    const res = await registroService.registrarAsociacion(payload)
    submitSuccess.value = {
      title: '¡Registro de Asociación Departamental Recibido!',
      message: res.message || 'La información fue enviada para validación y habilitación legal por parte del SEDEDE.',
      email: formAsociacion.correo,
    }
  } catch (err) {
    submitError.value = err.response?.data?.message || err.response?.data?.error || 'Error al registrar la asociación.'
  } finally {
    isSubmitting.value = false
  }
}

// Enviar Registro de Club
async function submitClub() {
  if (formClub.password !== formClub.password_confirm) {
    submitError.value = 'Las contraseñas ingresadas no coinciden.'
    return
  }
  isSubmitting.value = true
  submitError.value = null
  try {
    const payload = {
      asociacion_id: parseInt(formClub.asociacion_id, 10),
      nombre: formClub.nombre,
      sigla: formClub.sigla,
      personeria_juridica: formClub.personeria_juridica || 'En Trámite',
      direccion: formClub.direccion || 'Sucre',
      telefono: formClub.telefono,
      email: formClub.email,
      presidente_nombre: formClub.presidente_nombre,
      password: formClub.password,
    }

    const res = await registroService.registrarClub(payload)
    submitSuccess.value = {
      title: '¡Registro de Club Deportivo Exitoso!',
      message: res.message || 'El club ha sido registrado y su afiliación será validada por la Asociación Departamental correspondiente.',
      email: formClub.email,
    }
  } catch (err) {
    submitError.value = err.response?.data?.message || err.response?.data?.error || 'Error al registrar el club deportivo.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-900/95 py-10 px-4 sm:px-6 lg:px-8 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
    <!-- Encabezado con logo y navegación -->
    <div class="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <router-link to="/" class="flex items-center gap-3 group">
        <div class="h-11 w-11 rounded-xl bg-white/10 p-2 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all flex items-center justify-center">
          <img :src="logo" alt="Logo SEDEDE" class="h-full w-full object-contain" />
        </div>
        <div>
          <span class="font-display font-bold text-lg text-white block">SEDEDE Chuquisaca</span>
          <span class="text-xs text-brand-400 font-medium">Portal de Registro Institucional</span>
        </div>
      </router-link>

      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400">¿Ya tienes cuenta?</span>
        <router-link
          to="/login"
          class="rounded-lg bg-brand-600 hover:bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Acceder al Sistema</span>
          <span>→</span>
        </router-link>
      </div>
    </div>

    <div class="max-w-4xl mx-auto">
      <!-- Selector de Tipo de Registro (4 opciones diferenciadas) -->
      <div class="text-center mb-8">
        <h1 class="text-2xl sm:text-3xl font-display font-extrabold text-white">
          Registro Único en el Sistema Deportivo
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Seleccione la categoría correspondiente para iniciar su registro oficial con su formulario específico.
        </p>

        <!-- Selector de pestañas -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 backdrop-blur-md">
          <button
            type="button"
            @click="setTab('comunidad')"
            :class="[
              'flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-bold transition-all gap-1.5',
              currentTab === 'comunidad'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            ]"
          >
            <span class="text-lg">🏛️</span>
            <span>Comunidades</span>
          </button>

          <button
            type="button"
            @click="setTab('deportista')"
            :class="[
              'flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-bold transition-all gap-1.5',
              currentTab === 'deportista'
                ? 'bg-cyan-500 text-slate-950 shadow-lg font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            ]"
          >
            <span class="text-lg">🏃</span>
            <span>Deportistas</span>
          </button>

          <button
            type="button"
            @click="setTab('asociacion')"
            :class="[
              'flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-bold transition-all gap-1.5',
              currentTab === 'asociacion'
                ? 'bg-emerald-500 text-slate-950 shadow-lg font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            ]"
          >
            <span class="text-lg">🏆</span>
            <span>Asociaciones</span>
          </button>

          <button
            type="button"
            @click="setTab('club')"
            :class="[
              'flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-bold transition-all gap-1.5',
              currentTab === 'club'
                ? 'bg-indigo-500 text-white shadow-lg font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            ]"
          >
            <span class="text-lg">⚽</span>
            <span>Clubes</span>
          </button>
        </div>
      </div>

      <!-- Pantalla de Éxito -->
      <div v-if="submitSuccess" class="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md p-8 text-center space-y-4 shadow-2xl">
        <div class="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl border border-emerald-500/40">
          ✓
        </div>
        <h3 class="text-xl font-bold font-display text-emerald-300">
          {{ submitSuccess.title }}
        </h3>
        <p class="text-sm text-emerald-100/90 max-w-lg mx-auto">
          {{ submitSuccess.message }}
        </p>
        <div class="p-3 bg-slate-900/60 rounded-xl inline-block border border-emerald-500/20 text-xs text-slate-300">
          Cuenta vinculada: <strong class="text-emerald-400">{{ submitSuccess.email }}</strong>
        </div>
        <div class="pt-4 flex items-center justify-center gap-3">
          <router-link
            to="/login"
            class="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 text-xs font-bold shadow-lg transition-all"
          >
            Ir a Iniciar Sesión →
          </router-link>
          <button
            type="button"
            @click="submitSuccess = null"
            class="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 text-xs font-semibold"
          >
            Registrar Otro
          </button>
        </div>
      </div>

      <!-- Contenedor Principal del Formulario -->
      <div v-else class="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        <!-- Error Alert -->
        <div v-if="submitError" class="mb-6 rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-xs font-semibold text-rose-200 flex items-center gap-3">
          <span class="text-rose-400 text-lg">⚠️</span>
          <span>{{ submitError }}</span>
        </div>

        <!-- ================================================================= -->
        <!-- FORMULARIO 1: COMUNIDADES RURALES / MANCOMUNIDADES (TAREA 5)      -->
        <!-- ================================================================= -->
        <div v-if="currentTab === 'comunidad'" class="space-y-6">
          <div class="border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>🏛️ Formulario Oficial</span>
              <span>•</span>
              <span>Comunidades Rurales & Mancomunidades</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-1">
              Registro Comunitario para Solicitud de Materiales y Apoyo
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Permite a las comunidades rurales acreditarse ante el SEDEDE Chuquisaca para solicitar materiales del inventario oficial y apoyos deportivos.
            </p>
          </div>

          <form @submit.prevent="submitComunidad" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Nombre de la Comunidad o Mancomunidad *</label>
                <input
                  v-model="formComunidad.nombre"
                  required
                  type="text"
                  placeholder="Ej: Comunidad Rural San Juan de Tarabuco"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">NIT o Código de Identificación Comunal *</label>
                <input
                  v-model="formComunidad.nit"
                  required
                  type="text"
                  placeholder="Ej: 9876543015"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Sigla / Abreviatura</label>
                <input
                  v-model="formComunidad.sigla"
                  type="text"
                  placeholder="Ej: CRSJ"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Municipio / Provincia *</label>
                <input
                  v-model="formComunidad.direccion"
                  required
                  type="text"
                  placeholder="Ej: Tarabuco, Yamparáez"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Teléfono o Celular de Contacto *</label>
                <input
                  v-model="formComunidad.telefono"
                  required
                  type="text"
                  placeholder="Ej: +591 71234567"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="rounded-2xl bg-slate-800/50 p-4 border border-slate-700/60 space-y-4">
              <h4 class="font-bold text-slate-200 flex items-center gap-2">
                <span>👤 Autoridad Comunal & Credenciales de Acceso</span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Nombre Completo de la Autoridad Comunal *</label>
                  <input
                    v-model="formComunidad.representante_nombre"
                    required
                    type="text"
                    placeholder="Ej: Mallku / Corregidor Pedro Quispe"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Correo Electrónico (Usuario de Acceso) *</label>
                  <input
                    v-model="formComunidad.correo"
                    required
                    type="email"
                    placeholder="comunidad@ejemplo.com"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Contraseña de Acceso *</label>
                  <input
                    v-model="formComunidad.password"
                    required
                    type="password"
                    minlength="6"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Confirmar Contraseña *</label>
                  <input
                    v-model="formComunidad.password_confirm"
                    required
                    type="password"
                    minlength="6"
                    placeholder="Repita la contraseña"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">
                  Acta de Elección, Posesión Comunal o Personería (PDF o Imagen)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  @change="onFileChange"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-950 hover:file:bg-amber-400"
                />
                <p class="text-[11px] text-slate-500 mt-1">
                  Documento de respaldo que acredita a la autoridad comunal ante el SEDEDE.
                </p>
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>{{ isSubmitting ? 'Registrando Comunidad...' : 'Completar Registro de Comunidad' }}</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>

        <!-- ================================================================= -->
        <!-- FORMULARIO 2: DEPORTISTAS (TAREA 3)                              -->
        <!-- ================================================================= -->
        <div v-else-if="currentTab === 'deportista'" class="space-y-6">
          <div class="border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <span>🏃 Formulario Oficial</span>
              <span>•</span>
              <span>Atletas y Deportistas Federados / Afiliados</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-1">
              Registro Individual de Deportista
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Filiación en el Registro Departamental de Deportistas para participar en torneos oficiales, rankings y solicitudes de apoyo.
            </p>
          </div>

          <form @submit.prevent="submitDeportista" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Nombres *</label>
                <input
                  v-model="formDeportista.nombres"
                  required
                  type="text"
                  placeholder="Ej: Marcelo"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Apellidos *</label>
                <input
                  v-model="formDeportista.apellidos"
                  required
                  type="text"
                  placeholder="Ej: Martins Moreno"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="col-span-2 sm:col-span-2 flex gap-2">
                <div class="flex-1">
                  <label class="block font-semibold text-slate-300 mb-1">Cédula de Identidad (CI) *</label>
                  <input
                    v-model="formDeportista.ci"
                    required
                    type="text"
                    placeholder="Ej: 7894561"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div class="w-24">
                  <label class="block font-semibold text-slate-300 mb-1">Expedido</label>
                  <select
                    v-model="formDeportista.expedido"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                  >
                    <option v-for="exp in expedidosCI" :key="exp" :value="exp">{{ exp }}</option>
                  </select>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-semibold text-slate-300">Fecha de Nacimiento *</label>
                  <span
                    v-if="edadDeportista !== null"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
                    :class="esMenorCalculado 
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs' 
                      : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'"
                  >
                    <span>{{ esMenorCalculado ? '👶 Menor de Edad' : '👤 Mayor de Edad' }}</span>
                    <span>({{ edadDeportista }} años)</span>
                  </span>
                </div>
                <input
                  v-model="formDeportista.fecha_nacimiento"
                  required
                  type="date"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Sexo *</label>
                <select
                  v-model="formDeportista.sexo"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <!-- Disciplina y Afiliación -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Disciplina Deportiva *</label>
                <select
                  v-model="formDeportista.disciplina"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option v-for="d in disciplinasDisponibles" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Asociación Departamental</label>
                <select
                  v-model="formDeportista.asociacion_id"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">(Sin asociación directa)</option>
                  <option v-for="a in catalogos.asociaciones" :key="a.id" :value="a.id">
                    {{ a.nombre }} ({{ a.sigla }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Club Deportivo de Afiliación</label>
                <select
                  v-model="formDeportista.club_id"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">(Sin club afiliado)</option>
                  <option v-for="c in clubesFiltrados" :key="c.id" :value="c.id">
                    {{ c.nombre }} ({{ c.sigla }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Apartado de Tutor Legal (Desplegado automáticamente al detectar menor de edad) -->
            <div
              v-if="formDeportista.es_menor_de_edad || esMenorCalculado"
              class="rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900/95 p-5 space-y-4 shadow-xl ring-1 ring-amber-500/20 transition-all duration-300"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/25 pb-3">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">🛡️</span>
                  <div>
                    <h4 class="font-bold text-amber-300 text-xs flex items-center gap-2">
                      <span>Apartado Obligatorio: Tutor Legal o Apoderado</span>
                      <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-black border border-amber-500/40">
                        {{ edadDeportista !== null ? `${edadDeportista} Años (Menor de Edad)` : 'Menor de Edad' }}
                      </span>
                    </h4>
                    <p class="text-[11px] text-amber-200/80 mt-0.5">
                      Desplegado automáticamente según la fecha de nacimiento. Todo deportista menor de 18 años requiere datos y autorización de su tutor legal acreditado.
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                    ✓ Requerido por Ley
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Nombre Completo del Tutor *</label>
                  <input
                    v-model="formDeportista.tutor_nombre"
                    :required="formDeportista.es_menor_de_edad || esMenorCalculado"
                    type="text"
                    placeholder="Ej: Marcelo Martins Padre"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Cédula de Identidad (CI) Tutor *</label>
                  <input
                    v-model="formDeportista.tutor_ci"
                    :required="formDeportista.es_menor_de_edad || esMenorCalculado"
                    type="text"
                    placeholder="Ej: 3456789 CH"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Teléfono / WhatsApp Tutor *</label>
                  <input
                    v-model="formDeportista.tutor_telefono"
                    :required="formDeportista.es_menor_de_edad || esMenorCalculado"
                    type="text"
                    placeholder="Ej: +591 76543210"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Opción si es mayor de 18 años pero requiere tutor voluntario -->
            <div v-else class="rounded-xl border border-slate-700/80 bg-slate-800/40 p-3 flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="formDeportista.es_menor_de_edad"
                  class="rounded text-cyan-500 focus:ring-0 h-4 w-4 bg-slate-900 border-slate-700"
                />
                <span class="font-semibold text-slate-300 text-xs">Acreditar tutor o representante legal adicional</span>
              </label>
              <span class="text-[11px] text-slate-500 hidden sm:inline">
                (El formulario de tutor se desplegará de forma automática si la fecha indica menor de 18 años)
              </span>
            </div>

            <!-- Contacto y Credenciales -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                <input
                  v-model="formDeportista.telefono"
                  required
                  type="text"
                  placeholder="Ej: +591 72345678"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Correo Electrónico (Para Iniciar Sesión) *</label>
                <input
                  v-model="formDeportista.email"
                  required
                  type="email"
                  placeholder="atleta@ejemplo.com"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Contraseña *</label>
                <input
                  v-model="formDeportista.password"
                  required
                  type="password"
                  minlength="6"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Confirmar Contraseña *</label>
                <input
                  v-model="formDeportista.password_confirm"
                  required
                  type="password"
                  minlength="6"
                  placeholder="Repita la contraseña"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>{{ isSubmitting ? 'Registrando Deportista...' : 'Completar Registro de Deportista' }}</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>

        <!-- ================================================================= -->
        <!-- FORMULARIO 3: ASOCIACIONES DEPARTAMENTALES (TAREA 3)             -->
        <!-- ================================================================= -->
        <div v-else-if="currentTab === 'asociacion'" class="space-y-6">
          <div class="border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span>🏆 Formulario Oficial</span>
              <span>•</span>
              <span>Asociaciones Deportivas Departamentales</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-1">
              Registro de Asociación Departamental de Chuquisaca
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Registro institucional de la directiva y personería para gestión del POA, calendarios anuales, torneos y asignación de escenarios.
            </p>
          </div>

          <form @submit.prevent="submitAsociacion" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Nombre Oficial de la Asociación *</label>
                <input
                  v-model="formAsociacion.nombre"
                  required
                  type="text"
                  placeholder="Ej: Asociación Departamental de Tenis de Chuquisaca"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Sigla *</label>
                <input
                  v-model="formAsociacion.sigla"
                  required
                  type="text"
                  placeholder="Ej: ADTC"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">NIT Oficial *</label>
                <input
                  v-model="formAsociacion.nit"
                  required
                  type="text"
                  placeholder="Ej: 1020304050"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Nº Resolución Personería Jurídica *</label>
                <input
                  v-model="formAsociacion.personeria_juridica"
                  required
                  type="text"
                  placeholder="Ej: RAP-045/2019"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Disciplina *</label>
                <select
                  v-model="formAsociacion.tipo_disciplina"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none font-bold"
                >
                  <option value="individual">Individual</option>
                  <option value="conjunto">Conjunto</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Disciplina Principal Federada *</label>
                <select
                  v-model="formAsociacion.disciplina_principal"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none font-bold"
                >
                  <option v-for="d in disciplinasDisponibles" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Teléfono Institucional *</label>
                <input
                  v-model="formAsociacion.telefono"
                  required
                  type="text"
                  placeholder="Ej: +591 4 6451234"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="rounded-2xl bg-slate-800/50 p-4 border border-slate-700/60 space-y-4">
              <h4 class="font-bold text-slate-200">👤 Representante Legal & Credenciales</h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Nombre del Presidente / Representante *</label>
                  <input
                    v-model="formAsociacion.representante_nombre"
                    required
                    type="text"
                    placeholder="Ej: Lic. Carlos Miranda"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Correo Institucional (Acceso al Sistema) *</label>
                  <input
                    v-model="formAsociacion.correo"
                    required
                    type="email"
                    placeholder="asociacion@ejemplo.com"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Contraseña *</label>
                  <input
                    v-model="formAsociacion.password"
                    required
                    type="password"
                    minlength="6"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Confirmar Contraseña *</label>
                  <input
                    v-model="formAsociacion.password_confirm"
                    required
                    type="password"
                    minlength="6"
                    placeholder="Repita la contraseña"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>{{ isSubmitting ? 'Registrando Asociación...' : 'Completar Registro de Asociación' }}</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>

        <!-- ================================================================= -->
        <!-- FORMULARIO 4: CLUBES DEPORTIVOS (TAREA 3)                        -->
        <!-- ================================================================= -->
        <div v-else-if="currentTab === 'club'" class="space-y-6">
          <div class="border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <span>⚽ Formulario Oficial</span>
              <span>•</span>
              <span>Clubes Deportivos Afiliados</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-1">
              Registro y Afiliación de Club Deportivo
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Inscripción de personería y directiva de clubes para afiliar deportistas y postular a competencias oficiales.
            </p>
          </div>

          <form @submit.prevent="submitClub" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Asociación Departamental a la que se Afilia *</label>
              <select
                v-model="formClub.asociacion_id"
                required
                class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none font-bold"
              >
                <option value="" disabled>Seleccione una Asociación...</option>
                <option v-for="a in catalogos.asociaciones" :key="a.id" :value="a.id">
                  {{ a.nombre }} ({{ a.sigla }})
                </option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Nombre Oficial del Club Deportivo *</label>
                <input
                  v-model="formClub.nombre"
                  required
                  type="text"
                  placeholder="Ej: Club Deportivo Fancesa"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Sigla *</label>
                <input
                  v-model="formClub.sigla"
                  required
                  type="text"
                  placeholder="Ej: FNC"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Personería Jurídica / Registro</label>
                <input
                  v-model="formClub.personeria_juridica"
                  type="text"
                  placeholder="Ej: Res. Prefectural 112/08"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Sede / Cancha habitual</label>
                <input
                  v-model="formClub.direccion"
                  type="text"
                  placeholder="Ej: Barrio San José, Sucre"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Teléfono o Celular *</label>
                <input
                  v-model="formClub.telefono"
                  required
                  type="text"
                  placeholder="Ej: +591 74567890"
                  class="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="rounded-2xl bg-slate-800/50 p-4 border border-slate-700/60 space-y-4">
              <h4 class="font-bold text-slate-200">👤 Directorio / Presidente & Credenciales</h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Nombre del Presidente / Delegado *</label>
                  <input
                    v-model="formClub.presidente_nombre"
                    required
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Correo Electrónico (Acceso del Club) *</label>
                  <input
                    v-model="formClub.email"
                    required
                    type="email"
                    placeholder="club@ejemplo.com"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Contraseña *</label>
                  <input
                    v-model="formClub.password"
                    required
                    type="password"
                    minlength="6"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Confirmar Contraseña *</label>
                  <input
                    v-model="formClub.password_confirm"
                    required
                    type="password"
                    minlength="6"
                    placeholder="Repita la contraseña"
                    class="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-3 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>{{ isSubmitting ? 'Registrando Club...' : 'Completar Registro de Club' }}</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
