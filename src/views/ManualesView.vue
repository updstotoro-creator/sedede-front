<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { AUTORES_CONTRIBUCION } from '../config/institucional'
import ManualPoa from '../components/manuales/ManualPoa.vue'
import ManualFinanciero from '../components/manuales/ManualFinanciero.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Pestaña activa: 'registro' | 'reservas' | 'poa' | 'financiero' | 'soporte'
const activeTab = ref('registro')

// Las guías del POA y del Tarifario son internas: solo las ve quien entra a esos
// módulos, con los mismos roles que el router exige para sus rutas.
const puedeVer = (nombreRuta) => {
  const rol = auth.user?.role?.nombre
  return !!rol && (router.resolve({ name: nombreRuta }).meta.roles ?? []).includes(rol)
}
const veManualPoa = computed(() => puedeVer('dashboard-poa'))
const veManualFinanciero = computed(() => puedeVer('dashboard-tarifario'))
const numeroFinanciero = computed(() => (veManualPoa.value ? 4 : 3))
const numeroSoporte = computed(() => 3 + Number(veManualPoa.value) + Number(veManualFinanciero.value))

// Simulador interactivo de tarifas de reserva
const simEscenario = ref('estadio_patria')
const simTurno = ref('dia')
const simTipoUsuario = ref('particular')
const simHoras = ref(2)

const tarifasBase = {
  estadio_patria: { nombre: 'Estadio Patria (Cancha Principal)', baseDia: 150, baseNoche: 280, cessa: 50 },
  coliseo_jra: { nombre: 'Coliseo Jorge Revilla Aldana', baseDia: 100, baseNoche: 180, cessa: 35 },
  coliseo_tito: { nombre: 'Coliseo Tito Alfred', baseDia: 80, baseNoche: 140, cessa: 25 },
  tercera_fase: { nombre: 'Coliseo Tercera Fase (Voleibol/Gimnasia)', baseDia: 80, baseNoche: 140, cessa: 25 },
  polideportivo_urquizu: { nombre: 'Polideportivo Esteban Urquizu', baseDia: 90, baseNoche: 160, cessa: 30 },
  tenis_madona: { nombre: 'Complejo de Tenis La Madona', baseDia: 50, baseNoche: 90, cessa: 20 },
}

const calculoSimulado = computed(() => {
  const esc = tarifasBase[simEscenario.value] || tarifasBase.estadio_patria
  let tarifaHora = simTurno.value === 'noche' ? esc.baseNoche : esc.baseDia

  // Descuento asociacionista / club
  let descuento = 0
  if (simTipoUsuario.value === 'club_asociacion') {
    descuento = 0.30 // 30% descuento preferencial
  }

  const subtotal = (tarifaHora * simHoras.value) * (1 - descuento)
  const recargoCessa = simTurno.value === 'noche' ? (esc.cessa * simHoras.value) : 0
  const total = subtotal + recargoCessa

  return {
    escenario: esc.nombre,
    subtotal: subtotal.toFixed(2),
    recargoCessa: recargoCessa.toFixed(2),
    total: total.toFixed(2),
    tieneDescuento: descuento > 0,
  }
})

