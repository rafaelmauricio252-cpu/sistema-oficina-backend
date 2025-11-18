import { api } from './api';
import type { Veiculo, VeiculoFormData, ApiResponse } from '../types';

export const veiculoService = {
  async getAll(): Promise<Veiculo[]> {
    const response = await api.get<{ veiculos: Veiculo[] }>('/veiculos');
    return response.data.veiculos;
  },

  async getById(id: number): Promise<Veiculo> {
    const response = await api.get<{ veiculo: Veiculo }>(`/veiculos/${id}`);
    return response.data.veiculo;
  },

  async getByCliente(clienteId: number): Promise<Veiculo[]> {
    const response = await api.get<{ veiculos: Veiculo[] }>(`/clientes/${clienteId}/veiculos`);
    return response.data.veiculos;
  },

  async create(data: VeiculoFormData): Promise<ApiResponse<Veiculo>> {
    const response = await api.post('/veiculos', data);
    return response.data;
  },

  async update(id: number, data: VeiculoFormData): Promise<ApiResponse<Veiculo>> {
    const response = await api.put(`/veiculos/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/veiculos/${id}`);
    return response.data;
  },
};

export default veiculoService;
