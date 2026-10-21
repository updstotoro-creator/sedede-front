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

        <!-- Enlaces a registros públicos -->
        <div class="mt-8 pt-6 border-t border-slate-200">
          <p class="text-xs font-semibold text-slate-500 mb-3 text-center">
            ¿No tienes cuenta? Inicia tu registro oficial:
          </p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <router-link
              to="/registro/comunidad"
              class="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-bold transition-colors"
            >
              <span>🏛️</span>
              <span>Comunidad</span>
            </router-link>
            <router-link
              to="/registro/deportista"
              class="flex items-center gap-2 p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/70 hover:bg-cyan-100 text-cyan-900 font-bold transition-colors"
            >
              <span>🏃</span>
              <span>Deportista</span>
            </router-link>
            <router-link
              to="/registro/asociacion"
              class="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 font-bold transition-colors"
            >
              <span>🏆</span>
              <span>Asociación</span>
            </router-link>
            <router-link
              to="/registro/club"
              class="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-bold transition-colors"
            >
              <span>⚽</span>
              <span>Club</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
