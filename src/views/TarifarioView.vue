<template>
  <div class="space-y-6">
    <!-- Header principal -->
    <div class="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 text-emerald-200 text-xs font-semibold tracking-wider uppercase mb-1">
          <span class="px-2 py-0.5 bg-emerald-950/40 rounded-md border border-emerald-500/30">Tarifario SEDEDE</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Tarifario</h1>
        <p class="text-emerald-100 text-sm mt-1 max-w-2xl">
          Reservas de escenarios, cotizador y emisión de recibos.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          @click="activeTab = 'calendario'"
          :class="[
            'px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2',
            activeTab === 'calendario'
              ? 'bg-white text-emerald-900 shadow-emerald-900/20 font-semibold scale-105'
              : 'bg-emerald-700/60 hover:bg-emerald-600/80 text-white'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendario de Reservas
        </button>
        <button
          @click="activeTab = 'cotizador'"
          :class="[
            'px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2',
            activeTab === 'cotizador'
              ? 'bg-white text-emerald-900 shadow-emerald-900/20 font-semibold scale-105'
              : 'bg-emerald-700/60 hover:bg-emerald-600/80 text-white'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Cotizador
        </button>
        <button
          @click="activeTab = 'liquidaciones'"
          :class="[
            'px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2',
            activeTab === 'liquidaciones'
              ? 'bg-white text-emerald-900 shadow-emerald-900/20 font-semibold scale-105'
              : 'bg-emerald-700/60 hover:bg-emerald-600/80 text-white'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Recibos
        </button>
        <button
          @click="activeTab = 'catalogo'"
          :class="[
            'px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2',
            activeTab === 'catalogo'
              ? 'bg-white text-emerald-900 shadow-emerald-900/20 font-semibold scale-105'
              : 'bg-emerald-700/60 hover:bg-emerald-600/80 text-white'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Tarifas
        </button>
      </div>
    </div>

    <!-- Filtro por Rango de Fechas para Recaudación Financiera -->
    <div class="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 font-bold text-gray-700">
        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Filtro de Recaudación por Rango de Fechas:</span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-medium">Desde:</span>
          <input type="date" v-model="fechaDesdeResumen" @change="fetchResumen" class="rounded-lg border-gray-200 text-xs py-1 px-2 font-semibold" />
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-medium">Hasta:</span>
          <input type="date" v-model="fechaHastaResumen" @change="fetchResumen" class="rounded-lg border-gray-200 text-xs py-1 px-2 font-semibold" />
        </div>
        <div class="flex items-center gap-1 pl-2">
          <button @click="setPresetFechaResumen('hoy')" class="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded font-semibold text-[11px]">Hoy</button>
          <button @click="setPresetFechaResumen('mes')" class="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded font-semibold text-[11px]">Este Mes</button>
          <button @click="setPresetFechaResumen('anio')" class="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded font-semibold text-[11px]">2026</button>
          <button @click="setPresetFechaResumen('todo')" class="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded font-semibold text-[11px]">Todo</button>
        </div>
      </div>
    </div>

    <!-- KPIs superiores -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Recaudado (En Rango)</p>
            <h3 class="text-2xl font-bold text-gray-900 mt-1">Bs. {{ formatMoney(resumen.total_recaudado) }}</h3>
          </div>
          <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <span class="font-semibold text-emerald-600">{{ resumen.total_liquidaciones }}</span> órdenes procesadas
        </p>
      </div>


      <div class="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Por Cobrar (Pendientes)</p>
            <h3 class="text-2xl font-bold text-amber-600 mt-1">Bs. {{ formatMoney(resumen.total_pendiente) }}</h3>
          </div>
          <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3 flex items-center gap-1">
          Órdenes pendientes de recibo oficial
        </p>
      </div>

      <div class="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Depósitos 24h (SAFCO)</p>
            <h3 class="text-2xl font-bold text-emerald-700 mt-1">{{ resumen.cumplimiento_deposito_24h }}%</h3>
          </div>
          <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <span class="font-medium text-emerald-700">Cumplimiento legal de depósito bancario</span>
        </p>
      </div>

      <div class="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Reservas Confirmadas</p>
            <h3 class="text-2xl font-bold text-teal-700 mt-1">{{ reservas.length }}</h3>
          </div>
          <div class="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3 flex items-center gap-1">
          Solicitudes con liquidación automática
        </p>
      </div>
    </div>

    <!-- TAB 0: CALENDARIO & RESERVAS (BLOQUE 1) -->
    <div v-if="activeTab === 'calendario'" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-6">
      
      <!-- Encabezado y Filtros Responsivos -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Calendario Unificado de Ocupación & Reservas (Bloque 1)
          </h2>
          <p class="text-xs text-gray-500 mt-0.5">Seleccione el espacio deportivo para consultar su disponibilidad mensual e integrar la reserva al Tarifario.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
          <!-- Filtro Disciplina -->
          <div class="flex-1 min-w-[130px] sm:min-w-[150px]">
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">1. Disciplina</label>
            <select
              v-model="filtroDisciplina"
              @change="onDisciplinaFilterChange"
              class="w-full rounded-xl border-gray-200 text-xs py-2 px-3 bg-gray-50 font-semibold focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas las Disciplinas</option>
              <option value="Fútbol">⚽ Fútbol</option>
              <option value="Atletismo">🏃 Atletismo</option>
              <option value="Baloncesto">🏀 Baloncesto</option>
              <option value="Voleibol">🏐 Voleibol</option>
              <option value="Futsal">⚽ Futsal</option>
              <option value="Ráquetbol">🎾 Ráquetbol</option>
              <option value="Karate">🥋 Karate / Lucha</option>
            </select>
          </div>

          <!-- Selector Espacio Específico -->
          <div class="flex-1 min-w-[180px] sm:min-w-[220px]">
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">2. Espacio / Recinto Deportivo</label>
            <select
              v-model="espacioSeleccionadoClave"
              class="w-full rounded-xl border-gray-200 text-xs py-2 px-3 bg-emerald-50 text-emerald-900 font-bold focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="TODOS">🏟️ Todos los Espacios Disponibles</option>
              <option v-for="esp in listaEspaciosOpciones" :key="esp.clave" :value="esp.clave">
                {{ esp.escenario_nombre }} - {{ esp.espacio }}
              </option>
            </select>
          </div>

          <!-- Botón Solicitar Reserva -->
          <div class="w-full sm:w-auto pt-1 sm:pt-0">
            <button
              @click="abrirModalNuevaReservaConEspacio()"
              class="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              + Solicitar Reserva
            </button>
          </div>
        </div>
      </div>

      <!-- Barra Navegación Mensual & Leyenda (Responsivo Mobile) -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
        <!-- Navegación de Mes -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            @click="mesAnterior"
            class="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            ‹ Mes Anterior
          </button>
          
          <div class="text-center px-3">
            <span class="text-sm font-extrabold text-emerald-950 uppercase tracking-wide block">
              {{ monthYearLabel }}
            </span>
            <span class="text-[10px] text-emerald-700 font-medium block" v-if="espacioSeleccionadoInfo">
              {{ espacioSeleccionadoInfo.escenario_nombre }} ({{ espacioSeleccionadoInfo.espacio }})
            </span>
            <span class="text-[10px] text-gray-500 font-medium block" v-else>
              Vista General de Ocupación
            </span>
          </div>

          <button
            @click="mesSiguiente"
            class="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            Mes Siguiente ›
          </button>
        </div>

        <!-- Leyenda de Estados -->
        <div class="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-700">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span> Libre</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span> Pendiente</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span> Reservado</span>
        </div>
      </div>

      <!-- CALENDARIO PRINCIPAL UNIFICADO (GRID 7 COLUMNAS RESPONSIVO MÓVIL) -->
      <div class="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
        <!-- Encabezados de días de la semana -->
        <div class="grid grid-cols-7 bg-emerald-950 text-white text-center text-xs font-bold py-2.5 uppercase tracking-wider border-b border-emerald-900">
          <div>Dom</div>
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
        </div>

        <!-- Matriz de Días del Mes -->
        <div class="grid grid-cols-7 divide-x divide-y divide-gray-100 bg-gray-50/50">
          <!-- Celdas vacías previa al inicio del mes -->
          <div
            v-for="blank in firstDayIndex"
            :key="'blank-' + blank"
            class="min-h-[70px] sm:min-h-[100px] bg-gray-50/70 p-1 md:p-2 opacity-30 select-none"
          ></div>

          <!-- Días reales del mes -->
          <div
            v-for="dayObj in monthCalendarDays"
            :key="dayObj.dateStr"
            @click="seleccionarDiaCalendario(dayObj)"
            :class="[
              'min-h-[75px] sm:min-h-[105px] p-1.5 sm:p-2 transition-all cursor-pointer relative flex flex-col justify-between group hover:shadow-md hover:z-10',
              diaSeleccionado === dayObj.dateStr ? 'bg-emerald-100/70 ring-2 ring-emerald-600 shadow-md z-10' :
              dayObj.isToday ? 'bg-emerald-50/70 ring-1 ring-emerald-500/50' : 'bg-white hover:bg-emerald-50/30'
            ]"
          >
            <!-- Cabecera del día -->
            <div class="flex justify-between items-start">
              <span
                :class="[
                  'inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm font-bold rounded-full transition-transform group-hover:scale-110',
                  diaSeleccionado === dayObj.dateStr ? 'bg-emerald-800 text-white shadow-sm' :
                  dayObj.isToday ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-800'
                ]"
              >
                {{ dayObj.dayNumber }}
              </span>

              <!-- Badge indicador de estado -->
              <span
                :class="[
                  'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm',
                  dayObj.status === 'RESERVADO' ? 'bg-red-500 ring-2 ring-red-200' :
                  dayObj.status === 'PENDIENTE' ? 'bg-amber-500 ring-2 ring-amber-200' :
                  'bg-emerald-500 ring-2 ring-emerald-200'
                ]"
                :title="dayObj.status"
              ></span>
            </div>

            <!-- Contenido / Eventos en el Día -->
            <div class="mt-1 space-y-1 flex-1 overflow-hidden">
              <div v-if="dayObj.reservas.length > 0" class="space-y-1">
                <div
                  v-for="res in dayObj.reservas.slice(0, 2)"
                  :key="res.id"
                  :class="[
                    'p-1 sm:p-1.5 rounded-lg text-[9px] sm:text-[10px] leading-tight font-semibold border truncate',
                    res.estado === 'CONFIRMADA' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                  ]"
                >
                  <p class="font-bold truncate">{{ res.solicitante_nombre }}</p>
                  <p class="text-[8px] sm:text-[9px] opacity-80">{{ res.hora_inicio }} - {{ res.hora_fin }}</p>
                </div>
                <p v-if="dayObj.reservas.length > 2" class="text-[9px] text-gray-500 font-bold px-1">
                  +{{ dayObj.reservas.length - 2 }} más
                </p>
              </div>

              <div v-else class="hidden sm:block text-[10px] text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                Ver Horarios
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CRONOGRAMA DE HORARIOS DEL DÍA SELECCIONADO Y PRÓXIMAS RESERVAS -->
      <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">📅</span>
              <h3 class="font-bold text-gray-900 text-sm">
                Cronograma y Disponibilidad: <span class="text-emerald-800">{{ fechaSeleccionadaFormateada }}</span>
              </h3>
            </div>
            <p class="text-[11px] text-gray-500 mt-0.5">
              Recinto: <strong class="text-gray-700">{{ espacioSeleccionadoInfo ? espacioSeleccionadoInfo.escenario_nombre + ' — ' + espacioSeleccionadoInfo.espacio : 'Todos los Espacios Deportivos' }}</strong>
              • Horario operativo de 06:00 a 22:00
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Botón para solicitar reserva directa en este día -->
            <button
              @click="abrirModalReservaParaDia(diaSeleccionado)"
              class="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>+</span> Solicitar Reserva en este Día
            </button>

            <!-- Selector de Pestañas: Horarios vs Próximas -->
            <div class="flex bg-white rounded-xl p-0.5 border border-gray-200 text-xs font-semibold shadow-2xs">
              <button
                @click="vistaSubCalendario = 'horarios'"
                :class="['px-3 py-1 rounded-lg transition-colors', vistaSubCalendario === 'horarios' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-gray-600 hover:text-gray-900']"
              >
                🕒 Horarios del Día (06:00 - 22:00)
              </button>
              <button
                @click="vistaSubCalendario = 'proximas'"
                :class="['px-3 py-1 rounded-lg transition-colors', vistaSubCalendario === 'proximas' ? 'bg-emerald-100/80 text-emerald-900 font-bold' : 'text-gray-600 hover:text-gray-900']"
              >
                📋 Reservas del Mes ({{ reservasDelMesFiltradas.length }})
              </button>
            </div>
          </div>
        </div>

        <!-- VISTA 1: TABLA / TIMELINE DE FRANJAS HORARIAS DEL DÍA -->
        <div v-if="vistaSubCalendario === 'horarios'" class="space-y-3">
          <div class="flex justify-between items-center text-xs text-gray-600 px-1">
            <span class="font-medium">
              Mostrando franjas horarias operativas reglamentadas para este día:
            </span>
            <div class="flex items-center gap-3 text-[11px] font-semibold">
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Horario Libre</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> Horario Ocupado / Reservado</span>
            </div>
          </div>

          <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-100/80 text-[10px] uppercase font-bold text-gray-600 border-b border-gray-200">
                <tr>
                  <th class="py-2.5 px-3">Franja Horaria</th>
                  <th class="py-2.5 px-3">Turno</th>
                  <th class="py-2.5 px-3">Estado de Ocupación</th>
                  <th class="py-2.5 px-3">Entidad / Solicitante</th>
                  <th class="py-2.5 px-3">Concepto & Disciplina</th>
                  <th class="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="franja in franjasDiaSeleccionado"
                  :key="franja.hora_inicio"
                  :class="franja.disponible ? 'hover:bg-emerald-50/40' : 'bg-red-50/20 hover:bg-red-50/30'"
                >
                  <td class="py-2.5 px-3 font-mono font-bold text-gray-800 whitespace-nowrap">
                    {{ franja.hora_inicio }} - {{ franja.hora_fin }}
                  </td>
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <span :class="franja.turno === 'Dia' ? 'text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded font-semibold text-[10px]' : 'text-indigo-800 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded font-semibold text-[10px]'">
                      {{ franja.turno === 'Dia' ? '☀️ Día (06-18)' : '🌙 Noche (18-22)' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <span v-if="franja.disponible" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span> DISPONIBLE
                    </span>
                    <span v-else-if="franja.reserva?.estado === 'CONFIRMADA'" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                      <span class="w-2 h-2 rounded-full bg-red-500"></span> RESERVADO (CONFIRMADO)
                    </span>
                    <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      <span class="w-2 h-2 rounded-full bg-amber-500"></span> PENDIENTE DE PAGO
                    </span>
                  </td>
                  <td class="py-2.5 px-3 font-medium text-gray-800">
                    <span v-if="!franja.disponible" class="font-bold text-gray-900">
                      {{ franja.reserva?.solicitante_nombre }}
                    </span>
                    <span v-else class="text-gray-400 italic text-[11px]">
                      Sin reservas — Horario disponible
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-gray-600">
                    <span v-if="!franja.disponible">
                      <span class="font-medium text-gray-800">"{{ franja.reserva?.concepto }}"</span>
                      <span v-if="franja.reserva?.disciplina" class="text-gray-500 text-[10px] ml-1">({{ franja.reserva?.disciplina }})</span>
                    </span>
                    <span v-else class="text-gray-400 text-[11px]">—</span>
                  </td>
                  <td class="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      v-if="franja.disponible"
                      @click="reservarFranjaEspecifica(franja)"
                      class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                    >
                      + Reservar
                    </button>
                    <span v-else class="text-[10px] font-mono text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                      {{ franja.reserva?.codigo_reserva }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- VISTA 2: LISTADO DE PRÓXIMAS RESERVAS DEL MES -->
        <div v-else-if="reservasDelMesFiltradas.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="res in reservasDelMesFiltradas"
            :key="res.id"
            class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-1.5 text-xs hover:border-emerald-400 transition-colors"
          >
            <div class="flex justify-between items-start">
              <span class="font-bold text-gray-900">{{ res.solicitante_nombre }}</span>
              <span
                :class="[
                  'px-2 py-0.5 text-[9px] font-bold rounded uppercase',
                  res.estado === 'CONFIRMADA' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                ]"
              >
                {{ res.estado }}
              </span>
            </div>

            <p class="text-emerald-700 font-medium text-[11px]">{{ res.escenario_nombre }} - {{ res.espacio }}</p>
            <p class="text-gray-500 text-[10px]">
              📅 {{ res.fecha_uso }} ({{ res.hora_inicio }} - {{ res.hora_fin }}) • ⚽ {{ res.disciplina }}
            </p>
            <p class="text-gray-600 italic text-[11px] border-t pt-1 mt-1">"{{ res.concepto }}"</p>
          </div>
        </div>

        <p v-else class="text-xs text-gray-500 italic py-2 text-center">
          No hay reservas programadas para este espacio en {{ monthYearLabel }}.
        </p>
      </div>
    </div>

    <!-- TAB 1: COTIZADOR EN TIEMPO REAL -->
    <div v-if="activeTab === 'cotizador'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div class="border-b border-gray-100 pb-4 flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Calculadora & Cotizador Oficial (RAG 011/2024)
            </h2>
            <p class="text-xs text-gray-500 mt-0.5">Seleccione las variables del uso de escenario para calcular automáticamente el canon y recargo de iluminación.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Escenario Deportivo</label>
            <select
              v-model="cotizadorForm.escenario_nombre"
              @change="onEscenarioCotizadorChange"
              class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 font-medium"
            >
              <option v-for="esc in escenariosCotizador" :key="esc" :value="esc">{{ esc }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Espacio Específico</label>
            <select
              v-model="cotizadorForm.espacio"
              @change="onEspacioCotizadorChange"
              class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 font-medium"
            >
              <option v-for="esp in espaciosCotizador" :key="esp" :value="esp">{{ esp }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>1º Tipo de Solicitante / Usuario</span>
              <span class="text-[10px] text-emerald-600 font-bold lowercase bg-emerald-50 px-1.5 py-0.5 rounded">variable</span>
            </label>
            <select
              v-model="cotizadorForm.tipo_usuario"
              @change="onTipoUsuarioCotizadorChange"
              class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 font-medium"
            >
              <option v-for="tu in tiposUsuarioCotizador" :key="tu" :value="tu">{{ tu }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>2º Concepto de Uso</span>
              <span class="text-[10px] text-emerald-600 font-bold lowercase bg-emerald-50 px-1.5 py-0.5 rounded">según usuario</span>
            </label>
            <select
              v-model="cotizadorForm.concepto"
              @change="calcular"
              class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 font-medium"
            >
              <option v-for="c in conceptosCotizador" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Turno Horario</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="cotizadorForm.turno = 'Dia'"
                :class="[
                  'py-2 rounded-xl text-xs font-semibold transition-all border',
                  cotizadorForm.turno === 'Dia'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                ]"
              >
                ☀️ Día (06:00 - 18:00)
              </button>
              <button
                type="button"
                @click="cotizadorForm.turno = 'Noche'"
                :class="[
                  'py-2 rounded-xl text-xs font-semibold transition-all border',
                  cotizadorForm.turno === 'Noche'
                    ? 'bg-indigo-900 border-indigo-700 text-indigo-100 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                ]"
              >
                🌙 Noche (18:00 - 22:00)
              </button>
            </div>
          </div>

          <div v-if="esModalidadPorcentaje">
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Monto de Taquilla Declarado (Bs.)</label>
            <input
              type="number"
              v-model.number="cotizadorForm.monto_taquilla_declarado"
              placeholder="Ej. 25000"
              class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5"
            />
          </div>

          <div v-else>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Duración (Horas)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              v-model.number="cotizadorForm.duracion_horas"
              class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5"
            />
          </div>
        </div>

        <div class="border-t border-gray-100 pt-4 space-y-3">
          <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider">Datos del Solicitante (para Orden de Liquidación)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                v-model="cotizadorForm.solicitante_nombre"
                placeholder="Nombre completo o Razón Social *"
                class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-xs py-2"
              />
            </div>
            <div>
              <input
                type="text"
                v-model="cotizadorForm.solicitante_ci_nit"
                placeholder="C.I. / N.I.T."
                class="w-full rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-xs py-2"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="calcular"
            class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Calcular Tarifa
          </button>
        </div>
      </div>

      <div class="bg-emerald-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-emerald-800/50">
        <div class="space-y-4">
          <div class="flex justify-between items-center border-b border-emerald-800 pb-3">
            <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Desglose de Liquidación</span>
            <span class="px-2 py-0.5 text-[10px] bg-emerald-800 text-emerald-200 rounded font-mono">RAG 011/2024</span>
          </div>

          <div v-if="calculoResultado" class="space-y-3 text-sm">
            <div>
              <p class="text-xs text-emerald-300">Escenario y Espacio:</p>
              <p class="font-semibold text-white">{{ cotizadorForm.escenario_nombre }} - {{ cotizadorForm.espacio }}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p class="text-emerald-300">Turno:</p>
                <p class="font-medium text-white">{{ calculoResultado.turno }}</p>
              </div>
              <div>
                <p class="text-emerald-300">Duración / Base:</p>
                <p class="font-medium text-white">{{ cotizadorForm.duracion_horas }} hora(s)</p>
              </div>
            </div>

            <div class="p-3 bg-emerald-900/60 rounded-xl border border-emerald-700/50 space-y-1.5 text-xs">
              <div class="flex justify-between text-emerald-200">
                <span>Subtotal Alquiler Base:</span>
                <span class="font-mono">Bs. {{ formatMoney(calculoResultado.monto_subtotal) }}</span>
              </div>
              <div class="flex justify-between text-emerald-200">
                <span>Recargo Iluminación Nocturna:</span>
                <span class="font-mono">Bs. {{ formatMoney(calculoResultado.monto_recargo_cessa) }}</span>
              </div>
              <div class="border-t border-emerald-700 pt-1.5 flex justify-between font-bold text-white text-sm">
                <span>Total a Cobrar:</span>
                <span class="font-mono text-emerald-300">Bs. {{ formatMoney(calculoResultado.monto_total) }}</span>
              </div>
            </div>

            <p v-if="calculoResultado.tarifa_aplicada?.observaciones" class="text-[11px] text-emerald-300/80 italic">
              * {{ calculoResultado.tarifa_aplicada.observaciones }}
            </p>
          </div>

          <div v-else class="text-center py-10 text-emerald-300/60 text-xs">
            Seleccione las opciones y haga clic en "Calcular Tarifa" para obtener el presupuesto oficial.
          </div>
        </div>

        <div v-if="calculoResultado" class="pt-6">
          <button
            @click="generarOrdenLiquidacion"
            :disabled="!cotizadorForm.solicitante_nombre"
            class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-emerald-600 text-emerald-950 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Emitir Orden de Liquidación
          </button>
          <p v-if="!cotizadorForm.solicitante_nombre" class="text-[11px] text-amber-400 text-center mt-2">
            * Ingrese el nombre del solicitante para habilitar la emisión.
          </p>
        </div>
      </div>
    </div>

    <!-- TAB 2: LIQUIDACIONES Y RECIBOS -->
    <div v-if="activeTab === 'liquidaciones'" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900">Histórico de Ordenes de Liquidación y Recibos</h2>
          <p class="text-xs text-gray-500 mt-0.5">Control de pagos, emisión de recibos y exenciones con respaldo normativo.</p>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="filtroEstado"
            @change="fetchLiquidaciones"
            class="rounded-xl border-gray-200 text-xs py-2"
          >
            <option value="">Todos los Estados</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="PAGADO">PAGADO</option>
            <option value="EXENTO">EXENTO</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-gray-600">
          <thead class="bg-gray-50 text-gray-700 uppercase text-[10px] tracking-wider border-y border-gray-100">
            <tr>
              <th class="py-3 px-4">Código</th>
              <th class="py-3 px-4">Solicitante</th>
              <th class="py-3 px-4">Escenario / Espacio</th>
              <th class="py-3 px-4">Fecha Uso</th>
              <th class="py-3 px-4 text-right">Monto Total</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="liq in liquidaciones" :key="liq.id" class="hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4 font-mono font-bold text-gray-900">{{ liq.codigo_liquidacion }}</td>
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{{ liq.solicitante_nombre }}</div>
                <div class="text-[10px] text-gray-400">CI/NIT: {{ liq.solicitante_ci_nit || 'N/A' }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{{ liq.escenario_nombre }}</div>
                <div class="text-[10px] text-emerald-700">{{ liq.espacio }}</div>
              </td>
              <td class="py-3 px-4">
                <div>{{ liq.fecha_uso }}</div>
                <div class="text-[10px] text-gray-400">{{ liq.turno }} ({{ liq.duracion_horas }}h)</div>
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-gray-900">
                Bs. {{ formatMoney(liq.monto_total) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    liq.estado === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' :
                    liq.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                    'bg-purple-100 text-purple-800'
                  ]"
                >
                  {{ liq.estado }}
                </span>
              </td>
              <td class="py-3 px-4 text-center space-x-1">
                <button
                  v-if="liq.estado === 'PENDIENTE'"
                  @click="abrirModalPago(liq)"
                  class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Cobrar
                </button>
                <button
                  v-if="liq.estado === 'PENDIENTE'"
                  @click="abrirModalExencion(liq)"
                  class="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Exención
                </button>
                <button
                  v-if="liq.estado === 'PAGADO' && liq.recibo"
                  @click="abrirModalReciboImprimible(liq)"
                  class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 inline-flex"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Ver Recibo
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: CATÁLOGO OFICIAL NORMALIZADO (AUDITABLE) -->
    <div v-if="activeTab === 'catalogo'" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-gray-900">Catálogo Oficial de Tarifas (RAG CH/N.º 011/2024)</h2>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Auditado & Normalizado
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">
            Recintos homologados únicos. Seleccione el Tipo de Usuario y Concepto para auditar o cotizar la tarifa exacta.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input
            type="text"
            v-model="busquedaTarifa"
            placeholder="Buscar por recinto o espacio..."
            class="rounded-xl border-gray-200 text-xs py-2 px-3 w-56 focus:ring-emerald-500 focus:border-emerald-500"
          />

          <select
            v-model="filtroCatalogoTipoUsuario"
            @change="onGlobalTipoUsuarioChange"
            class="rounded-xl border-gray-200 text-xs py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
          >
            <option value="">Todos los Tipos de Usuario</option>
            <option v-for="tu in tiposUsuarioList" :key="tu" :value="tu">{{ tu }}</option>
          </select>

          <select
            v-model="filtroCatalogoConcepto"
            class="rounded-xl border-gray-200 text-xs py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
          >
            <option value="">Todos los Conceptos</option>
            <option v-for="c in conceptosList" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <!-- Barra de Estado de Auditoría -->
      <div class="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
        <div class="flex items-center gap-2">
          <span class="font-bold">🏛️ {{ espaciosTarifario.length }} Espacios Deportivos Únicos Homologados</span>
          <span class="text-gray-400">•</span>
          <span class="text-emerald-700">Resolución RAG CH/N.º 011/2024 (Aprobada y Vigente)</span>
        </div>
        <div class="text-[11px] text-emerald-700 font-medium">
          Mostrando <strong>{{ espaciosCatalogoFiltrados.length }}</strong> de {{ espaciosTarifario.length }} recintos
        </div>
      </div>

      <!-- Tabla de Espacios Únicos con Selectores Dinámicos en Fila -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-gray-600">
          <thead class="bg-gray-50 text-gray-700 uppercase text-[10px] tracking-wider border-y border-gray-100">
            <tr>
              <th class="py-3 px-4">Escenario Deportivo</th>
              <th class="py-3 px-4">Espacio Único</th>
              <th class="py-3 px-4">1º Tipo de Usuario</th>
              <th class="py-3 px-4">2º Concepto de Uso</th>
              <th class="py-3 px-4">Turno</th>
              <th class="py-3 px-4 text-right">Tarifa Oficial (Bs.)</th>
              <th class="py-3 px-4">Unidad</th>
              <th class="py-3 px-4 text-center">Acciones / Auditoría</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="esp in espaciosCatalogoFiltrados"
              :key="esp.id"
              class="hover:bg-emerald-50/30 transition-colors"
            >
              <!-- Escenario -->
              <td class="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-600">🏟️</span>
                  <span>{{ esp.escenario_nombre }}</span>
                </div>
              </td>

              <!-- Espacio -->
              <td class="py-3 px-4 text-emerald-900 font-bold whitespace-nowrap">
                {{ esp.espacio }}
              </td>

              <!-- Selector Tipo de Usuario -->
              <td class="py-2 px-3">
                <select
                  :value="seleccionesEspacio[esp.id]?.tipo_usuario"
                  @change="onRowTipoUsuarioChange(esp.id, $event.target.value)"
                  class="rounded-lg border-gray-200 text-[11px] py-1 px-2 font-medium w-48 bg-white focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option
                    v-for="tu in getTiposUsuarioDeEspacio(esp)"
                    :key="tu"
                    :value="tu"
                  >
                    {{ tu }}
                  </option>
                </select>
              </td>

              <!-- Selector Concepto -->
              <td class="py-2 px-3">
                <select
                  v-model="seleccionesEspacio[esp.id].concepto"
                  class="rounded-lg border-gray-200 text-[11px] py-1 px-2 font-medium w-44 bg-white focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option
                    v-for="c in getConceptosDeEspacioYUsuario(esp, seleccionesEspacio[esp.id]?.tipo_usuario)"
                    :key="c"
                    :value="c"
                  >
                    {{ c }}
                  </option>
                </select>
              </td>

              <!-- Turno -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-semibold"
                  :class="getTarifaActiva(esp)?.turno === 'Noche' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ getTarifaActiva(esp)?.turno || 'Dia' }}
                </span>
                <span
                  v-if="getTarifaActiva(esp)?.recargo_cessa"
                  class="ml-1 text-[9px] text-amber-700 font-bold"
                  title="Recargo Iluminación CESSA aplicable en noche"
                >
                  +⚡CESSA
                </span>
              </td>

              <!-- Tarifa -->
              <td class="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-800 whitespace-nowrap">
                <span v-if="getTarifaActiva(esp)?.modalidad === 'porcentaje'">
                  {{ formatMoney(getTarifaActiva(esp)?.valor) }}%
                </span>
                <span v-else>
                  Bs. {{ formatMoney(getTarifaActiva(esp)?.valor) }}
                </span>
              </td>

              <!-- Unidad -->
              <td class="py-3 px-4 font-medium text-gray-500 whitespace-nowrap">
                {{ getTarifaActiva(esp)?.unidad }}
              </td>

              <!-- Acciones -->
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    @click="verMatrizEspacio(esp)"
                    class="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                    title="Ver todas las tarifas homologadas para este espacio"
                  >
                    🔍 Ver Matriz ({{ esp.valores?.length || 0 }})
                  </button>
                  <button
                    @click="cotizarDesdeCatalogo(esp)"
                    class="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm"
                    title="Calcular en el cotizador con esta tarifa"
                  >
                    Cotizar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL MATRIZ COMPLETA DE TARIFAS POR ESPACIO (AUDITORÍA OFICIAL) -->
    <div v-if="showModalMatrizEspacio && espacioMatrizSeleccionado" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
        <div class="flex justify-between items-start border-b pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🏟️</span>
              <h3 class="text-base font-bold text-gray-900">
                Matriz Homologada: {{ espacioMatrizSeleccionado.escenario_nombre }} - {{ espacioMatrizSeleccionado.espacio }}
              </h3>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Resolución Administrativa RAG CH/N.º 011/2024 • Total de variaciones aprobadas: {{ espacioMatrizSeleccionado.valores?.length || 0 }}
            </p>
          </div>
          <button @click="showModalMatrizEspacio = false" class="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        <div class="overflow-x-auto max-h-96">
          <table class="w-full text-left text-xs text-gray-600">
            <thead class="bg-gray-50 text-gray-700 uppercase text-[10px] tracking-wider border-y">
              <tr>
                <th class="py-2.5 px-3">Tipo de Usuario</th>
                <th class="py-2.5 px-3">Concepto</th>
                <th class="py-2.5 px-3">Turno</th>
                <th class="py-2.5 px-3">Modalidad</th>
                <th class="py-2.5 px-3 text-right">Tarifa Oficial</th>
                <th class="py-2.5 px-3">Unidad</th>
                <th class="py-2.5 px-3">CESSA</th>
                <th class="py-2.5 px-3">Observaciones / Respaldo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="val in espacioMatrizSeleccionado.valores" :key="val.id" class="hover:bg-gray-50">
                <td class="py-2.5 px-3 font-semibold text-gray-900">{{ val.tipo_usuario }}</td>
                <td class="py-2.5 px-3 text-emerald-800 font-medium">{{ val.concepto }}</td>
                <td class="py-2.5 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100">
                    {{ val.turno }}
                  </span>
                </td>
                <td class="py-2.5 px-3 text-[11px] text-gray-500">{{ val.modalidad }}</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                  {{ val.modalidad === 'porcentaje' ? `${formatMoney(val.valor)}%` : `Bs. ${formatMoney(val.valor)}` }}
                </td>
                <td class="py-2.5 px-3 text-gray-500">{{ val.unidad }}</td>
                <td class="py-2.5 px-3 text-[11px]">
                  <span v-if="val.recargo_cessa" class="text-amber-600 font-bold">Sí (Nocturno)</span>
                  <span v-else class="text-gray-400">No</span>
                </td>
                <td class="py-2.5 px-3 text-[11px] text-gray-500 italic">{{ val.observaciones || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-3 border-t">
          <button @click="showModalMatrizEspacio = false" class="px-5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA RESERVA POR ASOCIACIÓN (BLOQUE 1) -->
    <div v-if="showModalNuevaReserva" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-emerald-100 max-h-[92vh] overflow-y-auto">
        <h3 class="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
          <span>📅</span> Solicitud de Reserva de Espacio Deportivo
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <!-- 1. Escenario Deportivo (Selector dinámico de todos los recintos) -->
          <div>
            <label class="block font-semibold text-gray-700 mb-1">Escenario Deportivo *</label>
            <select
              v-model="reservaForm.escenario_nombre"
              @change="onEscenarioReservaModalChange"
              class="w-full rounded-xl border-gray-200 py-2 text-xs font-bold bg-white focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option v-for="esc in listaEscenariosNombres" :key="esc" :value="esc">
                🏟️ {{ esc }}
              </option>
            </select>
          </div>

          <!-- 2. Espacio Específico (Selector dinámico dependiente del escenario) -->
          <div>
            <label class="block font-semibold text-gray-700 mb-1">Espacio Específico *</label>
            <select
              v-model="reservaForm.espacio"
              @change="onEspacioReservaModalChange"
              class="w-full rounded-xl border-gray-200 py-2 text-xs font-bold text-emerald-800 bg-white focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option v-for="esp in espaciosDisponiblesModal" :key="esp" :value="esp">
                📍 {{ esp }}
              </option>
            </select>
          </div>

          <!-- 3. Solicitante (Asociación, Club o Particular) -->
          <div class="md:col-span-2">
            <label class="block font-semibold text-gray-700 mb-1">Solicitante (Asociación / Club / Particular) *</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                v-model="solicitanteTipoSeleccion"
                @change="onSolicitanteTipoChange"
                class="rounded-xl border-gray-200 py-2 text-xs font-semibold bg-gray-50"
              >
                <option value="ASOCIACION">Asociación Departamental Afiliada</option>
                <option value="OTRO">Otro Club / Escuela / Particular</option>
              </select>

              <select
                v-if="solicitanteTipoSeleccion === 'ASOCIACION'"
                v-model="asociacionSeleccionadaModal"
                @change="onAsociacionSeleccionadaModalChange"
                class="rounded-xl border-gray-200 py-2 text-xs font-medium"
              >
                <option value="">-- Seleccionar Asociación --</option>
                <option v-for="aso in asociacionesLista" :key="aso.id" :value="aso.nombre">
                  {{ aso.nombre }} ({{ aso.sigla || aso.disciplina }})
                </option>
              </select>

              <input
                v-else
                type="text"
                v-model="reservaForm.solicitante_nombre"
                placeholder="Nombre de la Institución o Particular"
                class="rounded-xl border-gray-200 py-2 text-xs"
                required
              />
            </div>
          </div>

          <!-- 4. Disciplina Deportiva -->
          <div>
            <label class="block font-semibold text-gray-700 mb-1">Disciplina *</label>
            <select v-model="reservaForm.disciplina" class="w-full rounded-xl border-gray-200 py-2 font-semibold bg-white">
              <option value="Fútbol">Fútbol</option>
              <option value="Atletismo">Atletismo</option>
              <option value="Baloncesto">Baloncesto</option>
              <option value="Voleibol">Voleibol</option>
              <option value="Futsal">Futsal</option>
              <option value="Ráquetbol">Ráquetbol</option>
              <option value="Karate">Karate / Lucha</option>
              <option value="Tenis de Mesa">Tenis de Mesa / Billar</option>
              <option value="Gimnasia">Gimnasia</option>
              <option value="Deporte General">Deporte General / Extradeportivo</option>
            </select>
          </div>

          <!-- 5. Fecha de Uso -->
          <div>
            <label class="block font-semibold text-gray-700 mb-1">Fecha de Uso *</label>
            <input
              type="date"
              v-model="reservaForm.fecha_uso"
              :min="todayStr"
              @change="cargarDisponibilidadModal"
              class="w-full rounded-xl border-gray-200 py-2 font-semibold bg-white"
            />
          </div>

          <!-- 6. Turno Horario Operativo -->
          <div class="md:col-span-2">
            <label class="block font-semibold text-gray-700 mb-1">Turno Horario Operativo *</label>
            <select v-model="reservaForm.turno" @change="onTurnoChange" class="w-full rounded-xl border-gray-200 py-2 font-semibold bg-white">
              <option value="Dia">☀️ Turno Día (06:00 - 18:00)</option>
              <option value="Noche">🌙 Turno Noche (18:00 - 22:00) + Iluminación CESSA</option>
            </select>
          </div>

          <!-- 7. Franjas Disponibles Interactivas (Solo aparecen las disponibles) -->
          <div class="md:col-span-2 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-bold text-[11px] text-emerald-950 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Horarios Disponibles para Reserva ({{ reservaForm.turno === 'Dia' ? '06:00 - 18:00' : '18:00 - 22:00' }}):
              </span>
              <span class="text-[10px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                {{ franjasDisponiblesModal.length }} franja(s) libre(s)
              </span>
            </div>

            <!-- Botones interactivos de franjas libres -->
            <div v-if="franjasDisponiblesModal.length > 0" class="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                v-for="franja in franjasDisponiblesModal"
                :key="franja.hora_inicio"
                @click="seleccionarFranjaRapida(franja)"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer',
                  reservaForm.hora_inicio === franja.hora_inicio
                    ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                ]"
              >
                <span>⚡</span> {{ franja.hora_inicio }} - {{ franja.hora_fin }}
              </button>
            </div>
            <div v-else class="text-[11px] text-amber-800 font-semibold p-2 bg-amber-50 rounded-lg border border-amber-200">
              ⚠️ No hay horarios disponibles para este espacio en la fecha y turno seleccionados. Todos los horarios se encuentran reservados.
            </div>
          </div>

          <!-- 8. Selectores de Hora Inicio y Hora Fin (Excluyen reservados y madrugada) -->
          <div>
            <label class="block font-semibold text-gray-700 mb-1">Hora Inicio *</label>
            <select
              v-model="reservaForm.hora_inicio"
              @change="onHoraInicioModalChange"
              class="w-full rounded-xl border-gray-200 py-2 text-xs font-mono font-bold text-gray-900 bg-white"
              :disabled="franjasDisponiblesModal.length === 0"
            >
              <option value="" disabled>-- Seleccione horario libre --</option>
              <option v-for="franja in franjasDisponiblesModal" :key="franja.hora_inicio" :value="franja.hora_inicio">
                {{ franja.hora_inicio }} (Disponible)
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-gray-700 mb-1">Hora Fin / Duración *</label>
            <select
              v-model="reservaForm.hora_fin"
              @change="onHoraFinModalChange"
              class="w-full rounded-xl border-gray-200 py-2 text-xs font-mono font-bold text-gray-900 bg-white"
              :disabled="!reservaForm.hora_inicio || opcionesHoraFinModal.length === 0"
            >
              <option v-for="opt in opcionesHoraFinModal" :key="opt.hora_fin" :value="opt.hora_fin">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Concepto / Motivo de Uso *</label>
          <input
            type="text"
            v-model="reservaForm.concepto"
            placeholder="Ej. Partido Oficial Torneo Apertura / Entrenamiento"
            class="w-full rounded-xl border-gray-200 text-xs py-2"
            required
          />
        </div>

        <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900">
          <p class="font-bold">✔ Generación Automática de Liquidación:</p>
          <p class="text-[11px] mt-0.5">Al registrar la reserva, el sistema aplicará la matriz RAG 011/2024 y generará automáticamente una Liquidación de Pago en estado PENDIENTE.</p>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t">
          <button @click="showModalNuevaReserva = false" class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
          <button
            @click="confirmarNuevaReserva"
            class="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!reservaForm.hora_inicio || !reservaForm.hora_fin || franjasDisponiblesModal.length === 0"
          >
            Confirmar Reserva & Liquidación
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE PAGO / RECIBO -->
    <div v-if="showModalPago" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-base font-bold text-gray-900 border-b pb-2">Emitir Recibo Oficial y Registrar Cobro</h3>

        <div v-if="selectedLiquidacion" class="text-xs space-y-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <div class="flex justify-between">
            <span class="text-gray-600">Código Liquidación:</span>
            <span class="font-bold text-gray-900 font-mono">{{ selectedLiquidacion.codigo_liquidacion }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Solicitante:</span>
            <span class="font-medium text-gray-900">{{ selectedLiquidacion.solicitante_nombre }}</span>
          </div>
          <div class="flex justify-between border-t border-emerald-200 pt-1 font-bold text-sm">
            <span class="text-emerald-900">Total a Cobrar:</span>
            <span class="text-emerald-700 font-mono">Bs. {{ formatMoney(selectedLiquidacion.monto_total) }}</span>
          </div>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-gray-700 mb-1">Medio de Pago *</label>
            <select v-model="pagoForm.medio_pago" class="w-full rounded-xl border-gray-200 py-2">
              <option value="EFECTIVO">Efectivo en Caja</option>
              <option value="DEPOSITO_BANCARIO">Depósito Bancario (BNB/Union)</option>
              <option value="TRANSFERENCIA">Transferencia Electrónica</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-gray-700 mb-1">Nº Comprobante / Depósito (si aplica)</label>
            <input
              type="text"
              v-model="pagoForm.numero_comprobante_bancario"
              placeholder="Ej. DEP-BNB-88392"
              class="w-full rounded-xl border-gray-200 py-2"
            />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input type="checkbox" id="dep24h" v-model="pagoForm.depositado_24h" class="rounded text-emerald-600" />
            <label for="dep24h" class="text-gray-700">Depósito verificado dentro de las 24 horas (SAFCO)</label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t">
          <button @click="showModalPago = false" class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
          <button @click="confirmarPago" class="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md">Confirmar Pago & Emitir Recibo</button>
        </div>
      </div>
    </div>

    <!-- MODAL EXENCIÓN -->
    <div v-if="showModalExencion" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-base font-bold text-gray-900 border-b pb-2">Registrar Exención Legal (RAG 011/2024 Art. 12)</h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-gray-700 mb-1">Motivo Justificado de Exención *</label>
            <textarea
              v-model="exencionForm.exencion_motivo"
              rows="3"
              placeholder="Fomento al deporte infanto-juvenil / Evento benéfico gubernamental sin fines de lucro..."
              class="w-full rounded-xl border-gray-200 py-2"
            ></textarea>
          </div>

          <div>
            <label class="block font-semibold text-gray-700 mb-1">Autorizado por *</label>
            <input
              type="text"
              v-model="exencionForm.exencion_autorizado_por"
              placeholder="Recomendación Director SEDEDE & Autorización MAE"
              class="w-full rounded-xl border-gray-200 py-2"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t">
          <button @click="showModalExencion = false" class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
          <button @click="confirmarExencion" class="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-md">Registrar Exención</button>
        </div>
      </div>
    </div>

    <!-- MODAL RECIBO IMPRIMIBLE OFICIAL -->
    <div v-if="showModalReciboImprimible" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl space-y-6 text-gray-900 relative">
        <button @click="showModalReciboImprimible = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          ✕
        </button>

        <div class="border-b-2 border-emerald-800 pb-4 text-center">
          <h2 class="text-sm font-bold uppercase tracking-wider text-emerald-900">GOBIERNO AUTÓNOMO DEPARTAMENTAL DE CHUQUISACA</h2>
          <h3 class="text-xs font-semibold text-gray-700 uppercase">SERVICIO DEPARTAMENTAL DE DEPORTES (SE.DE.DE)</h3>
          <p class="text-[10px] text-gray-500 mt-1">RECIBO DE RECAUDACIÓN DE INGRESOS PROPIOS - RAG CH/N.º 011/2024</p>
        </div>

        <div v-if="selectedLiquidacion && selectedLiquidacion.recibo" class="space-y-4 text-xs">
          <div class="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <div>
              <p class="text-gray-500">Nº Recibo:</p>
              <p class="text-sm font-bold text-emerald-900 font-mono">{{ selectedLiquidacion.recibo.numero_recibo }}</p>
            </div>
            <div class="text-right">
              <p class="text-gray-500">Nº Liquidación:</p>
              <p class="text-sm font-bold text-gray-800 font-mono">{{ selectedLiquidacion.codigo_liquidacion }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-gray-500">Solicitante:</p>
              <p class="font-bold text-gray-900">{{ selectedLiquidacion.solicitante_nombre }}</p>
            </div>
            <div>
              <p class="text-gray-500">CI / NIT:</p>
              <p class="font-bold text-gray-900">{{ selectedLiquidacion.solicitante_ci_nit || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-gray-500">Escenario y Espacio:</p>
              <p class="font-bold text-gray-900">{{ selectedLiquidacion.escenario_nombre }} - {{ selectedLiquidacion.espacio }}</p>
            </div>
            <div>
              <p class="text-gray-500">Fecha de Uso:</p>
              <p class="font-bold text-gray-900">{{ selectedLiquidacion.fecha_uso }} ({{ selectedLiquidacion.turno }})</p>
            </div>
          </div>

          <table class="w-full border border-gray-200 text-left mt-2">
            <thead class="bg-gray-100 font-bold uppercase text-[10px]">
              <tr>
                <th class="p-2 border-b">Concepto</th>
                <th class="p-2 border-b text-right">Subtotal</th>
                <th class="p-2 border-b text-right">Iluminación</th>
                <th class="p-2 border-b text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="p-2 border-b">{{ selectedLiquidacion.concepto }} ({{ selectedLiquidacion.tipo_usuario }})</td>
                <td class="p-2 border-b text-right font-mono">Bs. {{ formatMoney(selectedLiquidacion.monto_subtotal) }}</td>
                <td class="p-2 border-b text-right font-mono">Bs. {{ formatMoney(selectedLiquidacion.monto_recargo_cessa) }}</td>
                <td class="p-2 border-b text-right font-bold font-mono text-emerald-800">Bs. {{ formatMoney(selectedLiquidacion.monto_total) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="flex justify-between items-center text-[11px] pt-2">
            <div>
              <p><span class="font-semibold">Medio de Pago:</span> {{ selectedLiquidacion.recibo.medio_pago }}</p>
              <p><span class="font-semibold">Fecha Cobro:</span> {{ selectedLiquidacion.recibo.fecha_cobro }}</p>
            </div>
            <div class="text-right">
              <p class="text-base font-bold text-emerald-950 font-mono">TOTAL PAGADO: Bs. {{ formatMoney(selectedLiquidacion.monto_total) }}</p>
            </div>
          </div>
        </div>

        <div class="border-t pt-4 flex justify-between items-center">
          <div class="text-[10px] text-gray-400">
            Documento fiscal generado digitalmente por SEDEDE System.
          </div>
          <button @click="imprimirRecibo" class="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2">
            🖨️ Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { tarifarioService } from '../services/tarifarioService'
import { escenarioService } from '../services/escenarioService'
import { asociacionService } from '../services/asociacionService'

const activeTab = ref('calendario')
const tarifas = ref([])
const liquidaciones = ref([])
const escenarios = ref([])
const reservas = ref([])
const resumen = ref({
  total_recaudado: 0,
  total_pendiente: 0,
  total_exenciones: 0,
  total_liquidaciones: 0,
  cumplimiento_deposito_24h: 100,
})

// Estado para Catálogo Normalizado y Auditoría
const espaciosTarifario = ref([])
const tiposUsuarioList = ref([])
const conceptosList = ref([])
const resolucionTarifario = ref(null)
const filtroCatalogoTipoUsuario = ref('')
const filtroCatalogoConcepto = ref('')
const seleccionesEspacio = ref({})
const showModalMatrizEspacio = ref(false)
const espacioMatrizSeleccionado = ref(null)

const filtroDisciplina = ref('')
const filtroEscenario = ref('')
const filtroEstado = ref('')
const busquedaTarifa = ref('')

const currentYear = ref(2026)
const currentMonth = ref(8) // 8 = Septiembre (0-indexed)
const espacioSeleccionadoClave = ref('TODOS')

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const monthYearLabel = computed(() => {
  return `${monthNames[currentMonth.value]} ${currentYear.value}`
})

const listaEspaciosOpciones = computed(() => {
  const options = []
  escenarios.value.forEach(esc => {
    let listDisc = esc.disciplinas || []
    if (typeof listDisc === 'string') {
      try { listDisc = JSON.parse(listDisc) } catch { listDisc = [listDisc] }
    }
    if (filtroDisciplina.value && listDisc.length > 0 && !listDisc.includes(filtroDisciplina.value)) {
      return
    }
    const clave = `${esc.nombre} | ${esc.espacio}`
    if (!options.some(o => o.clave === clave)) {
      options.push({
        clave,
        escenario_nombre: esc.nombre,
        espacio: esc.espacio,
        id: esc.id,
        disciplinaDefault: listDisc.length > 0 ? listDisc[0] : 'Fútbol'
      })
    }
  })
  return options
})

const espacioSeleccionadoInfo = computed(() => {
  if (espacioSeleccionadoClave.value === 'TODOS') return null
  return listaEspaciosOpciones.value.find(o => o.clave === espacioSeleccionadoClave.value) || null
})

const firstDayIndex = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  return d.getDay()
})

const daysInCurrentMonthCount = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const monthCalendarDays = computed(() => {
  const days = []
  const todayStr = new Date().toISOString().split('T')[0]
  const totalDays = daysInCurrentMonthCount.value

  for (let day = 1; day <= totalDays; day++) {
    const mm = String(currentMonth.value + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const dateStr = `${currentYear.value}-${mm}-${dd}`

    const reservasEnDia = reservas.value.filter(r => {
      if (!r.fecha_uso) return false
      const rFecha = r.fecha_uso.split('T')[0]
      if (rFecha !== dateStr) return false

      if (espacioSeleccionadoClave.value !== 'TODOS') {
        const info = espacioSeleccionadoInfo.value
        if (info && (r.escenario_nombre !== info.escenario_nombre || r.espacio !== info.espacio)) {
          return false
        }
      }
      return true
    })

    let status = 'LIBRE'
    if (reservasEnDia.some(r => r.estado === 'CONFIRMADA' || r.estado === 'LIQUIDADA')) {
      status = 'RESERVADO'
    } else if (reservasEnDia.some(r => r.estado === 'PENDIENTE')) {
      status = 'PENDIENTE'
    }

    days.push({
      dayNumber: day,
      dateStr,
      isToday: dateStr === todayStr,
      status,
      reservas: reservasEnDia
    })
  }
  return days
})

const reservasDelMesFiltradas = computed(() => {
  const mm = String(currentMonth.value + 1).padStart(2, '0')
  const monthPrefix = `${currentYear.value}-${mm}`

  return reservas.value.filter(r => {
    if (!r.fecha_uso) return false
    const rFecha = r.fecha_uso.split('T')[0]
    if (!rFecha.startsWith(monthPrefix)) return false

    if (espacioSeleccionadoClave.value !== 'TODOS') {
      const info = espacioSeleccionadoInfo.value
      if (info && (r.escenario_nombre !== info.escenario_nombre || r.espacio !== info.espacio)) {
        return false
      }
    }
    return true
  })
})

const todayStr = new Date().toISOString().split('T')[0]
const diaSeleccionado = ref(todayStr)
const vistaSubCalendario = ref('horarios')
const franjasDiaSeleccionado = ref([])
const loadingFranjasDia = ref(false)

const asociacionesLista = ref([])
const solicitanteTipoSeleccion = ref('ASOCIACION')
const asociacionSeleccionadaModal = ref('')
const franjasOcupacionModal = ref([])
const loadingDisponibilidadModal = ref(false)

const fechaSeleccionadaFormateada = computed(() => {
  if (!diaSeleccionado.value) return ''
  const parts = diaSeleccionado.value.split('-')
  if (parts.length < 3) return diaSeleccionado.value
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return `${diasSemana[d.getDay()]}, ${parts[2]} de ${monthNames[parseInt(parts[1], 10) - 1]} de ${parts[0]}`
})

const listaEscenariosNombres = computed(() => {
  const set = new Set()
  escenarios.value.forEach(e => {
    if (e.nombre) set.add(e.nombre)
  })
  if (set.size === 0) {
    return [
      'Estadio Patria',
      'Coliseo Tito Alfred',
      'Coliseo Tercera Fase',
      'Coliseo Jorge Revilla Aldana',
      'Coliseo Evo Morales Ayma I',
      'Coliseo Evo Morales Ayma II',
      'Coliseo Esteban Urquizu Cuéllar',
      'Campo de Tiro Santiago Arana',
      'Complejo Tenis La Madona',
      'Frontones Departamentales'
    ]
  }
  return Array.from(set)
})

const espaciosDisponiblesModal = computed(() => {
  const match = escenarios.value.filter(e => e.nombre === reservaForm.value.escenario_nombre)
  const espSet = new Set()
  match.forEach(e => {
    if (e.espacio) espSet.add(e.espacio)
  })
  if (espSet.size === 0) {
    return ['Óvalo Central', 'Cancha Principal']
  }
  return Array.from(espSet)
})

const franjasDisponiblesModal = computed(() => {
  return franjasOcupacionModal.value.filter(f => f.disponible)
})

const opcionesHoraFinModal = computed(() => {
  if (!reservaForm.value.hora_inicio) return []
  const startHour = parseInt(reservaForm.value.hora_inicio.split(':')[0], 10)
  const maxHour = reservaForm.value.turno === 'Dia' ? 18 : 22
  const options = []

  for (let h = startHour + 1; h <= maxHour; h++) {
    const prevHourStr = String(h - 1).padStart(2, '0') + ':00'
    const slot = franjasOcupacionModal.value.find(f => f.hora_inicio === prevHourStr)
    if (slot && !slot.disponible) {
      break
    }
    const endStr = String(h).padStart(2, '0') + ':00'
    const duration = h - startHour
    options.push({
      hora_fin: endStr,
      duration,
      label: `${endStr} (${duration} hora${duration > 1 ? 's' : ''})`
    })
  }
  return options
})

function onHoraInicioModalChange() {
  if (opcionesHoraFinModal.value.length > 0) {
    reservaForm.value.hora_fin = opcionesHoraFinModal.value[0].hora_fin
    reservaForm.value.duracion_horas = opcionesHoraFinModal.value[0].duration
  }
}

function onHoraFinModalChange() {
  const match = opcionesHoraFinModal.value.find(o => o.hora_fin === reservaForm.value.hora_fin)
  if (match) {
    reservaForm.value.duracion_horas = match.duration
  }
}

function seleccionarFranjaRapida(franja) {
  reservaForm.value.hora_inicio = franja.hora_inicio
  reservaForm.value.hora_fin = franja.hora_fin
  reservaForm.value.duracion_horas = 1.0
}

function onEscenarioReservaModalChange() {
  const disponibles = espaciosDisponiblesModal.value
  if (disponibles.length > 0) {
    reservaForm.value.espacio = disponibles[0]
  }
  const matchEsc = escenarios.value.find(e => e.nombre === reservaForm.value.escenario_nombre && e.espacio === reservaForm.value.espacio)
  if (matchEsc) {
    reservaForm.value.escenario_id = matchEsc.id
    if (matchEsc.disciplinas && matchEsc.disciplinas.length > 0) {
      reservaForm.value.disciplina = matchEsc.disciplinas[0]
    }
  }
  cargarDisponibilidadModal()
}

function onEspacioReservaModalChange() {
  const matchEsc = escenarios.value.find(e => e.nombre === reservaForm.value.escenario_nombre && e.espacio === reservaForm.value.espacio)
  if (matchEsc) {
    reservaForm.value.escenario_id = matchEsc.id
    if (matchEsc.disciplinas && matchEsc.disciplinas.length > 0) {
      reservaForm.value.disciplina = matchEsc.disciplinas[0]
    }
  }
  cargarDisponibilidadModal()
}

function onTurnoChange() {
  cargarDisponibilidadModal()
}

async function fetchAsociaciones() {
  try {
    const list = await asociacionService.list()
    asociacionesLista.value = list
    if (list.length > 0 && !reservaForm.value.solicitante_nombre) {
      asociacionSeleccionadaModal.value = list[0].nombre
      onAsociacionSeleccionadaModalChange()
    }
  } catch (err) {
    console.error('Error al cargar asociaciones:', err)
  }
}

function onAsociacionSeleccionadaModalChange() {
  const aso = asociacionesLista.value.find(a => a.nombre === asociacionSeleccionadaModal.value)
  if (aso) {
    reservaForm.value.asociacion_id = aso.id
    reservaForm.value.solicitante_nombre = aso.nombre
    if (aso.disciplina) {
      reservaForm.value.disciplina = aso.disciplina
    }
  }
}

function onSolicitanteTipoChange() {
  if (solicitanteTipoSeleccion.value === 'OTRO') {
    reservaForm.value.asociacion_id = null
    reservaForm.value.solicitante_nombre = ''
  } else if (asociacionesLista.value.length > 0) {
    asociacionSeleccionadaModal.value = asociacionesLista.value[0].nombre
    onAsociacionSeleccionadaModalChange()
  }
}

function seleccionarDiaCalendario(dayObj) {
  diaSeleccionado.value = dayObj.dateStr
  vistaSubCalendario.value = 'horarios'
  cargarFranjasDiaSeleccionado()
}

async function cargarFranjasDiaSeleccionado() {
  loadingFranjasDia.value = true
  try {
    const params = {
      fecha: diaSeleccionado.value,
    }
    if (espacioSeleccionadoInfo.value) {
      params.escenario_nombre = espacioSeleccionadoInfo.value.escenario_nombre
      params.espacio = espacioSeleccionadoInfo.value.espacio
      params.escenario_id = espacioSeleccionadoInfo.value.id
    }
    const res = await escenarioService.getDisponibilidad(params)
    franjasDiaSeleccionado.value = res.franjas || []
  } catch (err) {
    console.error('Error al cargar franjas del día:', err)
  } finally {
    loadingFranjasDia.value = false
  }
}

async function cargarDisponibilidadModal() {
  if (!reservaForm.value.fecha_uso || !reservaForm.value.escenario_nombre || !reservaForm.value.espacio) return
  loadingDisponibilidadModal.value = true
  try {
    const res = await escenarioService.getDisponibilidad({
      fecha: reservaForm.value.fecha_uso,
      escenario_nombre: reservaForm.value.escenario_nombre,
      espacio: reservaForm.value.espacio,
      turno: reservaForm.value.turno,
    })
    franjasOcupacionModal.value = res.franjas || []

    const libres = res.franjas.filter(f => f.disponible)
    if (libres.length > 0) {
      const match = libres.find(f => f.hora_inicio === reservaForm.value.hora_inicio)
      if (!match) {
        reservaForm.value.hora_inicio = libres[0].hora_inicio
        reservaForm.value.hora_fin = libres[0].hora_fin
        reservaForm.value.duracion_horas = 1.0
      }
    } else {
      reservaForm.value.hora_inicio = ''
      reservaForm.value.hora_fin = ''
      reservaForm.value.duracion_horas = 0
    }
  } catch (err) {
    console.error('Error al cargar disponibilidad modal:', err)
  } finally {
    loadingDisponibilidadModal.value = false
  }
}

function mesAnterior() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  fetchOcupacion()
}

function mesSiguiente() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  fetchOcupacion()
}

function onDisciplinaFilterChange() {
  espacioSeleccionadoClave.value = 'TODOS'
  fetchOcupacion()
}

function abrirModalNuevaReservaConEspacio(dayObj = null) {
  if (espacioSeleccionadoInfo.value) {
    reservaForm.value.escenario_id = espacioSeleccionadoInfo.value.id
    reservaForm.value.escenario_nombre = espacioSeleccionadoInfo.value.escenario_nombre
    reservaForm.value.espacio = espacioSeleccionadoInfo.value.espacio
    reservaForm.value.disciplina = espacioSeleccionadoInfo.value.disciplinaDefault
  } else if (!reservaForm.value.escenario_nombre && listaEscenariosNombres.value.length > 0) {
    reservaForm.value.escenario_nombre = listaEscenariosNombres.value[0]
    const espList = espaciosDisponiblesModal.value
    if (espList.length > 0) reservaForm.value.espacio = espList[0]
  }

  if (dayObj) {
    reservaForm.value.fecha_uso = dayObj.dateStr
  } else if (!reservaForm.value.fecha_uso) {
    reservaForm.value.fecha_uso = diaSeleccionado.value || todayStr
  }

  cargarDisponibilidadModal()
  showModalNuevaReserva.value = true
}

function abrirModalReservaParaDia(fecha) {
  reservaForm.value.fecha_uso = fecha
  abrirModalNuevaReservaConEspacio()
}

function reservarFranjaEspecifica(franja) {
  reservaForm.value.fecha_uso = diaSeleccionado.value
  reservaForm.value.turno = franja.turno
  if (espacioSeleccionadoInfo.value) {
    reservaForm.value.escenario_id = espacioSeleccionadoInfo.value.id
    reservaForm.value.escenario_nombre = espacioSeleccionadoInfo.value.escenario_nombre
    reservaForm.value.espacio = espacioSeleccionadoInfo.value.espacio
  }
  reservaForm.value.hora_inicio = franja.hora_inicio
  reservaForm.value.hora_fin = franja.hora_fin
  reservaForm.value.duracion_horas = 1.0
  cargarDisponibilidadModal()
  showModalNuevaReserva.value = true
}

function onDayClick(dayObj) {
  seleccionarDiaCalendario(dayObj)
}

const cotizadorForm = ref({
  escenario_nombre: 'Estadio Patria',
  espacio: 'Óvalo Central',
  concepto: 'Entrenamiento',
  tipo_usuario: 'Equipo Local Profesional',
  turno: 'Dia',
  duracion_horas: 2.0,
  monto_taquilla_declarado: 0,
  solicitante_nombre: '',
  solicitante_ci_nit: '',
})

const calculoResultado = ref(null)

// Modales
const showModalPago = ref(false)
const showModalExencion = ref(false)
const showModalReciboImprimible = ref(false)
const showModalNuevaReserva = ref(false)
const selectedLiquidacion = ref(null)

const pagoForm = ref({
  medio_pago: 'EFECTIVO',
  numero_comprobante_bancario: '',
  depositado_24h: true,
})

const exencionForm = ref({
  exencion_motivo: '',
  exencion_autorizado_por: '',
})

const reservaForm = ref({
  escenario_id: null,
  escenario_nombre: 'Estadio Patria',
  espacio: 'Óvalo Central',
  asociacion_id: null,
  solicitante_nombre: 'Asociación Chuquisaqueña de Fútbol',
  disciplina: 'Fútbol',
  concepto: 'Partido Oficial Torneo Apertura',
  fecha_uso: todayStr,
  hora_inicio: '18:00',
  hora_fin: '19:00',
  duracion_horas: 1.0,
  turno: 'Dia',
})

const mapaEspacios = {
  'Estadio Patria': ['Óvalo Central', 'Sintética Pequeña', 'Frontis Estadio Patria', 'JRA (Óvalo)'],
  'Coliseo Tito Alfred': ['Cancha Principal'],
  'Coliseo Tercera Fase': ['Cancha Futsal y Voleibol', 'Cafetería 2º Piso'],
  'Coliseo Jorge Revilla Aldana': ['Cancha Principal JRA', 'Kiosco 2m x 3m'],
  'Campo de Tiro Santiago Arana': ['Área de Tiro'],
}

// Inicializar selecciones por espacio para la tabla normalizada
function initSeleccionesEspacio() {
  espaciosTarifario.value.forEach(esp => {
    if (!seleccionesEspacio.value[esp.id]) {
      const primerValor = esp.valores?.[0]
      seleccionesEspacio.value[esp.id] = {
        tipo_usuario: primerValor ? primerValor.tipo_usuario : '',
        concepto: primerValor ? primerValor.concepto : '',
      }
    }
  })
}

// Catálogo filtrado por búsqueda y selectores globales
const espaciosCatalogoFiltrados = computed(() => {
  return espaciosTarifario.value.filter(esp => {
    if (busquedaTarifa.value) {
      const q = busquedaTarifa.value.toLowerCase()
      const matchTexto = (esp.escenario_nombre && esp.escenario_nombre.toLowerCase().includes(q)) ||
                         (esp.espacio && esp.espacio.toLowerCase().includes(q))
      if (!matchTexto) return false
    }

    if (filtroCatalogoTipoUsuario.value) {
      const tipos = getTiposUsuarioDeEspacio(esp)
      if (!tipos.some(t => t.toLowerCase().includes(filtroCatalogoTipoUsuario.value.toLowerCase()))) {
        return false
      }
    }

    if (filtroCatalogoConcepto.value) {
      const conceptos = esp.valores?.map(v => v.concepto) || []
      if (!conceptos.some(c => c.toLowerCase().includes(filtroCatalogoConcepto.value.toLowerCase()))) {
        return false
      }
    }

    return true
  })
})

function getTiposUsuarioDeEspacio(espacio) {
  if (!espacio || !espacio.valores) return []
  return [...new Set(espacio.valores.map(v => v.tipo_usuario))]
}

function getConceptosDeEspacioYUsuario(espacio, tipoUsuario) {
  if (!espacio || !espacio.valores) return []
  const filtrados = tipoUsuario
    ? espacio.valores.filter(v => v.tipo_usuario === tipoUsuario)
    : espacio.valores
  return [...new Set(filtrados.map(v => v.concepto))]
}

function getTarifaActiva(espacio) {
  if (!espacio || !espacio.valores || espacio.valores.length === 0) return null
  const sel = seleccionesEspacio.value[espacio.id]
  if (!sel) return espacio.valores[0]

  let match = espacio.valores.find(v => v.tipo_usuario === sel.tipo_usuario && v.concepto === sel.concepto)
  if (!match) {
    match = espacio.valores.find(v => v.tipo_usuario === sel.tipo_usuario)
  }
  return match || espacio.valores[0]
}

function onRowTipoUsuarioChange(espacioId, nuevoTipo) {
  const espacio = espaciosTarifario.value.find(e => e.id === espacioId)
  if (!espacio) return
  if (!seleccionesEspacio.value[espacioId]) {
    seleccionesEspacio.value[espacioId] = {}
  }
  seleccionesEspacio.value[espacioId].tipo_usuario = nuevoTipo
  const conceptos = getConceptosDeEspacioYUsuario(espacio, nuevoTipo)
  seleccionesEspacio.value[espacioId].concepto = conceptos[0] || ''
}

function onGlobalTipoUsuarioChange() {
  if (!filtroCatalogoTipoUsuario.value) return
  espaciosTarifario.value.forEach(esp => {
    const tipos = getTiposUsuarioDeEspacio(esp)
    if (tipos.includes(filtroCatalogoTipoUsuario.value)) {
      onRowTipoUsuarioChange(esp.id, filtroCatalogoTipoUsuario.value)
    }
  })
}

function verMatrizEspacio(espacio) {
  espacioMatrizSeleccionado.value = espacio
  showModalMatrizEspacio.value = true
}

function cotizarDesdeCatalogo(espacio) {
  const tarifa = getTarifaActiva(espacio)
  cotizadorForm.value.escenario_nombre = espacio.escenario_nombre
  cotizadorForm.value.espacio = espacio.espacio
  if (tarifa) {
    cotizadorForm.value.tipo_usuario = tarifa.tipo_usuario
    cotizadorForm.value.concepto = tarifa.concepto
    cotizadorForm.value.turno = (tarifa.turno === 'Noche') ? 'Noche' : 'Dia'
  }
  activeTab.value = 'cotizador'
  calcular()
}

// Cascada Dinámica para el Cotizador
const escenariosCotizador = computed(() => {
  if (espaciosTarifario.value.length === 0) {
    return ['Estadio Patria', 'Coliseo Tito Alfred', 'Coliseo Tercera Fase', 'Coliseo Jorge Revilla Aldana', 'Campo de Tiro Santiago Arana']
  }
  return [...new Set(espaciosTarifario.value.map(e => e.escenario_nombre))]
})

const espaciosCotizador = computed(() => {
  const filtered = espaciosTarifario.value.filter(e => e.escenario_nombre === cotizadorForm.value.escenario_nombre)
  if (filtered.length === 0) {
    return mapaEspacios[cotizadorForm.value.escenario_nombre] || ['Área General']
  }
  return filtered.map(e => e.espacio)
})

const espacioActualCotizador = computed(() => {
  return espaciosTarifario.value.find(e =>
    e.escenario_nombre === cotizadorForm.value.escenario_nombre &&
    e.espacio === cotizadorForm.value.espacio
  ) || null
})

const tiposUsuarioCotizador = computed(() => {
  if (!espacioActualCotizador.value || !espacioActualCotizador.value.valores || espacioActualCotizador.value.valores.length === 0) {
    return [
      'Equipo Local Profesional',
      'Equipo Nacional Profesional',
      'Equipo Extranjero Profesional',
      'Federación / Simón Bolívar',
      'Asociación Chuquisaqueña de Fútbol',
      'Club / Asociación',
      'Particular / Escuela',
      'Particular / Promotor',
      'Particular / Empresa',
      'Arrendatario Permanente',
      'Público General'
    ]
  }
  return [...new Set(espacioActualCotizador.value.valores.map(v => v.tipo_usuario))]
})

const conceptosCotizador = computed(() => {
  if (!espacioActualCotizador.value || !espacioActualCotizador.value.valores || espacioActualCotizador.value.valores.length === 0) {
    return [
      'Entrenamiento',
      'Partido Oficial',
      'Uso Particular',
      'Partido Oficial con Taquilla',
      'Evento No Deportivo con Entrada',
      'Kiosco 1m x 4m',
      'Parqueo Vehicular',
      'Baño Público'
    ]
  }
  const filtrados = cotizadorForm.value.tipo_usuario
    ? espacioActualCotizador.value.valores.filter(v => v.tipo_usuario === cotizadorForm.value.tipo_usuario)
    : espacioActualCotizador.value.valores
  return [...new Set(filtrados.map(v => v.concepto))]
})

function onEscenarioCotizadorChange() {
  const lista = espaciosCotizador.value
  if (lista.length > 0) {
    cotizadorForm.value.espacio = lista[0]
  }
  onEspacioCotizadorChange()
}

function onEspacioCotizadorChange() {
  const listaTipos = tiposUsuarioCotizador.value
  if (listaTipos.length > 0 && !listaTipos.includes(cotizadorForm.value.tipo_usuario)) {
    cotizadorForm.value.tipo_usuario = listaTipos[0]
  }
  onTipoUsuarioCotizadorChange()
}

function onTipoUsuarioCotizadorChange() {
  const listaConceptos = conceptosCotizador.value
  if (listaConceptos.length > 0 && !listaConceptos.includes(cotizadorForm.value.concepto)) {
    cotizadorForm.value.concepto = listaConceptos[0]
  }
  calcular()
}

const esModalidadPorcentaje = computed(() => {
  return cotizadorForm.value.concepto.includes('Taquilla') || cotizadorForm.value.concepto.includes('Entrada')
})

const escenariosFiltrados = computed(() => {
  if (!filtroDisciplina.value) return escenarios.value
  return escenarios.value.filter(e => {
    let listDisc = e.disciplinas || []
    if (typeof listDisc === 'string') {
      try { listDisc = JSON.parse(listDisc) } catch { listDisc = [listDisc] }
    }
    if (listDisc.length === 0) return true
    return listDisc.includes(filtroDisciplina.value)
  })
})

function getReservasEscenario(nombreEscenario) {
  return reservas.value.filter(r => r.escenario_nombre === nombreEscenario)
}

async function fetchOcupacion() {
  try {
    const res = await escenarioService.getOcupacion({
      disciplina: filtroDisciplina.value,
      escenario: filtroEscenario.value,
    })
    escenarios.value = (res.escenarios || []).map(e => {
      if (typeof e.disciplinas === 'string') {
        try {
          e.disciplinas = JSON.parse(e.disciplinas)
        } catch {
          e.disciplinas = [e.disciplinas]
        }
      }
      return e
    })
    reservas.value = res.reservas || []
  } catch (err) {
    console.error('Error al cargar ocupación:', err)
  }
}

async function fetchTarifas() {
  try {
    const res = await tarifarioService.getTarifas({
      escenario: busquedaTarifa.value,
      tipo_usuario: filtroCatalogoTipoUsuario.value,
      concepto: filtroCatalogoConcepto.value,
    })
    espaciosTarifario.value = res.espacios || res.data || []
    tiposUsuarioList.value = res.tipos_usuario || []
    conceptosList.value = res.conceptos || []
    resolucionTarifario.value = res.resolucion || null
    tarifas.value = res.tarifas_planas || []
    initSeleccionesEspacio()
  } catch (err) {
    console.error('Error al cargar tarifas:', err)
  }
}

async function fetchLiquidaciones() {
  try {
    const res = await tarifarioService.getLiquidaciones({ estado: filtroEstado.value })
    liquidaciones.value = res.data || []
  } catch (err) {
    console.error('Error al cargar liquidaciones:', err)
  }
}

const fechaDesdeResumen = ref('')
const fechaHastaResumen = ref('')

function setPresetFechaResumen(preset) {
  const hoy = new Date()
  if (preset === 'hoy') {
    const str = hoy.toISOString().split('T')[0]
    fechaDesdeResumen.value = str
    fechaHastaResumen.value = str
  } else if (preset === 'mes') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    fechaDesdeResumen.value = inicio.toISOString().split('T')[0]
    fechaHastaResumen.value = fin.toISOString().split('T')[0]
  } else if (preset === 'anio') {
    fechaDesdeResumen.value = `${hoy.getFullYear()}-01-01`
    fechaHastaResumen.value = `${hoy.getFullYear()}-12-31`
  } else if (preset === 'todo') {
    fechaDesdeResumen.value = ''
    fechaHastaResumen.value = ''
  }
  fetchResumen()
}

async function fetchResumen() {
  try {
    const params = {}
    if (fechaDesdeResumen.value) params.fecha_desde = fechaDesdeResumen.value
    if (fechaHastaResumen.value) params.fecha_hasta = fechaHastaResumen.value
    const res = await tarifarioService.getResumen(params)
    resumen.value = res
  } catch (err) {
    console.error('Error al cargar resumen:', err)
  }
}


async function calcular() {
  try {
    const res = await tarifarioService.calcularTarifa(cotizadorForm.value)
    calculoResultado.value = res
  } catch (err) {
    alert(err.response?.data?.message || 'Error al realizar el cálculo tarifario')
  }
}

function abrirModalNuevaReserva(esc = null) {
  if (esc) {
    reservaForm.value.escenario_id = esc.id
    reservaForm.value.escenario_nombre = esc.nombre
    reservaForm.value.espacio = esc.espacio
    if (esc.disciplinas && esc.disciplinas.length > 0) {
      reservaForm.value.disciplina = esc.disciplinas[0]
    }
  }
  showModalNuevaReserva.value = true
}

async function confirmarNuevaReserva() {
  try {
    await escenarioService.crearReserva(reservaForm.value)
    showModalNuevaReserva.value = false
    alert('Solicitud de reserva registrada exitosamente. Se ha emitido la liquidación tarifaria en estado PENDIENTE.')
    await fetchOcupacion()
    await cargarFranjasDiaSeleccionado()
    fetchLiquidaciones()
    fetchResumen()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al registrar la reserva')
  }
}

async function generarOrdenLiquidacion() {
  if (!calculoResultado.value) return

  try {
    const data = {
      escenario_nombre: cotizadorForm.value.escenario_nombre,
      espacio: cotizadorForm.value.espacio,
      solicitante_nombre: cotizadorForm.value.solicitante_nombre,
      solicitante_ci_nit: cotizadorForm.value.solicitante_ci_nit,
      tipo_usuario: cotizadorForm.value.tipo_usuario,
      concepto: cotizadorForm.value.concepto,
      fecha_uso: new Date().toISOString().split('T')[0],
      duracion_horas: cotizadorForm.value.duracion_horas,
      turno: cotizadorForm.value.turno,
      modalidad: calculoResultado.value.tarifa_aplicada?.modalidad || 'monto_fijo',
      monto_taquilla_declarado: cotizadorForm.value.monto_taquilla_declarado,
      monto_subtotal: calculoResultado.value.monto_subtotal,
      monto_recargo_cessa: calculoResultado.value.monto_recargo_cessa,
      monto_total: calculoResultado.value.monto_total,
    }

    await tarifarioService.crearLiquidacion(data)
    alert('Orden de liquidación generada correctamente.')
    activeTab.value = 'liquidaciones'
    fetchLiquidaciones()
    fetchResumen()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al generar la liquidación')
  }
}

function abrirModalPago(liq) {
  selectedLiquidacion.value = liq
  showModalPago.value = true
}

async function confirmarPago() {
  if (!selectedLiquidacion.value) return
  try {
    await tarifarioService.pagarRecibo(selectedLiquidacion.value.id, pagoForm.value)
    showModalPago.value = false
    alert('Recibo emitido exitosamente.')
    fetchLiquidaciones()
    fetchResumen()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al registrar el cobro')
  }
}

function abrirModalExencion(liq) {
  selectedLiquidacion.value = liq
  showModalExencion.value = true
}

async function confirmarExencion() {
  if (!selectedLiquidacion.value) return
  try {
    await tarifarioService.aplicarExencion(selectedLiquidacion.value.id, exencionForm.value)
    showModalExencion.value = false
    alert('Exención legal autorizada y registrada.')
    fetchLiquidaciones()
    fetchResumen()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al autorizar exención')
  }
}

function abrirModalReciboImprimible(liq) {
  selectedLiquidacion.value = liq
  showModalReciboImprimible.value = true
}

function imprimirRecibo() {
  window.print()
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

watch(espacioSeleccionadoClave, () => {
  cargarFranjasDiaSeleccionado()
})

onMounted(async () => {
  await fetchOcupacion()
  await fetchTarifas()
  await fetchLiquidaciones()
  await fetchResumen()
  await fetchAsociaciones()
  calcular()
  cargarFranjasDiaSeleccionado()
})
</script>
