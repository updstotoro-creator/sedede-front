<script setup>
import { ref } from 'vue'
import logo from '../../assets/images/logo-sedede.png'

const open = ref(false)
const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Calendario', href: '#calendario' },
  { label: 'Ranking', href: '#ranking' },
  { label: 'Estadísticas', href: '#estadisticas' },
  { label: 'Atletas', href: '#buscador' },
  { label: 'Instalaciones', href: '#areas' },
  { label: 'Contacto', href: '#contacto' },
]
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5">
      <!-- Logo -->
      <a href="#inicio" class="flex items-center gap-2.5 shrink-0">
        <img :src="logo" alt="Logo SEDEDE Chuquisaca" class="h-10 w-auto" />
        <div class="leading-tight">
          <p class="font-display text-sm font-extrabold tracking-wide text-brand-700">SEDEDE</p>
          <p class="text-[10px] font-semibold text-slate-500 tracking-wider">CHUQUISACA</p>
        </div>
      </a>

      <!-- Navegación Central -->
      <nav class="hidden items-center gap-3 lg:gap-5 xl:gap-7 md:flex mx-3">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="text-xs lg:text-sm font-medium text-slate-600 transition-colors hover:text-brand-600 whitespace-nowrap"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Botones / Acciones a la Derecha -->
      <div class="hidden md:flex items-center gap-2.5 lg:gap-3 shrink-0">
        <!-- Reservar Ambiente (Pill distintiva) -->
        <router-link
          to="/reservar"
          class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 hover:border-emerald-500 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-xs whitespace-nowrap"
        >
          <span>📅</span>
          <span>Reservar</span>
        </router-link>

        <!-- Separador sutil -->
        <span class="h-4 w-px bg-slate-200"></span>

        <!-- Enlace Registrarse -->
        <router-link
          to="/registro"
          class="text-xs lg:text-sm font-semibold text-slate-600 hover:text-brand-600 px-1 py-1 transition-colors whitespace-nowrap"
        >
          Registrarse
        </router-link>

        <!-- Botón Acceder (Único botón sólido primario) -->
        <router-link
          to="/login"
          class="inline-flex items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 px-3.5 py-1.5 text-xs lg:text-sm font-bold text-white shadow-sm transition-all whitespace-nowrap"
        >
          Acceder
        </router-link>
      </div>

      <!-- Botón Menú Móvil -->
      <button class="text-brand-700 md:hidden p-1 rounded-lg hover:bg-slate-100" aria-label="Abrir menú" @click="open = !open">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- Menú Desplegable Móvil -->
    <div v-if="open" class="border-t border-slate-100 px-6 py-4 md:hidden bg-white shadow-lg space-y-3">
      <div class="flex flex-col space-y-2">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="py-1.5 text-sm font-medium text-slate-700 hover:text-brand-600"
          @click="open = false"
        >
          {{ link.label }}
        </a>
      </div>

      <div class="pt-3 border-t border-slate-100 space-y-2">
        <router-link
          to="/reservar"
          class="block rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2"
          @click="open = false"
        >
          <span>📅</span> Reservar Ambiente
        </router-link>
        <div class="grid grid-cols-2 gap-2 pt-1">
          <router-link
            to="/registro"
            class="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700"
            @click="open = false"
          >
            Registrarse
          </router-link>
          <router-link
            to="/login"
            class="rounded-xl bg-brand-600 hover:bg-brand-700 px-3 py-2 text-center text-xs font-bold text-white shadow-sm"
            @click="open = false"
          >
            Acceder
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>
