import { api } from './api';
import type { OrdemServico, OSFormData, ApiResponse } from '../types';

export const ordemServicoService = {
  async getAll(): Promise<OrdemServico[]> {
    const response = await api.get<{ ordem_servicos: any[] }>('/os');
    // Transformar dados flat do backend em objetos aninhados
    return response.data.ordem_servicos.map(os => ({
      ...os,
      cliente: os.cliente_nome ? {
        id: os.cliente_id,
        nome: os.cliente_nome
      } : null,
      veiculo: os.placa ? {
        id: os.veiculo_id,
        placa: os.placa,
        marca: os.marca,
        modelo: os.modelo
      } : null,
      mecanico: os.mecanico_nome ? {
        id: os.mecanico_id,
        nome: os.mecanico_nome
      } : null
    }));
  },

  async getById(id: number): Promise<OrdemServico> {
    const response = await api.get<{ os: any }>(`/os/${id}`);
    const os = response.data.os;

    // Transformar dados flat do backend em objetos aninhados para o frontend
    return {
      ...os,
      cliente: os.cliente_nome ? {
        id: os.cliente_id,
        nome: os.cliente_nome,
        cpf_cnpj: os.cliente_documento,
        telefone: os.cliente_telefone,
        email: os.cliente_email,
        endereco: os.cliente_endereco
      } : null,
      veiculo: os.placa ? {
        id: os.veiculo_id,
        placa: os.placa,
        marca: os.marca,
        modelo: os.modelo,
        ano: os.ano,
        cor: os.cor
      } : null,
      mecanico: os.mecanico_nome ? {
        id: os.mecanico_id,
        nome: os.mecanico_nome
      } : null
    } as OrdemServico;
  },

  async create(data: OSFormData): Promise<ApiResponse<OrdemServico>> {
    const response = await api.post('/os', data);
    return response.data;
  },

  async update(id: number, data: Partial<OSFormData>): Promise<ApiResponse<OrdemServico>> {
    const response = await api.put(`/os/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/os/${id}`);
    return response.data;
  },

  async addFoto(id: number, formData: FormData): Promise<ApiResponse<void>> {
    const response = await api.post(`/os/${id}/fotos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default ordemServicoService;
