<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: '',
  password: '',
})

const showPassword = ref(false)
// Errores de validación por campo (422 de Laravel) además del error
// general que ya vive en el store.
const fieldErrors = ref({})

async function handleSubmit() {
  fieldErrors.value = {}

  if (!form.email || !form.password) {
    fieldErrors.value = {
      email: !form.email ? 'El correo es obligatorio.' : null,
      password: !form.password ? 'La contraseña es obligatoria.' : null,
    }
    return
  }

  const ok = await auth.login({ email: form.email, password: form.password })

  if (ok) {
    router.push(route.query.redirect?.toString() || '/dashboard')
  }
}
</script>

<template>
  <form novalidate class="w-full max-w-sm space-y-5" @submit.prevent="handleSubmit">
    <div>
      <label for="email" class="mb-1.5 block text-sm font-medium text-ink">Correo institucional</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        autocomplete="username"
        placeholder="nombre.apellido@sedede.gob.bo"
        class="input-field"
        :aria-invalid="!!fieldErrors.email"
        :disabled="auth.isLoading"
      />
      <p v-if="fieldErrors.email" class="mt-1.5 text-xs font-medium text-red-600">
        {{ fieldErrors.email }}
      </p>
    </div>

    <div>
      <label for="password" class="mb-1.5 block text-sm font-medium text-ink">Contraseña</label>
      <div class="relative">
        <input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="••••••••"
          class="input-field pr-11"
          :aria-invalid="!!fieldErrors.password"
          :disabled="auth.isLoading"
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-slate-500 hover:text-brand-700"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Ocultar' : 'Ver' }}
        </button>
      </div>
      <p v-if="fieldErrors.password" class="mt-1.5 text-xs font-medium text-red-600">
        {{ fieldErrors.password }}
      </p>
    </div>

    <!-- Error general de autenticación (credenciales inválidas, 429, red caída) -->
    <div
      v-if="auth.status === 'error'"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ auth.errorMessage }}
    </div>

    <button type="submit" class="btn-primary w-full" :disabled="auth.isLoading">
      <svg
        v-if="auth.isLoading"
        class="mr-2 h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {{ auth.isLoading ? 'Verificando…' : 'Ingresar' }}
    </button>
  </form>
</template>
