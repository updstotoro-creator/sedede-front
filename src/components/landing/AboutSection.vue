<script setup>
import logo from '../../assets/images/logo-sedede.png'
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20">
    <div class="grid items-center gap-12 md:grid-cols-2">
      <div>
        <h2 class="font-display text-3xl font-bold text-brand-700">¿Qué es la SEDEDE?</h2>
        <p class="mt-4 leading-relaxed text-slate-600">
          El Servicio Departamental de Deportes (SEDEDE) es la entidad
          encargada de promover el deporte formativo, el alto rendimiento y
          la actividad física en el departamento de Chuquisaca, impulsando
          la infraestructura deportiva y el bienestar de la comunidad.
        </p>
        <a href="#areas" class="btn-primary mt-6">Explora Programas</a>
      </div>
      <div class="flex justify-center">
        <div class="flex h-40 w-40 items-center justify-center rounded-full bg-brand-50 p-6">
          <img :src="logo" alt="Logo SEDEDE Chuquisaca" class="h-full w-full object-contain" />
        </div>
      </div>
    </div>
  </section>
</template>