onMounted(() => {
  const visibles = ['registro', 'reservas', 'soporte']
  if (veManualPoa.value) visibles.push('poa')
  if (veManualFinanciero.value) visibles.push('financiero')
  if (route.query.tab && visibles.includes(route.query.tab)) {
    activeTab.value = route.query.tab
  }
})

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function imprimirManual() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <!-- Encabezado Institucional Limpio (Sin pestañas horizontales superiores) -->
    <header class="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white shadow-md border-b border-brand-950/20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="space-y-1.5">
            <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold text-brand-100 backdrop-blur-xs">
              <span>🏛️ SEDEDE CHUQUISACA</span>
              <span>·</span>
              <span>GUÍAS Y MANUALES OPERATIVOS</span>
            </div>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Centro de Ayuda y Manuales del Sistema
            </h1>
            <p class="text-xs sm:text-sm text-brand-100 max-w-2xl leading-relaxed">
              Guías operativas paso a paso para el registro de deportistas en el RUN, acreditación de clubes y reserva formal de escenarios deportivos departamentales.
            </p>
          </div>

          <!-- Acciones de Navegación Rápida -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              @click="imprimirManual"
              class="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold transition shadow-xs text-white"
              title="Imprimir o guardar como PDF"
            >
              <span>🖨️</span>
              <span>Imprimir / Guardar PDF</span>
            </button>
            <router-link
              :to="auth.user ? '/dashboard' : '/'"
              class="inline-flex items-center gap-1.5 rounded-xl bg-white text-brand-900 hover:bg-brand-50 px-3.5 py-2 text-xs font-bold transition shadow-sm"
            >
              <span>➔</span>
              <span>{{ auth.user ? 'Volver al Panel' : 'Volver al Inicio' }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Contenedor Principal: Layout de 2 Columnas (Navbar Lateral Izquierda + Contenido) -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8 items-start">
        
        <!-- ============================================================= -->
        <!-- NAVBAR LATERAL IZQUIERDA: NAVEGADOR DE MANUALES               -->
        <!-- ============================================================= -->
        <aside class="w-full lg:w-80 shrink-0 sticky top-4 z-10 space-y-4">
          <!-- Tarjeta de Menú Principal -->
          <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <!-- Encabezado del Navegador Lateral -->
            <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-brand-700">ÍNDICE DE GUÍAS</p>
                <h3 class="font-display text-sm font-bold text-slate-900">Manuales de Usuario</h3>
              </div>
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-bold shadow-2xs">
                📖
              </span>
            </div>

            <!-- Lista Vertical de Pestañas con Diseño Nítido -->
            <nav class="space-y-2.5">
              <!-- Botón 1: Manual de Registro -->
              <div>
                <button
                  type="button"
                  @click="setTab('registro')"
                  class="w-full text-left rounded-xl p-3 transition-all flex items-start gap-3 border"
                  :class="activeTab === 'registro' 
                    ? 'bg-blue-50/90 border-blue-400 text-blue-950 shadow-xs ring-1 ring-blue-300' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base shadow-2xs transition-colors"
                    :class="activeTab === 'registro' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'">
                    📝
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-bold truncate" :class="activeTab === 'registro' ? 'text-blue-950' : 'text-slate-900'">
                        1. Registro y RUN
                      </p>
                      <span class="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                        :class="activeTab === 'registro' ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-500'">
                        Atletas
                      </span>
                    </div>
                    <p class="text-[11px] leading-snug mt-0.5"
                      :class="activeTab === 'registro' ? 'text-blue-800' : 'text-slate-500'">
                      Padrón único, tutela legal de menores y aprobación Club/Asociación.
                    </p>
                  </div>
                </button>

                <!-- Sub-enlaces de Sección Rápida (Solo cuando Registro está activo) -->
                <div v-if="activeTab === 'registro'" class="mt-2 ml-4 pl-3 border-l-2 border-blue-300 space-y-1.5 text-[11px]">
                  <button @click="scrollToSection('registro-resumen')" class="block w-full text-left text-slate-600 hover:text-blue-700 transition font-medium">
                    • Resumen y Padrón RUN
                  </button>
                  <button @click="scrollToSection('registro-flujograma')" class="block w-full text-left text-slate-600 hover:text-blue-700 transition font-medium">
                    • Flujograma (2 Fases)
                  </button>
                  <button @click="scrollToSection('registro-pasos')" class="block w-full text-left text-slate-600 hover:text-blue-700 transition font-medium">
                    • Instrucciones Paso a Paso
                  </button>
                  <button @click="scrollToSection('registro-menores')" class="block w-full text-left text-amber-800 font-bold hover:text-amber-900 transition">
                    • Menores de Edad & Tutor Legal
                  </button>
                  <button @click="scrollToSection('registro-faq')" class="block w-full text-left text-slate-600 hover:text-blue-700 transition font-medium">
                    • Preguntas Frecuentes (FAQ)
                  </button>
                </div>
              </div>

              <!-- Botón 2: Manual de Reservas -->
              <div>
                <button
                  type="button"
                  @click="setTab('reservas')"
                  class="w-full text-left rounded-xl p-3 transition-all flex items-start gap-3 border"
                  :class="activeTab === 'reservas' 
                    ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 shadow-xs ring-1 ring-emerald-300' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base shadow-2xs transition-colors"
                    :class="activeTab === 'reservas' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'">
                    🏟️
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-bold truncate" :class="activeTab === 'reservas' ? 'text-emerald-950' : 'text-slate-900'">
                        2. Reserva de Escenarios
                      </p>
                      <span class="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                        :class="activeTab === 'reservas' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'">
                        RAG 011
                      </span>
                    </div>
                    <p class="text-[11px] leading-snug mt-0.5"
                      :class="activeTab === 'reservas' ? 'text-emerald-800' : 'text-slate-500'">
                      Estadio Patria, coliseos, cálculo nocturno CESSA y boletas.
                    </p>
                  </div>
                </button>

                <!-- Sub-enlaces de Sección Rápida (Solo cuando Reservas está activo) -->
                <div v-if="activeTab === 'reservas'" class="mt-2 ml-4 pl-3 border-l-2 border-emerald-300 space-y-1.5 text-[11px]">
                  <button @click="scrollToSection('reservas-resumen')" class="block w-full text-left text-slate-600 hover:text-emerald-700 transition font-medium">
                    • Resolución RAG 011/2024
                  </button>
                  <button @click="scrollToSection('reservas-catalogo')" class="block w-full text-left text-slate-600 hover:text-emerald-700 transition font-medium">
                    • Catálogo de Escenarios
                  </button>
                  <button @click="scrollToSection('reservas-pasos')" class="block w-full text-left text-slate-600 hover:text-emerald-700 transition font-medium">
                    • Procedimiento de Reserva
                  </button>
                  <button @click="scrollToSection('reservas-simulador')" class="block w-full text-left text-emerald-800 font-bold hover:text-emerald-900 transition">
                    • Simulador de Tarifas en Vivo
                  </button>
                </div>
              </div>

              <!-- Guía interna: Interno (solo roles con acceso al módulo) -->
              <div v-if="veManualPoa">
                <button
                  type="button"
                  @click="setTab('poa')"
                  class="w-full text-left rounded-xl p-3 transition-all flex items-start gap-3 border"
                  :class="activeTab === 'poa'
                    ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 shadow-xs ring-1 ring-indigo-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base shadow-2xs transition-colors"
                    :class="activeTab === 'poa' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'">
                    📊
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-bold truncate" :class="activeTab === 'poa' ? 'text-indigo-950' : 'text-slate-900'">
                        3. Plan Operativo Anual
                      </p>
                      <span class="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                        :class="activeTab === 'poa' ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-100 text-slate-500'">
                        Interno
                      </span>
                    </div>
                    <p class="text-[11px] leading-snug mt-0.5"
                      :class="activeTab === 'poa' ? 'text-indigo-800' : 'text-slate-500'">
                      Formular, aprobar y dar seguimiento al POA con semáforo.
                    </p>
                  </div>
                </button>

                <div v-if="activeTab === 'poa'" class="mt-2 ml-4 pl-3 border-l-2 border-indigo-300 space-y-1.5 text-[11px]">
                  <button @click="scrollToSection('poa-resumen')" class="block w-full text-left text-slate-600 hover:text-indigo-700 transition font-medium">
                    • Resumen y Estructura
                  </button>
                  <button @click="scrollToSection('poa-flujo')" class="block w-full text-left text-slate-600 hover:text-indigo-700 transition font-medium">
                    • Flujo y Estados del Plan
                  </button>
                  <button @click="scrollToSection('poa-pasos')" class="block w-full text-left text-slate-600 hover:text-indigo-700 transition font-medium">
                    • Instrucciones Paso a Paso
                  </button>
                  <button @click="scrollToSection('poa-faq')" class="block w-full text-left text-slate-600 hover:text-indigo-700 transition font-medium">
                    • Preguntas Frecuentes (FAQ)
                  </button>
                  <button @click="scrollToSection('poa-glosario')" class="block w-full text-left text-slate-600 hover:text-indigo-700 transition font-medium">
                    • Glosario
                  </button>
                </div>
              </div>

              <!-- Guía interna: Interno (solo roles con acceso al módulo) -->
              <div v-if="veManualFinanciero">
                <button
                  type="button"
                  @click="setTab('financiero')"
                  class="w-full text-left rounded-xl p-3 transition-all flex items-start gap-3 border"
                  :class="activeTab === 'financiero'
                    ? 'bg-sky-50/90 border-sky-400 text-sky-950 shadow-xs ring-1 ring-sky-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base shadow-2xs transition-colors"
                    :class="activeTab === 'financiero' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'">
                    💵
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-bold truncate" :class="activeTab === 'financiero' ? 'text-sky-950' : 'text-slate-900'">
                        {{ numeroFinanciero }}. Financiero: Tarifario
                      </p>
                      <span class="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                        :class="activeTab === 'financiero' ? 'bg-sky-200 text-sky-900' : 'bg-slate-100 text-slate-500'">
                        Interno
                      </span>
                    </div>
                    <p class="text-[11px] leading-snug mt-0.5"
                      :class="activeTab === 'financiero' ? 'text-sky-800' : 'text-slate-500'">
                      Liquidaciones, cobro con recibo oficial y exenciones.
                    </p>
                  </div>
                </button>

                <div v-if="activeTab === 'financiero'" class="mt-2 ml-4 pl-3 border-l-2 border-sky-300 space-y-1.5 text-[11px]">
                  <button @click="scrollToSection('financiero-resumen')" class="block w-full text-left text-slate-600 hover:text-sky-700 transition font-medium">
                    • Resumen del Tarifario
                  </button>
                  <button @click="scrollToSection('financiero-flujo')" class="block w-full text-left text-slate-600 hover:text-sky-700 transition font-medium">
                    • Flujo de un Ingreso
                  </button>
                  <button @click="scrollToSection('financiero-pasos')" class="block w-full text-left text-slate-600 hover:text-sky-700 transition font-medium">
                    • Instrucciones Paso a Paso
                  </button>
                  <button @click="scrollToSection('financiero-faq')" class="block w-full text-left text-slate-600 hover:text-sky-700 transition font-medium">
                    • Preguntas Frecuentes (FAQ)
                  </button>
                  <button @click="scrollToSection('financiero-glosario')" class="block w-full text-left text-slate-600 hover:text-sky-700 transition font-medium">
                    • Glosario
                  </button>
                </div>
              </div>

              <!-- Botón de Soporte Técnico (siempre al final) -->
              <div>
                <button
                  type="button"
                  @click="setTab('soporte')"
                  class="w-full text-left rounded-xl p-3 transition-all flex items-start gap-3 border"
                  :class="activeTab === 'soporte' 
                    ? 'bg-amber-50/90 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-300' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base shadow-2xs transition-colors"
                    :class="activeTab === 'soporte' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'">
                    🛠️
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-bold truncate" :class="activeTab === 'soporte' ? 'text-amber-950' : 'text-slate-900'">
                        {{ numeroSoporte }}. Soporte y Contacto
                      </p>
                      <span class="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                        :class="activeTab === 'soporte' ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'">
                        9 Devs
                      </span>
                    </div>
                    <p class="text-[11px] leading-snug mt-0.5"
                      :class="activeTab === 'soporte' ? 'text-amber-800' : 'text-slate-500'">
                      Estudiantes UPDS Sucre por contribución con teléfonos directos.
                    </p>
                  </div>
                </button>

                <!-- Sub-enlaces de Sección Rápida (Solo cuando Soporte está activo) -->
                <div v-if="activeTab === 'soporte'" class="mt-2 ml-4 pl-3 border-l-2 border-amber-300 space-y-1.5 text-[11px]">
                  <button @click="scrollToSection('soporte-directorio')" class="block w-full text-left text-slate-600 hover:text-amber-700 transition font-medium">
                    • Directorio Telefónico y WhatsApp
                  </button>
                </div>
              </div>
            </nav>

            <!-- Acciones Rápidas del Sidebar -->
            <div class="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                @click="imprimirManual"
                class="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-bold transition shadow-2xs"
              >
                <span>🖨️</span>
                <span>Imprimir / Guardar PDF</span>
              </button>

              <router-link
                v-if="activeTab === 'registro'"
                to="/registro"
                class="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 text-xs font-bold transition shadow-xs"
              >
                <span>Ir al Formulario RUN</span>
                <span>➔</span>
              </router-link>

              <router-link
                v-else-if="activeTab === 'reservas'"
                to="/reservar"
                class="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 text-xs font-bold transition shadow-xs"
              >
                <span>Ir al Portal de Reservas</span>
                <span>➔</span>
              </router-link>
              <router-link
                v-else-if="activeTab === 'poa' && veManualPoa"
                to="/dashboard/poa/dashboard"
                class="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-2 text-xs font-bold transition shadow-xs"
              >
                <span>Ir al POA</span>
                <span>➔</span>
              </router-link>
              <router-link
                v-else-if="activeTab === 'financiero' && veManualFinanciero"
                to="/dashboard/tarifario"
                class="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white px-3 py-2 text-xs font-bold transition shadow-xs"
              >
                <span>Ir al Tarifario</span>
                <span>➔</span>
              </router-link>
            </div>
          </div>

          <!-- Convenio Institucional UPDS -->
          <div class="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-1.5 shadow-2xs">
            <p class="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <span>🏛️</span>
              <span>Convenio UPDS Sucre</span>
            </p>
            <p class="text-[11px] text-slate-500 leading-snug">
              Desarrollado en el marco del Convenio de Cooperación con la Universidad Privada Domingo Savio — Sede Sucre.
            </p>
          </div>
        </aside>

        <!-- ============================================================= -->
        <!-- CONTENIDO PRINCIPAL DEL MANUAL SELECCIONADO                   -->
        <!-- ============================================================= -->
        <main class="flex-1 min-w-0 space-y-8 w-full">
          <!-- =================================================================== -->
          <!-- PESTAÑA 1: MANUAL DE REGISTRO (DEPORTISTAS, CLUBES, ASOCIACIONES) -->
          <!-- =================================================================== -->
          <section v-if="activeTab === 'registro'" class="space-y-8">
            <!-- Tarjeta de Resumen Rápido -->
            <div id="registro-resumen" class="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="space-y-1">
                  <span class="inline-block rounded-md bg-blue-600 text-white px-2.5 py-0.5 text-xs font-bold uppercase">
                    Padrón RUN y Gobernanza Deportiva
                  </span>
                  <h2 class="text-xl font-bold text-blue-950 font-display">
                    Guía Oficial para el Registro Único de Deportistas (RUN) y Afiliación
                  </h2>
                  <p class="text-xs text-blue-900 leading-relaxed max-w-3xl">
                    El sistema del SEDEDE Chuquisaca cuenta con un padrón unificado que garantiza la legalidad de los atletas, tutela jurídica de menores de edad y un proceso transparente de verificación en dos fases: validación en el Club Deportivo y alta oficial en la Asociación Departamental.
                  </p>
                </div>
                <router-link
                  to="/registro"
                  class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 text-xs sm:text-sm font-bold transition shadow-sm shrink-0"
                >
                  <span>Ir al Registro en Línea</span>
                  <span>➔</span>
                </router-link>
              </div>
            </div>

            <!-- Flujograma Visual de Verificación en 2 Fases -->
            <div id="registro-flujograma" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span>🔄</span>
                <span>Flujograma del Ciclo de Vida del Deportista (2 Fases de Aprobación)</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                <!-- Paso 1 -->
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 relative">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
                  <h4 class="font-bold text-xs text-slate-900">Registro Público RUN</h4>
                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    El atleta (o su tutor si es menor) completa sus datos personales, cédula y selecciona su disciplina deportiva y club.
                  </p>
                  <span class="inline-block rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                    Estado: Pendiente Club
                  </span>
                </div>

                <!-- Paso 2 -->
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-2 relative">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-white text-xs font-bold">2</span>
                  <h4 class="font-bold text-xs text-indigo-950">Fase 1: Visto Bueno del Club</h4>
                  <p class="text-[11px] text-indigo-900 leading-relaxed">
                    El delegado del club revisa al deportista en su portal (`/dashboard/mi-club`) y emite su aprobación de afiliación.
                  </p>
                  <span class="inline-block rounded bg-indigo-100 text-indigo-800 px-2 py-0.5 text-[10px] font-bold">
                    Estado: Pendiente Asociación
                  </span>
                </div>

                <!-- Paso 3 -->
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 relative">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-bold">3</span>
                  <h4 class="font-bold text-xs text-emerald-950">Fase 2: Alta de la Asociación</h4>
                  <p class="text-[11px] text-emerald-900 leading-relaxed">
                    La Asociación Departamental verifica la ficha federativa y formaliza el alta institucional del deportista.
                  </p>
                  <span class="inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    Estado: Alta Aceptada
                  </span>
                </div>

                <!-- Paso 4 -->
                <div class="rounded-xl border border-brand-200 bg-brand-50/70 p-4 space-y-2 relative">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-white text-xs font-bold">4</span>
                  <h4 class="font-bold text-xs text-brand-950">Habilitación SEDEDE</h4>
                  <p class="text-[11px] text-brand-900 leading-relaxed">
                    El atleta ingresa a su portal institucional para postular logros, acumular puntos en el ranking y solicitar pasajes/apoyos.
                  </p>
                  <span class="inline-block rounded bg-brand-100 text-brand-800 px-2 py-0.5 text-[10px] font-bold">
                    Portal Habilitado
                  </span>
                </div>
              </div>
            </div>

            <!-- Guía Detallada Paso a Paso -->
            <div id="registro-pasos" class="space-y-6">
              <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>📋</span>
                <span>Instrucciones Detalladas para el Formulario de Registro</span>
              </h3>

              <!-- Paso 1: Datos Personales -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <div class="flex items-start gap-4">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-sm shadow-xs">
                    1
                  </div>
                  <div class="space-y-2 flex-1">
                    <h4 class="text-sm font-bold text-slate-900">Datos Personales y Cédula de Identidad</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">
                      Ingresa tu nombre completo exactamente como figura en tu cédula de identidad, número de CI y extensión departamental (CH, LP, CB, SC, etc.).
                    </p>
                    <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-1.5">
                      <p class="font-bold text-slate-800">Campos obligatorios requeridos:</p>
                      <ul class="list-disc list-inside space-y-1 text-slate-600">
                        <li><strong>Cédula de Identidad y Expedido:</strong> Clave única para evitar registros duplicados en el departamento.</li>
                        <li><strong>Fecha de Nacimiento:</strong> El sistema calculará tu edad exacta para asignarte a la categoría reglamentaria (Infantil, Juvenil, Mayores, Sénior).</li>
                        <li><strong>Correo Electrónico Oficial:</strong> Será tu usuario para iniciar sesión en el portal del atleta.</li>
                        <li><strong>Contraseña de Acceso:</strong> Mínimo 6 caracteres para proteger tu cuenta y solicitudes de apoyo.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Paso 2: Menores de Edad y Tutor Legal -->
              <div id="registro-menores" class="rounded-2xl border border-amber-300 bg-amber-50/40 p-6 space-y-4">
                <div class="flex items-start gap-4">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white font-extrabold text-sm shadow-xs">
                    2
                  </div>
                  <div class="space-y-2 flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-bold text-amber-950">Protocolo de Protección a Menores de Edad (Tutor Legal)</h4>
                      <span class="rounded bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5">Normativa Legal Obligatoria</span>
                    </div>
                    <p class="text-xs text-amber-900 leading-relaxed">
                      Si la fecha de nacimiento ingresada corresponde a un <strong>menor de 18 años</strong>, el sistema desplegará de forma automática los campos obligatorios del Tutor Legal, en cumplimiento de las leyes de protección integral de niñas, niños y adolescentes del Estado Plurinacional de Bolivia.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div class="rounded-lg bg-white border border-amber-200 p-3">
                        <p class="text-xs font-bold text-amber-950">Nombre Completo del Tutor Legal</p>
                        <p class="text-[11px] text-amber-800 mt-0.5">Nombre del padre, madre o apoderado legal acreditado.</p>
                      </div>
                      <div class="rounded-lg bg-white border border-amber-200 p-3">
                        <p class="text-xs font-bold text-amber-950">C.I. y Teléfono de Contacto</p>
                        <p class="text-[11px] text-amber-800 mt-0.5">Número de teléfono directo para notificaciones de viajes y apoyos.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Paso 3: Selección de Asociación y Club -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <div class="flex items-start gap-4">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-sm shadow-xs">
                    3
                  </div>
                  <div class="space-y-2 flex-1">
                    <h4 class="text-sm font-bold text-slate-900">Selección de Disciplina, Asociación y Club Afiliado</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">
                      Al seleccionar tu disciplina deportiva, el sistema filtrará la <strong>Asociación Departamental</strong> correspondiente (ej. Asociación Departamental de Fútbol, Natación, Voleibol, Atletismo, Baloncesto, Ajedrez, etc.) y mostrará la lista en cascada de los <strong>Clubes Deportivos Oficialmente Afiliados</strong>.
                    </p>
                    <div class="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
                      <p class="font-bold text-slate-800 mb-1">¿Qué pasa si eres deportista independiente?</p>
                      <p class="text-slate-600">
                        Puedes marcar la opción <em>"Independiente / Sin Club"</em> si tu disciplina permite representación directa ante la Asociación o si te encuentras en proceso de incorporación a un nuevo club.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Paso 4: Acreditación y Aprobación en 2 Fases -->
              <div class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <div class="flex items-start gap-4">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-sm shadow-xs">
                    4
                  </div>
                  <div class="space-y-2 flex-1">
                    <h4 class="text-sm font-bold text-slate-900">Verificación y Notificación de Alta</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">
                      Una vez enviado el formulario, tu solicitud quedará visible inmediatamente en el panel de tu Club y posteriormente en el de tu Asociación. Podrás consultar el estado de tu trámite en cualquier momento iniciando sesión con tu correo y contraseña.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preguntas Frecuentes de Registro (FAQ) -->
            <div id="registro-faq" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <span>❓</span>
                <span>Preguntas Frecuentes sobre el Registro de Deportistas</span>
              </h3>

              <div class="space-y-3 text-xs text-slate-700">
                <details class="group rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <summary class="font-bold text-slate-800 cursor-pointer flex items-center justify-between">
                    <span>¿Cuánto tarda la aprobación de mi registro?</span>
                    <span class="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p class="mt-2 text-slate-600 leading-relaxed">
                    El club deportivo revisa las solicitudes semanalmente. Una vez aprobado por el club, la Asociación Departamental valida el registro en un plazo habitual de 24 a 48 horas hábiles.
                  </p>
                </details>

                <!-- PREGUNTA SUSTITUIDA: Aclaración sobre menores de edad requerida por el usuario -->
                <details class="group rounded-xl border border-amber-200 bg-amber-50/50 p-3.5" open>
                  <summary class="font-bold text-amber-950 cursor-pointer flex items-center justify-between">
                    <span class="flex items-center gap-2">
                      <span>👶</span>
                      <span>¿Cómo se realiza el registro si el deportista es menor de edad?</span>
                    </span>
                    <span class="group-open:rotate-180 transition-transform text-amber-800">▼</span>
                  </summary>
                  <div class="mt-2.5 text-slate-700 leading-relaxed space-y-2 border-t border-amber-200/60 pt-2 text-xs">
                    <p>
                      Si tienes menos de <strong>18 años</strong>, el sistema calculará tu edad automáticamente a partir de la fecha de nacimiento ingresada y desplegará de forma obligatoria los campos del <strong>Tutor Legal</strong>:
                    </p>
                    <ul class="list-disc list-inside space-y-1 text-slate-600 pl-1">
                      <li><strong>Nombre completo del Tutor:</strong> Padre, madre o apoderado legal acreditado.</li>
                      <li><strong>Cédula de Identidad (CI):</strong> Para verificación legal de identidad.</li>
                      <li><strong>Teléfono de contacto:</strong> Línea directa para notificaciones de viajes, aprobaciones y representación institucional.</li>
                    </ul>
                    <p class="text-amber-900 font-semibold pt-1">
                      El tutor legal asume la responsabilidad jurídica del menor ante el Club Deportivo, la Asociación Departamental y el SEDEDE para la autorización de viajes deportivos y trámites federativos.
                    </p>
                  </div>
                </details>

                <details class="group rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <summary class="font-bold text-slate-800 cursor-pointer flex items-center justify-between">
                    <span>¿Qué hago si mi club no aparece en la lista desplegable?</span>
                    <span class="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p class="mt-2 text-slate-600 leading-relaxed">
                    Los clubes deben tener personería jurídica y documentación legal al día para figurar en la lista oficial. Si tu club no aparece, comunícate con la directiva de tu club para que regularicen su personería ante el SEDEDE o selecciona "Independiente" provisionalmente.
                  </p>
                </details>

                <details class="group rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <summary class="font-bold text-slate-800 cursor-pointer flex items-center justify-between">
                    <span>¿Tiene algún costo inscribirse en el Registro Único de Deportistas (RUN)?</span>
                    <span class="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p class="mt-2 text-slate-600 leading-relaxed">
                    No. El registro en el padrón departamental RUN es un trámite completamente <strong>gratuito</strong> promovido por la Gobernación de Chuquisaca a través del SEDEDE para fomentar la práctica deportiva legal y transparente.
                  </p>
                </details>
              </div>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- PESTAÑA 2: MANUAL DE RESERVA DE ESCENARIOS DEPORTIVOS              -->
          <!-- =================================================================== -->
          <section v-if="activeTab === 'reservas'" class="space-y-8">
            <!-- Tarjeta de Resumen Rápido -->
            <div id="reservas-resumen" class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="space-y-1">
                  <span class="inline-block rounded-md bg-emerald-600 text-white px-2.5 py-0.5 text-xs font-bold uppercase">
                    Resolución Administrativa RAG 011/2024
                  </span>
                  <h2 class="text-xl font-bold text-emerald-950 font-display">
                    Guía Oficial para la Reserva y Uso de Escenarios Deportivos Departamentales
                  </h2>
                  <p class="text-xs text-emerald-900 leading-relaxed max-w-3xl">
                    Los escenarios deportivos de Chuquisaca están a disposición de deportistas, clubes, asociaciones y la ciudadanía en general. Este manual describe las tarifas vigentes, el cálculo de turnos nocturnos con recargo energético CESSA y la validación de no-colisión con el Calendario Oficial.
                  </p>
                </div>
                <router-link
                  to="/reservar"
                  class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-xs sm:text-sm font-bold transition shadow-sm shrink-0"
                >
                  <span>Ir al Portal de Reservas</span>
                  <span>➔</span>
                </router-link>
              </div>
            </div>

            <!-- Catálogo de Escenarios Administrados por SEDEDE -->
            <div id="reservas-catalogo" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏟️</span>
                <span>Escenarios Deportivos Departamentales Habilitados</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:border-brand-300 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-base">⚽</span>
                    <span class="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Operativo</span>
                  </div>
                  <h4 class="font-bold text-xs text-slate-900">Estadio Patria</h4>
                  <p class="text-[11px] text-slate-500">Cancha Principal, Pista Sintética de Atletismo, Curvas Norte y Sur.</p>
                  <p class="text-[10px] font-mono font-bold text-brand-700">Turno Diurno: Bs. 150/h · Nocturno: Bs. 280/h</p>
                </div>

                <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:border-brand-300 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-base">🏀</span>
                    <span class="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Operativo</span>
                  </div>
                  <h4 class="font-bold text-xs text-slate-900">Coliseo Jorge Revilla Aldana (JRA)</h4>
                  <p class="text-[11px] text-slate-500">Cancha Polifuncional de Parquet, Basquetbol, Futsal y Graderías.</p>
                  <p class="text-[10px] font-mono font-bold text-brand-700">Turno Diurno: Bs. 100/h · Nocturno: Bs. 180/h</p>
                </div>

                <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:border-brand-300 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-base">🏐</span>
                    <span class="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Operativo</span>
                  </div>
                  <h4 class="font-bold text-xs text-slate-900">Coliseo Tercera Fase</h4>
                  <p class="text-[11px] text-slate-500">Gimnasio de Voleibol, Gimnasia Artística y Deportes de Contacto.</p>
                  <p class="text-[10px] font-mono font-bold text-brand-700">Turno Diurno: Bs. 80/h · Nocturno: Bs. 140/h</p>
                </div>

                <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:border-brand-300 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-base">🥊</span>
                    <span class="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Operativo</span>
                  </div>
                  <h4 class="font-bold text-xs text-slate-900">Coliseo Tito Alfred</h4>
                  <p class="text-[11px] text-slate-500">Boxeo, Judo, Taekwondo, Karate y Lucha Olímpica.</p>
                  <p class="text-[10px] font-mono font-bold text-brand-700">Turno Diurno: Bs. 80/h · Nocturno: Bs. 140/h</p>
                </div>

                <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:border-brand-300 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-base">🎾</span>
                    <span class="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Operativo</span>
                  </div>
                  <h4 class="font-bold text-xs text-slate-900">Complejo de Tenis La Madona</h4>
                  <p class="text-[11px] text-slate-500">Canchas de Arcilla / Polvo de ladrillo reglamentarias.</p>
                  <p class="text-[10px] font-mono font-bold text-brand-700">Turno Diurno: Bs. 50/h · Nocturno: Bs. 90/h</p>
                </div>

                <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:border-brand-300 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-base">🎯</span>
                    <span class="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Operativo</span>
                  </div>
                  <h4 class="font-bold text-xs text-slate-900">Polígono Santiago Arana</h4>
                  <p class="text-[11px] text-slate-500">Tiro Deportivo, Polígono de precisión y galería de tiro.</p>
                  <p class="text-[10px] font-mono font-bold text-brand-700">Tarifa según modalidad y evento oficial</p>
                </div>
              </div>
            </div>

            <!-- Flujo Paso a Paso para Reservar -->
            <div id="reservas-pasos" class="space-y-6">
              <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>📝</span>
                <span>Paso a Paso: Cómo Solicitar una Reserva Formal</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Paso 1 -->
                <div class="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div class="flex items-center gap-2">
                    <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">1</span>
                    <h4 class="font-bold text-xs text-slate-900">Consulta de Disponibilidad</h4>
                  </div>
                  <p class="text-xs text-slate-600 leading-relaxed">
                    Ingresa al portal público de reservas (`/reservar`), selecciona el escenario deportivo y el ambiente específico. El sistema mostrará el calendario con los bloques ya ocupados y los horarios disponibles.
                  </p>
                </div>

                <!-- Paso 2 -->
                <div class="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div class="flex items-center gap-2">
                    <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">2</span>
                    <h4 class="font-bold text-xs text-slate-900">Validación Anti-Colisión</h4>
                  </div>
                  <p class="text-xs text-slate-600 leading-relaxed">
                    El sistema valida automáticamente que no existan eventos del <strong>Calendario Anual Oficial</strong> programados para esa fecha. Los torneos nacionales y departamentales tienen prioridad institucional.
                  </p>
                </div>

                <!-- Paso 3 -->
                <div class="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div class="flex items-center gap-2">
                    <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">3</span>
                    <h4 class="font-bold text-xs text-slate-900">Depósito & Boleta Oficial</h4>
                  </div>
                  <p class="text-xs text-slate-600 leading-relaxed">
                    Realiza el depósito en la cuenta fiscal del SEDEDE en el Banco Unión, adjunta el comprobante y recibe tu <strong>Boleta Oficial de Reserva</strong> con código único de verificación para ingresar al recinto.
                  </p>
                </div>
              </div>
            </div>

            <!-- SIMULADOR INTERACTIVO DE TARIFAS Y RECARGO CESSA -->
            <div id="reservas-simulador" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>🧮</span>
                    <span>Simulador de Tarifas y Recargo Energético CESSA (RAG 011/2024)</span>
                  </h3>
                  <p class="text-xs text-slate-500">
                    Calcula el monto exacto antes de realizar tu depósito bancario.
                  </p>
                </div>
                <span class="rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 border border-emerald-200">
                  Cálculo en Tiempo Real
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Escenario Deportivo</label>
                  <select v-model="simEscenario" class="input-field text-xs w-full">
                    <option value="estadio_patria">Estadio Patria (Cancha)</option>
                    <option value="coliseo_jra">Coliseo Jorge Revilla Aldana</option>
                    <option value="coliseo_tito">Coliseo Tito Alfred</option>
                    <option value="tercera_fase">Coliseo Tercera Fase</option>
                    <option value="polideportivo_urquizu">Polideportivo Esteban Urquizu</option>
                    <option value="tenis_madona">Tenis La Madona</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Turno de Uso</label>
                  <select v-model="simTurno" class="input-field text-xs w-full">
                    <option value="dia">Turno Diurno (Luz Natural)</option>
                    <option value="noche">Turno Nocturno (con Reflectores CESSA)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de Solicitante</label>
                  <select v-model="simTipoUsuario" class="input-field text-xs w-full">
                    <option value="particular">Particular / Escuela Deportiva</option>
                    <option value="club_asociacion">Club o Asociación Deportiva (Convenio)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Horas Solicitadas</label>
                  <input v-model.number="simHoras" type="number" min="1" max="8" class="input-field text-xs w-full" />
                </div>
              </div>

              <!-- Cuadro de Resultados de la Simulación -->
              <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 mt-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p class="text-[10px] text-slate-500 uppercase font-bold">Subtotal Alquiler</p>
                    <p class="text-base font-extrabold text-slate-800 font-mono">Bs. {{ calculoSimulado.subtotal }}</p>
                    <p v-if="calculoSimulado.tieneDescuento" class="text-[10px] text-emerald-700 font-bold">30% desc. asociacionista aplicado</p>
                  </div>

                  <div>
                    <p class="text-[10px] text-slate-500 uppercase font-bold">Recargo Energético CESSA</p>
                    <p class="text-base font-extrabold text-amber-700 font-mono">Bs. {{ calculoSimulado.recargoCessa }}</p>
                    <p class="text-[10px] text-slate-400">{{ simTurno === 'noche' ? 'Iluminación nocturna activa' : 'Exento en horario diurno' }}</p>
                  </div>

                  <div class="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0">
                    <p class="text-[10px] text-brand-700 uppercase font-extrabold">Total a Depositar</p>
                    <p class="text-xl font-extrabold text-brand-700 font-mono">Bs. {{ calculoSimulado.total }}</p>
                    <p class="text-[10px] text-slate-500">Banco Unión · Cuenta Fiscal SEDEDE</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- GUÍAS INTERNAS: POA Y FINANCIERO (solo roles con acceso)           -->
          <ManualPoa v-if="activeTab === 'poa' && veManualPoa" />
          <ManualFinanciero v-if="activeTab === 'financiero' && veManualFinanciero" />

          <!-- =================================================================== -->
          <!-- PESTAÑA DE SOPORTE TÉCNICO Y DIRECTORIO DE DESARROLLADORES UPDS   -->
          <!-- =================================================================== -->
          <section v-if="activeTab === 'soporte'" class="space-y-8">
            <!-- Encabezado de Soporte -->
            <div id="soporte-directorio" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
              <div class="flex items-center gap-2">
                <span class="rounded bg-brand-100 text-brand-800 text-xs font-bold px-2.5 py-0.5">Soporte Técnico Especializado</span>
                <span class="text-xs text-slate-400">Convenio UPDS Sucre — SEDEDE Chuquisaca</span>
              </div>
              <h2 class="text-xl font-bold text-slate-900 font-display">
                Directorio del Equipo de Desarrollo y Mesa de Ayuda
              </h2>
              <p class="text-xs text-slate-600 leading-relaxed max-w-3xl">
                Para la presentación oficial del sistema, incidencias técnicas, consultas de base de datos o asesoría en los flujos de registro y reserva, comunícate directamente con los estudiantes desarrolladores del proyecto. <strong>El orden de la lista refleja su contribución técnica directa al software.</strong>
              </p>
            </div>

            <!-- Grid Completo de Desarrolladores -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="autor in AUTORES_CONTRIBUCION"
                :key="autor.telefono"
                class="rounded-2xl border p-5 bg-white shadow-xs transition hover:shadow-md relative overflow-hidden"
                :class="autor.destacado ? 'border-brand-200 bg-gradient-to-b from-brand-50/30 to-white' : 'border-slate-200'"
              >
                <!-- Badge de Rango -->
                <div class="flex items-center justify-between mb-3">
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold"
                    :class="autor.rango <= 3 ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-slate-100 text-slate-700'"
                  >
                    {{ autor.rango }}°
                  </span>
                  <span class="rounded bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                    {{ autor.rol }}
                  </span>
                </div>

                <!-- Información del Desarrollador -->
                <h3 class="font-bold text-sm text-slate-900">{{ autor.nombreCompleto }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">Estudiante de Ingeniería de Sistemas · UPDS Sucre</p>

                <!-- Acciones de Contacto -->
                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    :href="`tel:${autor.telefono}`"
                    class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 transition"
                  >
                    <span>📞</span>
                    <span>{{ autor.telefono }}</span>
                  </a>

                  <a
                    :href="`https://wa.me/${autor.whatsapp}?text=Hola%20${encodeURIComponent(autor.nombreCompleto)},%20te%20contacto%20por%20soporte%20del%20sistema%20SEDEDE.`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition shadow-2xs"
                    :title="`Chatear con ${autor.nombreCompleto}`"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>
