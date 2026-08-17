<script setup>
import LoginForm from '../components/auth/LoginForm.vue'
import logo from '../assets/images/logo-sedede.png'
</script>

<template>
  <div class="grid min-h-screen md:grid-cols-2">
    <!-- Panel institucional (se oculta en mobile) -->
    <div class="relative hidden flex-col justify-between bg-brand-700 p-12 text-white md:flex">
      <router-link to="/" class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-white p-1">
          <img :src="logo" alt="Logo SEDEDE Chuquisaca" class="h-full w-full object-contain" />
        </div>
        <span class="font-display text-sm font-bold">SEDEDE Chuquisaca</span>
      </router-link>

      <div>
        <p class="font-mono text-xs uppercase tracking-widest text-teal-500">Acceso al sistema</p>
        <h1 class="mt-3 max-w-md font-display text-3xl font-bold leading-tight">
          Panel institucional para la gestión de trámites y programas.
        </h1>
      </div>

      <p class="text-xs text-slate-400">
        Acceso restringido a personal autorizado del SEDEDE.
      </p>
    </div>

    <!-- Formulario -->
    <div class="flex items-center justify-center bg-paper px-6 py-16">
      <div class="w-full max-w-sm">
        <div class="mb-8 md:hidden">
          <router-link to="/" class="font-display text-sm font-bold text-brand-700">← SEDEDE Chuquisaca</router-link>
        </div>
        <h2 class="mb-1 font-display text-2xl font-bold text-brand-700">Iniciar sesión</h2>
        <p class="mb-8 text-sm text-slate-500">Ingresa con tus credenciales institucionales.</p>
        <LoginForm />
      </div>
    </div>
  </div>
</template>
