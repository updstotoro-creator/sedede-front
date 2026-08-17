<template>
  <section id="inicio" class="relative overflow-hidden bg-brand-700">
    <!-- Imagen deportiva de fondo: reemplaza esta URL por una foto real de
         actividades del SEDEDE cuando la tengan disponible -->
    <div class="absolute inset-0">
      <img
        src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop"
        alt="Deportistas en actividad en Chuquisaca"
        class="h-full w-full object-cover opacity-40"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-brand-800/95 via-brand-700/80 to-brand-700/40"></div>
    </div>

    <div class="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div class="max-w-2xl">
        <h1 class="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          ¡Impulsa tu Pasión Deportiva en Chuquisaca!
        </h1>

        <p class="mt-6 max-w-xl text-lg text-brand-50/90">
          La SEDEDE es tu puerta de entrada al deporte de alto rendimiento
          y la actividad física en el departamento.
        </p>

        <div class="mt-10 flex flex-wrap items-center gap-4">
          <a href="#eventos" class="btn-primary bg-white text-brand-700 hover:bg-brand-50">
            Explora Eventos y Programas
          </a>
        </div>
      </div>
    </div>

    <!-- Franja azul de detalle, guiño a la bandera -->
    <div class="h-2 w-full bg-navyflag"></div>
  </section>
</template>
