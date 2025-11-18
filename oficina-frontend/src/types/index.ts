// ============================================
// TIPOS DE ENTIDADES
// ============================================

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email?: string;
  endereco?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Veiculo {
  id: number;
  cliente_id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano?: number;
  cor?: string;
  chassi?: string;
  km?: number;
  criado_em: string;
  atualizado_em: string;
  cliente?: Cliente;
}

export interface Mecanico {
  id: number;
  nome: string;
  especialidade: string;
  telefone: string;
  email?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  preco_padrao: number;
  tempo_estimado?: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Peca {
  id: number;
  nome: string;
  numero_peca: string;
  descricao?: string;
  categoria_id?: number;
  preco_custo: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  localizacao?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface OrdemServico {
  id: number;
  cliente_id: number;
  veiculo_id: number;
  mecanico_id: number;
  data_abertura: string;
  data_conclusao?: string;
  status: 'Aguardando' | 'Em Andamento' | 'Concluído' | 'Pago';
  descricao_problema?: string;
  observacoes?: string;
  forma_pagamento?: string;
  desconto: number;
  valor_total: number;
  criado_em: string;
  atualizado_em: string;

  // Relacionamentos
  cliente?: Cliente;
  veiculo?: Veiculo;
  mecanico?: Mecanico;
  servicos?: OSServico[];
  pecas?: OSPeca[];
  fotos?: OSFoto[];
}

export interface OSServico {
  id: number;
  os_id: number;
  servico_id: number;
  preco_servico: number;
  quantidade: number;
  servico?: Servico;
}

export interface OSPeca {
  id: number;
  os_id: number;
  peca_id: number;
  quantidade: number;
  preco_unitario: number;
  peca?: Peca;
}

export interface OSFoto {
  id: number;
  os_id: number;
  caminho_arquivo: string;
  descricao?: string;
  criado_em: string;
}

// ============================================
// TIPOS DE DASHBOARD
// ============================================

export interface DashboardStats {
  total_clientes: number;
  total_veiculos: number;
  os_por_status: Array<{
    status: string;
    total: string;
    valor_total: number;
  }>;
  os_mes_atual: {
    total: string;
    faturamento: number;
  };
  mecanicos_ranking: Array<{
    nome: string;
    total_os: string;
    valor_total: number;
  }>;
  pecas_estoque_baixo: number;
}

// ============================================
// TIPOS DE REQUISIÇÃO/RESPOSTA
// ============================================

export interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  sucesso: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// ============================================
// TIPOS DE FORMULÁRIO
// ============================================

export interface ClienteFormData {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email?: string;
  endereco?: string;
}

export interface VeiculoFormData {
  cliente_id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano?: number;
  cor?: string;
  chassi?: string;
  km?: number;
}

export interface MecanicoFormData {
  nome: string;
  especialidade: string;
  telefone: string;
  email?: string;
}

export interface ServicoFormData {
  nome: string;
  descricao?: string;
  preco_padrao: number;
  tempo_estimado?: number;
  ativo: boolean;
}

export interface PecaFormData {
  nome: string;
  numero_peca: string;
  descricao?: string;
  categoria_id?: number;
  preco_custo: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  localizacao?: string;
}

export interface OSFormData {
  cliente_id: number;
  veiculo_id: number;
  mecanico_id: number;
  data_abertura: string;
  data_conclusao?: string;
  status: string;
  descricao_problema?: string;
  observacoes?: string;
  forma_pagamento?: string;
  desconto?: number;
  servicos?: Array<{
    servico_id: number;
    preco_unitario: number;
    quantidade: number;
  }>;
  pecas?: Array<{
    peca_id: number;
    quantidade: number;
    preco_unitario: number;
  }>;
}
