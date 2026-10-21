<script setup>
import { ref, onMounted } from 'vue'
import { deportistaService } from '../../services/deportistaService'

const query = ref('')
const disciplinaFiltro = ref('')
const loading = ref(false)
const resultados = ref([])
const error = ref(null)

const modalAbierto = ref(false)
const perfilSeleccionado = ref(null)
const cargandoPerfil = ref(false)

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

async function buscar() {
  loading.value = true
  error.value = null
  try {
    const res = await deportistaService.buscarPublico({
      q: query.value,
      disciplina: disciplinaFiltro.value || undefined,
    })
    resultados.value = res.data || []
  } catch (err) {
    console.error('Error en búsqueda de deportistas:', err)
    error.value = 'No se pudo realizar la búsqueda en este momento.'
  } finally {
    loading.value = false
  }
}

async function verPerfil(id) {
  cargandoPerfil.value = true
  modalAbierto.value = true
  perfilSeleccionado.value = null
  try {
    const data = await deportistaService.getPerfilPublico(id)
    perfilSeleccionado.value = data
  } catch (err) {
    console.error('Error cargando perfil público:', err)
  } finally {
    cargandoPerfil.value = false
  }
}

function cerrarModal() {
  modalAbierto.value = false
  perfilSeleccionado.value = null
}

onMounted(() => {
  buscar()
})
</script>

