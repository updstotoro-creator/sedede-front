<script setup>
import { ref } from 'vue'
import logo from '../../assets/images/logo-sedede.png'

const open = ref(false)
const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Novedades', href: '#noticias' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Instalaciones', href: '#areas' },
  { label: 'Contacto', href: '#contacto' },
]
</script>

<template>
  <header class="sticky top-0 z-40 bg-white shadow-sm">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
      <a href="#inicio" class="flex items-center gap-3">
        <img :src="logo" alt="Logo SEDEDE Chuquisaca" class="h-11 w-auto" />
        <div class="leading-tight">
          <p class="font-display text-sm font-extrabold tracking-wide text-brand-700">SEDEDE</p>
          <p class="text-[11px] font-semibold text-slate-500">CHUQUISACA</p>
        </div>
      </a>

      <nav class="hidden items-center gap-8 md:flex">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="hidden md:block">
        <router-link to="/login" class="btn-primary">
          Acceder al sistema
        </router-link>
      </div>

      <button class="text-brand-700 md:hidden" aria-label="Abrir menú" @click="open = !open">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <div v-if="open" class="border-t border-slate-100 px-6 pb-4 md:hidden">
      <a v-for="link in links" :key="link.href" :href="link.href" class="block py-2 text-sm text-slate-600">
        {{ link.label }}
      </a>
      <router-link to="/login" class="mt-2 block rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white">
        Acceder al sistema
      </router-link>
    </div>
  </header>
</template>
