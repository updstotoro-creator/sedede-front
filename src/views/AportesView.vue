<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Gestión de Aportes</h1>
        <p class="text-sm text-gray-500">Control de aportes y ejecuciones de la asociación</p>
      </div>
      <button 
        @click="abrirModalCrear"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
      >
        + Nuevo Aporte
      </button>
    </div>

    <!-- Estado de carga -->
    <div v-if="aporteStore.loading" class="text-center py-8 text-gray-500">
      Cargando aportes...
    </div>

    <!-- Tabla de Aportes -->
    <div v-else class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="aporte in aporteStore.aportes" :key="aporte.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ aporte.concepto || aporte.descripcion || 'Sin concepto' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ aporte.monto }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span :class="aporte.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ aporte.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="reportarEjecucion(aporte)" class="text-indigo-600 hover:text-indigo-900 mr-3">Reportar</button>
              <button @click="cambiarEstado(aporte)" class="text-red-600 hover:text-red-900">
                {{ aporte.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="aporteStore.aportes.length === 0">
            <td colspan="4" class="px-6 py-8 text-center text-sm text-gray-500">
              No hay aportes registrados para esta asociación.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAporteStore } from '@/stores/aporteStore';

const route = useRoute();
const aporteStore = useAporteStore();

// Obtiene el ID de la asociación desde los parámetros de la ruta
const asociacionId = route.params.asociacionId || 1;

onMounted(() => {
  aporteStore.listarAportes(asociacionId);
});

const abrirModalCrear = () => {
  // Lógica para desplegar el modal de creación de aporte
  console.log('Abrir modal de creación para asociación:', asociacionId);
};

const reportarEjecucion = (aporte) => {
  // Lógica para reportar la ejecución del aporte
  console.log('Reportar ejecución del aporte:', aporte.id);
};

const cambiarEstado = async (aporte) => {
  if (aporte.activo) {
    await aporteStore.inactivarAporte(asociacionId, aporte.id);
  } else {
    await aporteStore.reactivarAporte(asociacionId, aporte.id);
  }
};
</script>