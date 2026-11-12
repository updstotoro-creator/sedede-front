import { defineStore } from 'pinia';
import { ref } from 'vue';
import aporteService from '@/services/aporteService'; // Ajusta la ruta si es necesario

export const useAporteStore = defineStore('aporte', () => {
  const aportes = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const listarAportes = async (asociacionId, filters = {}) => {
    loading.value = true;
    error.value = null;
    try {
      aportes.value = await aporteService.listar(asociacionId, filters);
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
    } finally {
      loading.value = false;
    }
  };

  const registrarAporte = async (asociacionId, payload) => {
    await aporteService.crear(asociacionId, payload);
    await listarAportes(asociacionId);
  };

  const reportarEjecucion = async (asociacionId, aporteId, payload) => {
    await aporteService.reportarEjecucion(asociacionId, aporteId, payload);
    await listarAportes(asociacionId);
  };

  const inactivarAporte = async (asociacionId, aporteId) => {
    await aporteService.inactivar(asociacionId, aporteId);
    await listarAportes(asociacionId);
  };

  const reactivarAporte = async (asociacionId, aporteId) => {
    await aporteService.reactivar(asociacionId, aporteId);
    await listarAportes(asociacionId);
  };

  return {
    aportes,
    loading,
    error,
    listarAportes,
    registrarAporte,
    reportarEjecucion,
    inactivarAporte,
    reactivarAporte
  };
});