<template>
  <section id="buscador" class="bg-white py-20 border-b border-slate-100">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la Sección -->
      <div class="max-w-3xl">
        <span class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-bold text-brand-800">
          <span>🔍 PORTAL CIUDADANO DE TRANSPARENCIA DEPORTIVA</span>
        </span>
        <h2 class="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
          Buscador de Deportistas de Chuquisaca
        </h2>
        <p class="mt-2 text-sm sm:text-base text-slate-600">
          Consulta pública y transparente de la ficha curricular, trayectoria, logros acreditados y los apoyos e incentivos económicos otorgados por el SEDEDE a nuestros atletas departamentales.
        </p>
      </div>

      <!-- Barra de Búsqueda Interactiva -->
      <div class="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              🔍
            </span>
            <input
              v-model="query"
              type="text"
              placeholder="Buscar por nombre del atleta o disciplina (ej. Camila, Ajedrez, Natación)..."
              class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
              @keyup.enter="buscar"
            />
          </div>

          <div class="w-full sm:w-48">
            <select
              v-model="disciplinaFiltro"
              class="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-700 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
              @change="buscar"
            >
              <option value="">Todas las Disciplinas</option>
              <option value="Ajedrez">Ajedrez</option>
              <option value="Natación">Natación</option>
              <option value="Tenis">Tenis</option>
              <option value="Fútbol">Fútbol</option>
              <option value="Atletismo">Atletismo</option>
            </select>
          </div>

          <button
            type="button"
            class="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold bg-brand-700 hover:bg-brand-800 transition-all shrink-0"
            :disabled="loading"
            @click="buscar"
          >
            <span v-if="loading">Buscando…</span>
            <span v-else>Buscar Atletas</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-16 text-center text-slate-500">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent"></div>
        <p class="mt-3 text-xs">Consultando padrón ciudadano de atletas…</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        {{ error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="resultados.length === 0" class="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
        <span class="text-3xl">🔎</span>
        <h3 class="mt-2 text-sm font-bold text-slate-800">No se encontraron deportistas</h3>
        <p class="text-xs text-slate-500 mt-1">Prueba ingresando otro nombre o seleccionando otra disciplina deportiva.</p>
      </div>

      <!-- Resultados de Búsqueda -->
      <div v-else class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="d in resultados"
          :key="d.id"
          class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div class="flex items-start gap-3.5">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-black text-brand-700 border border-brand-100">
              {{ iniciales(d.nombre) }}
            </div>

            <div class="min-w-0 flex-1">
              <h4 class="font-display text-base font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                {{ d.nombre }}
              </h4>
              <p class="text-xs font-semibold text-brand-700">{{ d.disciplina }} · {{ d.categoria }}</p>
              <p v-if="d.asociacion?.sigla || d.asociacion?.nombre" class="text-[11px] text-slate-500 truncate mt-0.5">
                {{ d.asociacion?.sigla || d.asociacion?.nombre }}
              </p>
            </div>
          </div>

          <!-- Badges de Galardones y Apoyos -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5 font-bold">
              <span class="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-800">
                🏆 {{ d.galardones.total }} Galardones
              </span>
            </div>

            <span
              v-if="d.apoyos_institucionales_count > 0"
              class="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
            >
              🏛️ {{ d.apoyos_institucionales_count }} Apoyos SEDEDE
            </span>
            <span v-else class="text-[10px] text-slate-400 italic">
              Sin trámites concluidos
            </span>
          </div>

          <!-- Botón Ver Ficha Completa -->
          <button
            type="button"
            class="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-800 transition-all flex items-center justify-center gap-1.5"
            @click="verPerfil(d.id)"
          >
            <span>📄 Ver CV, Logros y Apoyos SEDEDE</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: FICHA TÉCNICA CIUDADANA Y EXPEDIENTE SEDEDE -->
    <div
      v-if="modalAbierto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
      @click.self="cerrarModal"
    >
      <div class="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
        <!-- Spinner mientras carga perfil -->
        <div v-if="cargandoPerfil" class="py-20 text-center text-slate-500">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent"></div>
          <p class="mt-3 text-xs font-bold">Cargando expediente deportivo y resoluciones del SEDEDE…</p>
        </div>

        <template v-else-if="perfilSeleccionado">
          <!-- Cabecera del Modal -->
          <div class="flex items-start justify-between border-b border-slate-100 pb-4">
            <div class="flex items-center gap-3.5">
              <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-lg font-black text-white shadow-sm">
                {{ iniciales(perfilSeleccionado.nombre) }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-display text-xl font-bold text-slate-900">
                    {{ perfilSeleccionado.nombre }}
                  </h3>
                  <span v-if="perfilSeleccionado.menor_de_edad" class="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                    Menor de Edad (Protegido)
                  </span>
                </div>
                <p class="text-xs font-semibold text-brand-700">
                  {{ perfilSeleccionado.disciplina }} · {{ perfilSeleccionado.categoria }}
                </p>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  {{ perfilSeleccionado.asociacion?.nombre }}
                  <span v-if="perfilSeleccionado.club?.nombre"> · Club {{ perfilSeleccionado.club.nombre }}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 text-xl p-1 rounded-lg hover:bg-slate-100"
              @click="cerrarModal"
            >
              ✕
            </button>
          </div>

          <!-- SECCIÓN 1: RESUMEN DE CV Y RANKING -->
          <div class="mt-5 space-y-5">
            <div class="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <span>📋 1. Perfil y Currículum Deportivo</span>
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span class="block text-slate-400 font-medium">Disciplina:</span>
                  <span class="font-bold text-slate-800">{{ perfilSeleccionado.disciplina }}</span>
                </div>
                <div>
                  <span class="block text-slate-400 font-medium">Categoría:</span>
                  <span class="font-bold text-slate-800">{{ perfilSeleccionado.categoria }}</span>
                </div>
                <div>
                  <span class="block text-slate-400 font-medium">Posición Nacional:</span>
                  <span class="font-bold text-brand-800">Puesto N° {{ perfilSeleccionado.posicion_nacional }}</span>
                </div>
                <div>
                  <span class="block text-slate-400 font-medium">Asociación Departamental:</span>
                  <span class="font-bold text-slate-800">{{ perfilSeleccionado.asociacion?.sigla || 'AD' }}</span>
                </div>
                <div>
                  <span class="block text-slate-400 font-medium">Club Afiliado:</span>
                  <span class="font-bold text-slate-800">{{ perfilSeleccionado.club?.nombre || 'Independiente' }}</span>
                </div>
                <div>
                  <span class="block text-slate-400 font-medium">Validación Técnica:</span>
                  <span class="font-bold text-emerald-700">✓ Padrón Oficial SEDEDE</span>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: LOGROS Y MEDALLAS VALIDADAS -->
            <div class="rounded-xl bg-amber-50/50 border border-amber-200 p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span>🏆 2. Historial de Galardones y Medallas Validadas</span>
                </h4>
                <span class="rounded-full bg-amber-200/60 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5">
                  {{ perfilSeleccionado.galardones.total }} Galardones Oficiales
                </span>
              </div>

              <div v-if="perfilSeleccionado.galardones.items?.length" class="space-y-2">
                <div
                  v-for="(logro, idx) in perfilSeleccionado.galardones.items"
                  :key="idx"
                  class="rounded-lg bg-white p-3 border border-amber-200/80 shadow-xs flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-slate-900">{{ logro.titulo }}</span>
                      <span v-if="logro.torneo" class="text-slate-500">({{ logro.torneo }})</span>
                    </div>
                    <div class="mt-1 flex items-center gap-2 text-[10px]">
                      <span class="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5">
                        ✓ {{ logro.origen }}
                      </span>
                      <span v-if="logro.gestion" class="text-slate-400 font-mono">Gestión: {{ logro.gestion }}</span>
                    </div>
                  </div>

                  <span class="shrink-0 text-base">
                    {{ logro.tipo === 'oro' ? '🥇' : logro.tipo === 'plata' ? '🥈' : logro.tipo === 'bronce' ? '🥉' : '🏆' }}
                  </span>
                </div>
              </div>

              <div v-else class="text-center py-4 text-xs italic text-slate-500">
                No tiene galardones cargados aún.
              </div>
            </div>

            <!-- SECCIÓN 3: APOYOS INSTITUCIONALES DEL SEDEDE -->
            <div class="rounded-xl bg-brand-50/50 border border-brand-200 p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
                  <span>🏛️ 3. Apoyos e Incentivos Otorgados por el SEDEDE</span>
                </h4>
                <span class="rounded-full bg-brand-200/60 text-brand-900 text-[10px] font-extrabold px-2.5 py-0.5">
                  {{ perfilSeleccionado.apoyos_sedede?.length || 0 }} Resoluciones
                </span>
              </div>

              <div v-if="perfilSeleccionado.apoyos_sedede?.length" class="space-y-2">
                <div
                  v-for="apoyo in perfilSeleccionado.apoyos_sedede"
                  :key="apoyo.id"
                  class="rounded-lg bg-white p-3 border border-brand-200/80 shadow-xs text-xs"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900">{{ apoyo.evento }}</span>
                    <span class="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                      ✓ {{ apoyo.estado }}
                    </span>
                  </div>
                  <div class="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
                    <span><strong>Tipo:</strong> {{ apoyo.tipo_solicitud }}</span>
                    <span v-if="apoyo.gestion" class="font-mono text-slate-400">Año: {{ apoyo.gestion }}</span>
                  </div>
                  <p class="mt-1 text-[10px] text-slate-500 italic">
                    {{ apoyo.impacto }}
                  </p>
                </div>
              </div>

              <div v-else class="text-center py-4 text-xs italic text-slate-500">
                El deportista no registra solicitudes de apoyo económico o incentivo concluidas a la fecha.
              </div>
            </div>
          </div>

          <!-- Pie del Modal -->
          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p class="text-[10px] text-slate-400">
              * Datos certificados por el Sistema Oficial del Servicio Departamental de Deportes de Chuquisaca.
            </p>
            <button
              type="button"
              class="btn-primary text-xs font-bold py-2 px-5 bg-slate-800 hover:bg-slate-900"
              @click="cerrarModal"
            >
              Cerrar Expediente
            </button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
