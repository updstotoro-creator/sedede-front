<script setup>
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-paper p-8">
    <header class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-brand-700">Panel SEDEDE</h1>
        <p class="text-sm text-slate-500">
          Bienvenido, {{ auth.user?.name }}
          <span v-if="auth.user?.role" class="ml-1 text-slate-400">· {{ auth.user.role.nombre ?? auth.user.role }}</span>
        </p>
      </div>
      <button class="btn-primary" @click="auth.logout()">Cerrar sesión</button>
    </header>

    <nav class="flex gap-4">
      <router-link to="/dashboard/users" class="text-sm font-semibold text-brand-600 hover:underline">
        Usuarios
      </router-link>
      <router-link to="/dashboard/roles" class="text-sm font-semibold text-brand-600 hover:underline">
        Roles
      </router-link>
    </nav>

    <router-view />
  </div>
</template>