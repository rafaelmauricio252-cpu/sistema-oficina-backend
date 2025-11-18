import { api } from './api';
import type { Servico, ServicoFormData, ApiResponse } from '../types';

export const servicoService = {
  async getAll(): Promise<Servico[]> {
    const response = await api.get<{ servicos: Servico[] }>('/servicos');
    return response.data.servicos;
  },

  async getById(id: number): Promise<Servico> {
    const response = await api.get<{ servico: Servico }>(`/servicos/${id}`);
    return response.data.servico;
  },

  async create(data: ServicoFormData): Promise<ApiResponse<Servico>> {
    const response = await api.post('/servicos', data);
    return response.data;
  },

  async update(id: number, data: ServicoFormData): Promise<ApiResponse<Servico>> {
    const response = await api.put(`/servicos/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/servicos/${id}`);
    return response.data;
  },
};

export default servicoService;
