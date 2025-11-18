import { api } from './api';
import type { Cliente, ClienteFormData, ApiResponse } from '../types';

export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    const response = await api.get<{ clientes: Cliente[] }>('/clientes');
    return response.data.clientes;
  },

  async getById(id: number): Promise<Cliente> {
    const response = await api.get<{ cliente: Cliente }>(`/clientes/${id}`);
    return response.data.cliente;
  },

  async create(data: ClienteFormData): Promise<ApiResponse<Cliente>> {
    const response = await api.post('/clientes', data);
    return response.data;
  },

  async update(id: number, data: ClienteFormData): Promise<ApiResponse<Cliente>> {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },

  async search(query: string): Promise<Cliente[]> {
    const response = await api.get<{ clientes: Cliente[] }>(`/clientes/buscar?q=${encodeURIComponent(query)}`);
    return response.data.clientes;
  },
};

export default clienteService;
