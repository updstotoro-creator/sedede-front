<script setup>
import logo from '../../assets/images/logo-sedede.png'
import logoUpdsBlanco from '../../assets/images/upds-logo-blanco.png'
import logoProyectoBlanco from '../../assets/images/proyecto-upds-sucre-blanco.png'
import { URL_UPDS_SUCRE, AUTORES } from '../../config/institucional'
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

      <!-- Logos UPDS: llevan a la página oficial de la UPDS Sucre -->
      <div class="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-white/15 pt-6">
        <a :href="URL_UPDS_SUCRE" target="_blank" rel="noopener noreferrer" title="Universidad Privada Domingo Savio — Sede Sucre">
          <img :src="logoUpdsBlanco" alt="Universidad Privada Domingo Savio" class="h-12 w-auto" />
        </a>
        <a :href="URL_UPDS_SUCRE" target="_blank" rel="noopener noreferrer" title="Proyecto UPDS Sucre">
          <img :src="logoProyectoBlanco" alt="Proyecto UPDS Sucre" class="h-10 w-auto" />
        </a>
        <p class="text-xs text-brand-100 sm:ml-auto sm:text-right">
          Desarrollado por
          <span v-if="AUTORES.length" class="font-semibold text-white">{{ AUTORES.join(' · ') }}</span>
          <span v-else class="font-semibold text-white">el Proyecto UPDS Sucre</span>
        </p>
      </div>

      <p class="mt-8 text-xs text-brand-200">
        © {{ new Date().getFullYear() }} SEDEDE Chuquisaca. Todos los derechos reservados.
      </p>
    </div>
  </footer>
</template>
