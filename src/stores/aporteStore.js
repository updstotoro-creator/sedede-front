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
    try {
      await aporteService.crear(asociacionId, payload);
      await listarAportes(asociacionId);
    } catch (err) {
      throw err;
    }
  };

  const reportarEjecucion = async (asociacionId, aporteId, payload) => {
    try {
      await aporteService.reportarEjecucion(asociacionId, aporteId, payload);
      await listarAportes(asociacionId);
    } catch (err) {
      throw err;
    }
  };

  const inactivarAporte = async (asociacionId, aporteId) => {
    try {
      await aporteService.inactivar(asociacionId, aporteId);
      await listarAportes(asociacionId);
    } catch (err) {
      throw err;
    }
  };

  const reactivarAporte = async (asociacionId, aporteId) => {
    try {
      await aporteService.reactivar(asociacionId, aporteId);
      await listarAportes(asociacionId);
    } catch (err) {
      throw err;
    }
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