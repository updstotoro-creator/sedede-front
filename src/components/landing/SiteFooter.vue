<script setup>
import logo from '../../assets/images/logo-sedede.png'
</script>

<template>
  <footer class="bg-brand-700 text-white">
    <div class="mx-auto max-w-7xl px-6 py-14">
      <div class="grid gap-10 md:grid-cols-3">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1.5">
            <img :src="logo" alt="Logo SEDEDE Chuquisaca" class="h-full w-full object-contain" />
          </div>
          <div>
            <p class="font-display text-sm font-bold">SEDEDE</p>
            <p class="text-xs text-brand-100">CHUQUISACA</p>
          </div>
        </div>
        <div class="text-sm text-brand-100">
          <p>Facebook: SEDEDE Chuquisaca</p>
          <p>Instagram: @sededechuquisaca</p>
        </div>
        <div class="text-sm text-brand-100">
          <p><router-link to="/login" class="hover:text-white">Acceder al sistema</router-link></p>
        </div>
      </div>
      <p class="mt-12 text-xs text-brand-200">
        © {{ new Date().getFullYear() }} SEDEDE Chuquisaca. Todos los derechos reservados.
      </p>
    </div>
  </footer>
</template>
