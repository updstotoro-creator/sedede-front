<script setup>
import logo from '../../assets/images/logo-sedede.png'
import logoUpdsFondoOscuro from '../../assets/images/upds/upds-sucre-color-fondo-oscuro.png'
import logoProyectoBlanco from '../../assets/images/proyecto-upds-sucre-blanco.png'
import { URL_UPDS_SUCRE, AUTORES_CONTRIBUCION } from '../../config/institucional'
</script>

<template>
  <footer class="bg-brand-900 text-white border-t border-brand-800">
    <div class="mx-auto max-w-7xl px-6 py-12">
      <!-- Fila Superior: Identidad, Accesos y Manuales -->
      <div class="grid gap-8 md:grid-cols-4 pb-10 border-b border-white/10">
        <!-- Columna 1: Logo SEDEDE -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-md">
              <img :src="logo" alt="Logo SEDEDE Chuquisaca" class="h-full w-full object-contain" />
            </div>
            <div>
              <p class="font-display text-base font-extrabold tracking-wide">SEDEDE</p>
              <p class="text-xs font-semibold text-brand-200 tracking-wider">CHUQUISACA</p>
            </div>
          </div>
          <p class="text-xs text-brand-200 leading-relaxed">
            Servicio Departamental de Deportes Chuquisaca. Impulsando el deporte de alto rendimiento, formativo y comunitario.
          </p>
        </div>

        <!-- Columna 2: Manuales de Usuario -->
        <div class="space-y-2 text-xs">
          <p class="font-bold uppercase tracking-wider text-white flex items-center gap-1.5 text-xs">
            <span>📖</span>
            <span>Manuales & Guías</span>
          </p>
          <ul class="space-y-1.5 text-brand-100">
            <li>
              <router-link to="/manuales" class="hover:text-white hover:underline transition flex items-center gap-1.5">
                <span>📝</span>
                <span>Guía de Registro (Deportistas y Clubes)</span>
              </router-link>
            </li>
            <li>
              <router-link to="/manuales" class="hover:text-white hover:underline transition flex items-center gap-1.5">
                <span>🏟️</span>
                <span>Guía de Reserva de Escenarios</span>
              </router-link>
            </li>
            <li>
              <router-link to="/reservar" class="hover:text-white hover:underline transition flex items-center gap-1.5">
                <span>📅</span>
                <span>Portal Público de Reservas</span>
              </router-link>
            </li>
            <li>
              <router-link to="/registro" class="hover:text-white hover:underline transition flex items-center gap-1.5">
                <span>⚡</span>
                <span>Registro RUN en Línea</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Columna 3: Contacto & Redes -->
        <div class="space-y-2 text-xs">
          <p class="font-bold uppercase tracking-wider text-white flex items-center gap-1.5 text-xs">
            <span>📍</span>
            <span>Atención Institucional</span>
          </p>
          <div class="space-y-1 text-brand-100">
            <p>Estadio Patria — Curva Norte, Sucre, Bolivia</p>
            <p>Horario: Lunes a Viernes 08:00 - 16:00</p>
            <p class="pt-1">Facebook: <strong>SEDEDE Chuquisaca</strong></p>
            <p>Instagram: <strong>@sededechuquisaca</strong></p>
          </div>
        </div>

        <!-- Columna 4: Acceso al Sistema -->
        <div class="space-y-3 text-xs">
          <p class="font-bold uppercase tracking-wider text-white flex items-center gap-1.5 text-xs">
            <span>🔐</span>
            <span>Acceso al Sistema</span>
          </p>
          <p class="text-brand-200">
            Acceso exclusivo para funcionarios de SEDEDE, directivos de asociaciones, clubes y deportistas acreditados.
          </p>
          <div>
            <router-link
              to="/login"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white text-white hover:text-brand-900 border border-white/20 px-3.5 py-2 text-xs font-bold transition shadow-xs"
            >
              <span>Acceder al Panel</span>
              <span>➔</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Sección de Soporte Técnico y Equipo de Desarrollo UPDS -->
      <div class="pt-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h4 class="font-display text-sm font-bold text-white flex items-center gap-2">
              <span>🛠️</span>
              <span>Soporte Técnico y Equipo de Desarrollo del Sistema</span>
            </h4>
            <p class="text-xs text-brand-200 mt-0.5">
              Desarrollado en convenio institucional por estudiantes de la <strong>Universidad Privada Domingo Savio — Sede Sucre</strong>. Ordenado por contribución al proyecto.
            </p>
          </div>
          <!-- Logos UPDS -->
          <div class="flex items-center gap-4 shrink-0">
            <a :href="URL_UPDS_SUCRE" target="_blank" rel="noopener noreferrer" title="Universidad Privada Domingo Savio — Sede Sucre">
              <img :src="logoUpdsFondoOscuro" alt="UPDS Sede Sucre" class="h-9 w-auto hover:opacity-90 transition-opacity" />
            </a>
            <a :href="URL_UPDS_SUCRE" target="_blank" rel="noopener noreferrer" title="Proyecto UPDS Sucre">
              <img :src="logoProyectoBlanco" alt="Proyecto UPDS Sucre" class="h-8 w-auto hover:opacity-90 transition-opacity" />
            </a>
          </div>
        </div>

        <!-- Grid de Desarrolladores ordenados por contribución -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
          <div
            v-for="autor in AUTORES_CONTRIBUCION"
            :key="autor.telefono"
            class="flex items-center justify-between rounded-xl p-2.5 border transition"
            :class="autor.destacado ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 hover:bg-white/10'"
          >
            <div class="min-w-0 pr-2">
              <div class="flex items-center gap-1.5">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  :class="autor.rango <= 3 ? 'bg-amber-400 text-amber-950 font-extrabold' : 'bg-white/20 text-white'"
                >
                  {{ autor.rango }}°
                </span>
                <p class="truncate text-xs font-bold text-white">{{ autor.nombreCompleto }}</p>
              </div>
              <p class="text-[10px] text-brand-200 truncate mt-0.5">{{ autor.rol }}</p>
            </div>

            <!-- Botones de Contacto Directo -->
            <div class="flex items-center gap-1 shrink-0">
              <a
                :href="`tel:${autor.telefono}`"
                class="inline-flex items-center gap-1 rounded-md bg-white/15 hover:bg-white text-white hover:text-brand-900 px-2 py-1 text-[11px] font-mono font-semibold transition"
                :title="`Llamar a ${autor.nombreCompleto}`"
              >
                <span>📞</span>
                <span>{{ autor.telefono }}</span>
              </a>
              <a
                :href="`https://wa.me/${autor.whatsapp}?text=Hola%20${encodeURIComponent(autor.nombreCompleto)},%20te%20contacto%20por%20soporte%20del%20sistema%20SEDEDE.`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition text-xs"
                :title="`WhatsApp directo a ${autor.nombreCompleto}`"
              >
                💬
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-brand-300">
        <p>© {{ new Date().getFullYear() }} SEDEDE Chuquisaca · Gobierno Autónomo Departamental de Chuquisaca.</p>
        <p class="mt-1 sm:mt-0">Proyecto de Transformación Digital Deportiva · UPDS Sucre</p>
      </div>
    </div>
  </footer>
</template>
