<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Clubes Deportivos</h1>
        <p class="text-sm text-gray-500">Gestión de clubes de la asociación seleccionada</p>
      </div>
      <button 
        @click="abrirModalCrear"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
      >
        + Nuevo Club
      </button>
    </div>

    <!-- Estado de Carga -->
    <div v-if="clubStore.loading" class="text-center py-8 text-gray-500">
      Cargando clubes...
    </div>

    <!-- Tabla de Clubes -->
    <div v-else class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sigla / Código</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="club in clubStore.clubes" :key="club.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ club.nombre }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ club.sigla || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span :class="club.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ club.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="editarClub(club)" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
              <button @click="cambiarEstado(club)" class="text-red-600 hover:text-red-900">
                {{ club.activo ? 'Inativar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="clubStore.clubes.length === 0">
            <td colspan="4" class="px-6 py-8 text-center text-sm text-gray-500">
              No hay clubes registrados para esta asociación.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useClubStore } from '@/stores/clubStore';

const route = useRoute();
const clubStore = useClubStore();

// Obtenemos el ID de la asociación desde los parámetros de la ruta (ej: /asociaciones/:id/clubes)
const asociacionId = route.params.asociacionId || 1; // Ajusta según tu estructura de rutas

onMounted(() => {
  clubStore.listarClubes(asociacionId);
});

const abrirModalCrear = () => {
  // Lógica para desplegar el modal o formulario de registro
  console.log('Abrir modal para crear club en asociación:', asociacionId);
};

const editarClub = (club) => {
  console.log('Editar club:', club);
};

const cambiarEstado = async (club) => {
  if (club.activo) {
    await clubStore.inactivarClub(asociacionId, club.id);
  } else {
    // Si tienes método de reactivación en el store/service
    console.log('Reactivar club');
  }
};
</script>