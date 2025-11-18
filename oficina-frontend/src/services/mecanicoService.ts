import { api } from './api';
import type { Mecanico, MecanicoFormData, ApiResponse } from '../types';

export const mecanicoService = {
  async getAll(): Promise<Mecanico[]> {
    const response = await api.get<{ mecanicos: Mecanico[] }>('/mecanicos');
    return response.data.mecanicos;
  },

  async getById(id: number): Promise<Mecanico> {
    const response = await api.get<{ mecanico: Mecanico }>(`/mecanicos/${id}`);
    return response.data.mecanico;
  },

  async create(data: MecanicoFormData): Promise<ApiResponse<Mecanico>> {
    const response = await api.post('/mecanicos', data);
    return response.data;
  },

  async update(id: number, data: MecanicoFormData): Promise<ApiResponse<Mecanico>> {
    const response = await api.put(`/mecanicos/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/mecanicos/${id}`);
    return response.data;
  },
};

export default mecanicoService;
