<script setup>
</script>

<template>
  <section id="manuales" class="py-16 sm:py-20 bg-slate-100/70 border-t border-slate-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la Sección -->
      <div class="text-center max-w-3xl mx-auto space-y-3 mb-12">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1">
          <span>📖</span>
          <span>GUÍAS Y MANUALES OFICIALES</span>
        </span>
        <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ¿Cómo registrarte y cómo reservar un escenario deportivo?
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Consulta nuestras guías paso a paso elaboradas para orientar a atletas, clubes deportivos y a la ciudadanía en el uso ágil y transparente de la plataforma.
        </p>
      </div>

      <!-- Tarjetas de los Dos Manuales -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Tarjeta 1: Manual de Registros -->
        <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-2xl shadow-xs">
                📝
              </span>
              <span class="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-0.5 text-xs font-bold">
                Padrón RUN
              </span>
            </div>

            <div>
              <h3 class="font-display text-lg sm:text-xl font-bold text-slate-900">
                Manual de Registro de Deportistas y Clubes
              </h3>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                Aprende cómo inscribirte en el Registro Único de Deportistas (RUN), el protocolo legal obligatorio para menores de edad con tutor y la verificación en dos fases.
              </p>
            </div>

            <!-- Pasos Resumidos -->
            <div class="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">1</span>
                <p><strong>Carga de Cédula y Datos:</strong> Validación de identidad para evitar duplicidades federativas.</p>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">2</span>
                <p><strong>Tutor Legal si eres Menor:</strong> Protocolo legal obligatorio para deportistas menores de 18 años.</p>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">3</span>
                <p><strong>Elección de Club y Asociación:</strong> Vinculación en cascada según disciplina deportiva.</p>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">4</span>
                <p><strong>Aprobación en 2 Fases:</strong> Visto bueno del Club Deportivo y alta en la Asociación Departamental.</p>
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <router-link
              to="/manuales?tab=registro"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-sm"
            >
              <span>Ver Guía Completa de Registro</span>
              <span>➔</span>
            </router-link>
            <router-link
              to="/registro"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 text-xs font-bold transition"
            >
              Formulario RUN
            </router-link>
          </div>
        </div>

        <!-- Tarjeta 2: Manual de Reservas -->
        <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-2xl shadow-xs">
                🏟️
              </span>
              <span class="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 text-xs font-bold">
                Tarifario RAG 011/2024
              </span>
            </div>

            <div>
              <h3 class="font-display text-lg sm:text-xl font-bold text-slate-900">
                Manual de Reserva de Escenarios Deportivos
              </h3>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                Conoce la disponibilidad del Estadio Patria, coliseos y complejos, tarifas oficiales, cálculo del recargo CESSA para uso nocturno y boleta oficial.
              </p>
            </div>

            <!-- Pasos Resumidos -->
            <div class="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">1</span>
                <p><strong>Explorar Disponibilidad:</strong> Consulta fechas y horarios en tiempo real sin salir de casa.</p>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">2</span>
                <p><strong>Turno Diurno o Nocturno:</strong> Aplicación de tarifa base o recargo por iluminación CESSA.</p>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">3</span>
                <p><strong>Validación Anti-Colisión:</strong> El sistema previene choques con el Calendario Oficial Deportivo.</p>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">4</span>
                <p><strong>Depósito y Boleta de Ingreso:</strong> Pago a cuenta fiscal Banco Unión y emisión de comprobante.</p>
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <router-link
              to="/manuales?tab=reservas"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-sm"
            >
              <span>Ver Guía Completa de Reservas</span>
              <span>➔</span>
            </router-link>
            <router-link
              to="/reservar"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 text-xs font-bold transition"
            >
              Reservar Cancha
            </router-link>
          </div>
        </div>
      </div>

      <!-- Banner de Soporte Técnico y Presentación -->
      <div class="mt-10 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white text-lg">
            📞
          </span>
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-brand-950">
              ¿Requieres asistencia técnica o soporte durante la presentación?
            </h4>
            <p class="text-[11px] text-brand-800">
              Contacta a los estudiantes desarrolladores de la Universidad Privada Domingo Savio — Sede Sucre en el pie de página o en el directorio de soporte.
            </p>
          </div>
        </div>

        <router-link
          to="/manuales?tab=soporte"
          class="inline-flex items-center justify-center rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs shrink-0"
        >
          Ver Directorio de Soporte
        </router-link>
      </div>
    </div>
  </section>
</template>
