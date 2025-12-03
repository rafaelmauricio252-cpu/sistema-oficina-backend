# 🚗 DOCUMENTAÇÃO TÉCNICA COMPLETA - SISTEMA DE OFICINA MECÂNICA

**Última atualização:** 2025-11-30 18:15
**Versão do Sistema:** 2.3.0
**Status:** ✅ EM PRODUÇÃO E FUNCIONANDO PERFEITAMENTE

---

## 📑 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Schema do Banco de Dados](#4-schema-do-banco-de-dados)
5. [Endpoints da API](#5-endpoints-da-api)
6. [Regras de Negócio](#6-regras-de-negócio)
7. [Backend - Padrões de Desenvolvimento](#7-backend---padrões-de-desenvolvimento)
8. [Frontend - Padrões de Desenvolvimento](#8-frontend---padrões-de-desenvolvimento)
9. [Fluxos Críticos do Sistema](#9-fluxos-críticos-do-sistema)
10. [Configuração de Ambiente](#10-configuração-de-ambiente)
11. [Como Adicionar Novas Funcionalidades](#11-como-adicionar-novas-funcionalidades)
12. [Troubleshooting](#12-troubleshooting)
13. [Histórico de Mudanças](#13-histórico-de-mudanças)

---

## 1. VISÃO GERAL

### O que é este sistema?

Sistema web completo de gestão de oficina mecânica desenvolvido com arquitetura full-stack moderna. Permite gerenciar:

- **Clientes** - Cadastro completo com CPF/CNPJ único
- **Veículos** - Vinculados a clientes com placas únicas
- **Mecânicos** - Profissionais com especialidades
- **Serviços** - Catálogo de serviços com preços padrão
- **Peças** - Controle de estoque com alertas de estoque mínimo
- **Ordens de Serviço** - Gestão completa com serviços, peças, fotos e pagamentos

### Características principais

✅ **Backend robusto** - Node.js + Express + PostgreSQL + Knex.js
✅ **Frontend moderno** - React 19 + TypeScript + Material-UI 7
✅ **Validações em camadas** - Frontend (UX) + Backend (segurança)
✅ **Transações atômicas** - Operações complexas com rollback automático
✅ **Controle de estoque** - Baixa automática ao criar OS
✅ **Proteção de dados** - Campos críticos bloqueados quando há dependências
✅ **Deploy automatizado** - CI/CD no Render com migrations automáticas

### URLs de Produção

- **Frontend:** https://sistema-oficina-frontend-xpgo.onrender.com
- **Backend API:** https://sistema-oficina-backend.onrender.com/api
- **PostgreSQL:** Render PostgreSQL - "Banco Sistema de Oficina"

---

## 2. STACK TECNOLÓGICA

### Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | LTS | Runtime JavaScript |
| **Express** | 4.18.2 | Framework web minimalista |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **Knex.js** | 3.1.0 | Query builder SQL |
| **node-pg-migrate** | 8.0.3 | Sistema de migrations |
| **Multer** | 1.4.5 | Upload de arquivos (fotos) |
| **Helmet** | 8.1.0 | Segurança HTTP headers |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing |
| **Nodemon** | 3.0.1 | Auto-reload em desenvolvimento |
| **Jest** | 30.2.0 | Framework de testes (preparado) |

**Formato de módulos:** ES Modules (`"type": "module"` no package.json)

### Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 19.2.0 | Biblioteca UI |
| **TypeScript** | 5.9.3 | Tipagem estática |
| **Material-UI** | 7.3.5 | Biblioteca de componentes |
| **React Router DOM** | 7.9.6 | Navegação SPA |
| **Axios** | 1.13.2 | Cliente HTTP |
| **Vite** | 7.2.2 | Build tool e dev server |
| **Zustand** | 5.0.8 | State management (instalado, não usado ainda) |

**Importante:** MUI v7 removeu `Unstable_Grid2`, sistema usa `Box` com CSS Grid nativo.

### Banco de Dados

| Item | Configuração |
|------|--------------|
| **SGBD** | PostgreSQL 15+ |
| **Dev** | localhost:5432 / oficina_db |
| **Produção** | Render PostgreSQL (SSL obrigatório) |
| **Charset** | UTF-8 |
| **Timezone** | UTC (conversão no frontend) |

---

## 3. ARQUITETURA DO SISTEMA

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    (React + TypeScript)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │ Services │  │  Types   │   │
│  │  (CRUD)  │  │ (Layout) │  │  (API)   │  │ (TS I/F) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                         ↓                                    │
│                    Axios (HTTP)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTPS/JSON
                         │
┌────────────────────────┴────────────────────────────────────┐
│                         BACKEND                              │
│                   (Node.js + Express)                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │→ │Controllers│→ │   DB     │  │  Utils   │   │
│  │(Express) │  │ (Logic)   │  │ (Knex)   │  │(Helpers) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       ↓              ↓              ↓                        │
│  Middlewares    Validações    Transações                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                    SQL/SSL
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      POSTGRESQL                              │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Clientes  │  │  Veículos  │  │  Mecânicos │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Serviços  │  │   Peças    │  │ OS (main)  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │OS_Serviços │  │  OS_Peças  │  │  OS_Fotos  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Diretórios Completa

```
C:\Projeto Sistema Web Oficina\
│
├── .claude/
│   ├── project-context.md          # Contexto anterior (substituído)
│   └── DOCUMENTACAO-COMPLETA.md    # 📘 ESTE ARQUIVO
│
├── backend/
│   ├── config/
│   │   └── db.js                   # Configuração Knex + PostgreSQL
│   ├── controllers/
│   │   ├── clienteController.js    # CRUD + busca autocomplete + proteção
│   │   ├── veiculoController.js    # CRUD veículos
│   │   ├── osController.js         # CRUD OS + transações
│   │   ├── estoqueController.js    # CRUD peças + controle estoque
│   │   ├── auxiliarController.js   # Mecânicos + Serviços + Dashboard
│   │   └── uploadController.js     # Upload de fotos
│   ├── routes/
│   │   ├── clienteRoutes.js
│   │   ├── veiculoRoutes.js
│   │   ├── osRoutes.js
│   │   ├── estoqueRoutes.js
│   │   ├── auxiliarRoutes.js
│   │   └── uploadRoutes.js
│   ├── middlewares/
│   │   └── validarDados.js         # Validações de entrada
│   ├── migrations/                 # 8 migrations (schema + ajustes)
│   │   └── 1763462311228_adicionar-not-null-clientes.js
│   ├── utils/
│   │   └── formatadores.js         # Funções auxiliares (formatação)
│   ├── uploads/                    # Pasta de uploads de fotos
│   ├── server.js                   # Servidor Express (middlewares + rotas)
│   ├── startup.js                  # Entry point (inicia server.js)
│   ├── knexfile.js                 # Config Knex (dev, test, prod)
│   ├── package.json                # Dependências backend
│   └── .env                        # Variáveis de ambiente (local)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/
│   │   │       └── Layout.tsx      # Sidebar + AppBar + Outlet
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.tsx   # Cards estatísticas + tabelas
│   │   │   ├── Clientes/
│   │   │   │   └── Clientes.tsx    # CRUD + proteção de edição
│   │   │   ├── Veiculos/
│   │   │   │   └── Veiculos.tsx    # CRUD veículos
│   │   │   ├── Mecanicos/
│   │   │   │   └── Mecanicos.tsx   # CRUD mecânicos
│   │   │   ├── Servicos/
│   │   │   │   └── Servicos.tsx    # CRUD serviços
│   │   │   ├── Pecas/
│   │   │   │   └── Pecas.tsx       # CRUD peças + estoque
│   │   │   └── OrdemServico/
│   │   │       └── OrdemServico.tsx # CRUD OS (mais complexo)
│   │   ├── services/
│   │   │   ├── api.ts              # Axios instance + interceptors
│   │   │   ├── clienteService.ts
│   │   │   ├── veiculoService.ts
│   │   │   ├── mecanicoService.ts
│   │   │   ├── servicoService.ts
│   │   │   ├── pecaService.ts
│   │   │   ├── ordemServicoService.ts
│   │   │   └── dashboardService.ts
│   │   ├── types/
│   │   │   └── index.ts            # ✅ Todas interfaces TypeScript
│   │   ├── App.tsx                 # Router + Theme Provider
│   │   └── main.tsx                # Entry point
│   ├── public/
│   ├── package.json                # Dependências frontend
│   ├── vite.config.ts              # Configuração Vite
│   ├── tsconfig.json               # Config TypeScript
│   └── .env                        # Variáveis de ambiente (local)
│
└── Documentações/                  # ⚠️ Arquivos antigos (desatualizados)
    ├── Resumo do backend.txt
    ├── Resumo do frontend.txt
    └── Relatorio_render_atualizado_FINAL.txt
```

### Separação de Repositórios Git

**IMPORTANTE:** Frontend e backend estão em repositórios Git **SEPARADOS** no Render:

- **Backend:** https://github.com/rafaelmauricio252-cpu/sistema-oficina-backend
- **Frontend:** https://github.com/rafaelmauricio252-cpu/sistema-oficina-frontend

Cada um faz deploy independente quando recebe push na branch `main`.

---

## 4. SCHEMA DO BANCO DE DADOS

### Diagrama de Relacionamentos

```
┌─────────────┐         ┌─────────────┐
│  CLIENTES   │1       *│  VEÍCULOS   │
│             │◄────────┤             │
│ id (PK)     │         │ id (PK)     │
│ nome        │         │ placa       │
│ cpf_cnpj    │         │ modelo      │
│ telefone    │         │ cliente_id  │
│ email       │         │ marca       │
│ endereco    │         │ ano         │
│ tipo_pessoa │         │ cor         │
│ created_at  │         │ created_at  │
│ updated_at  │         │ updated_at  │
└─────────────┘         └─────────────┘
                               │
                               │1
                               │
                               │*
                        ┌─────────────┐
                        │ ORDENS_SERV │
                        │             │
                        │ id (PK)     │
                        │ veiculo_id  │
                        │ numero      │
                        │ data_entrada│
                        │ data_prevista│
                        │ data_saida  │
                        │ status      │
                        │ km_atual    │
                        │ observacoes │
                        │ valor_total │
                        │ desconto    │
                        │ valor_final │
                        │ forma_pgto  │
                        │ created_at  │
                        │ updated_at  │
                        └─────────────┘
                         │          │
                    ┌────┘          └────┐
                    │1                   │1
                    │*                   │*
          ┌─────────────┐       ┌─────────────┐
          │OS_SERVICOS  │       │  OS_PECAS   │
          │             │       │             │
          │ id (PK)     │       │ id (PK)     │
          │ os_id       │       │ os_id       │
          │ servico_id  │       │ peca_id     │
          │ mecanico_id │       │ quantidade  │
          │ valor       │       │ valor_unit  │
          │ observacoes │       │ valor_total │
          └─────────────┘       └─────────────┘
                │                       │
                │*                      │*
                │1                      │1
                │                       │
          ┌─────────────┐       ┌─────────────┐
          │  MECANICOS  │       │    PECAS    │
          │             │       │             │
          │ id (PK)     │       │ id (PK)     │
          │ nome        │       │ codigo      │
          │ cpf         │       │ nome        │
          │ telefone    │       │ descricao   │
          │ email       │       │ preco_custo │
          │ especialidade│      │ preco_venda │
          │ salario     │       │ estoque_atual│
          │ data_admissao│      │ estoque_min │
          │ status      │       │ fornecedor  │
          │ created_at  │       │ created_at  │
          │ updated_at  │       │ updated_at  │
          └─────────────┘       └─────────────┘
                │1
                │
                │*
          ┌─────────────┐
          │  SERVICOS   │
          │             │
          │ id (PK)     │
          │ codigo      │
          │ nome        │
          │ descricao   │
          │ preco       │
          │ tempo_estimado│
          │ categoria   │
          │ created_at  │
          │ updated_at  │
          └─────────────┘

┌─────────────┐
│  OS_FOTOS   │1
│             │◄────────┐
│ id (PK)     │         │
│ os_id       │         │* (Ordens de Serviço)
│ caminho     │
│ descricao   │
│ created_at  │
└─────────────┘
```

### Tabela: CLIENTES

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único do cliente |
| nome | VARCHAR(255) | NOT NULL | Nome completo ou Razão Social |
| cpf_cnpj | VARCHAR(18) | UNIQUE, NOT NULL | CPF ou CNPJ |
| telefone | VARCHAR(20) | NOT NULL | Telefone principal |
| email | VARCHAR(255) | NULL | Email do cliente |
| endereco | TEXT | NULL | Endereço completo |
| tipo_pessoa | VARCHAR(2) | NULL | 'PF' ou 'PJ' |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última atualização |

**Constraints adicionais:**
- CPF/CNPJ deve ser único no sistema
- Não pode excluir se tiver veículos vinculados
- Não pode editar CPF/CNPJ se tiver veículos vinculados

### Tabela: VEICULOS

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único do veículo |
| placa | VARCHAR(10) | UNIQUE, NOT NULL | Placa do veículo |
| modelo | VARCHAR(100) | NOT NULL | Modelo do veículo |
| marca | VARCHAR(50) | NOT NULL | Marca do veículo |
| ano | INTEGER | NOT NULL | Ano de fabricação |
| cor | VARCHAR(30) | NULL | Cor do veículo |
| cliente_id | INTEGER | FK→clientes(id), NOT NULL | Cliente proprietário |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última atualização |

**Constraints adicionais:**
- Placa deve ser única no sistema
- ON DELETE RESTRICT no cliente (impede exclusão se tiver veículos)

### Tabela: MECANICOS

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único do mecânico |
| nome | VARCHAR(255) | NOT NULL | Nome completo |
| cpf | VARCHAR(14) | UNIQUE, NOT NULL | CPF do mecânico |
| telefone | VARCHAR(20) | NOT NULL | Telefone de contato |
| email | VARCHAR(255) | NULL | Email do mecânico |
| especialidade | VARCHAR(100) | NULL | Área de especialização |
| salario | DECIMAL(10,2) | NULL | Salário do mecânico |
| data_admissao | DATE | NULL | Data de admissão |
| status | VARCHAR(20) | DEFAULT 'ativo' | Status: ativo/inativo |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última atualização |

### Tabela: SERVICOS

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único do serviço |
| codigo | VARCHAR(50) | UNIQUE, NOT NULL | Código do serviço |
| nome | VARCHAR(255) | NOT NULL | Nome do serviço |
| descricao | TEXT | NULL | Descrição detalhada |
| preco | DECIMAL(10,2) | NOT NULL | Preço padrão |
| tempo_estimado | INTEGER | NULL | Tempo em minutos |
| categoria | VARCHAR(100) | NULL | Categoria do serviço |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última atualização |

### Tabela: PECAS

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único da peça |
| codigo | VARCHAR(50) | UNIQUE, NOT NULL | Código da peça |
| nome | VARCHAR(255) | NOT NULL | Nome da peça |
| descricao | TEXT | NULL | Descrição detalhada |
| preco_custo | DECIMAL(10,2) | NOT NULL | Preço de custo |
| preco_venda | DECIMAL(10,2) | NOT NULL | Preço de venda |
| estoque_atual | INTEGER | DEFAULT 0 | Quantidade em estoque |
| estoque_minimo | INTEGER | DEFAULT 0 | Estoque mínimo |
| fornecedor | VARCHAR(255) | NULL | Fornecedor da peça |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última atualização |

**Constraints adicionais:**
- `estoque_atual` não pode ser negativo
- Alerta se `estoque_atual < estoque_minimo`

### Tabela: ORDENS_SERVICO

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único da OS |
| numero | VARCHAR(50) | UNIQUE, NOT NULL | Número da OS |
| veiculo_id | INTEGER | FK→veiculos(id), NOT NULL | Veículo da OS |
| data_entrada | DATE | NOT NULL | Data de entrada |
| data_prevista | DATE | NULL | Data prevista término |
| data_saida | DATE | NULL | Data de saída real |
| status | VARCHAR(20) | DEFAULT 'aberta' | Status da OS |
| km_atual | INTEGER | NULL | KM do veículo |
| observacoes | TEXT | NULL | Observações gerais |
| valor_total | DECIMAL(10,2) | DEFAULT 0 | Soma serviços+peças |
| desconto | DECIMAL(10,2) | DEFAULT 0 | Desconto aplicado |
| valor_final | DECIMAL(10,2) | DEFAULT 0 | Valor após desconto |
| forma_pagamento | VARCHAR(50) | NULL | Forma de pagamento |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última atualização |

**Status possíveis:**
- `aberta` - OS criada, aguardando execução
- `em_andamento` - Serviços sendo executados
- `aguardando_pecas` - Aguardando chegada de peças
- `finalizada` - OS concluída
- `cancelada` - OS cancelada

### Tabela: OS_SERVICOS (Tabela Pivot)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único do registro |
| os_id | INTEGER | FK→ordens_servico(id), NOT NULL | Ordem de Serviço |
| servico_id | INTEGER | FK→servicos(id), NOT NULL | Serviço executado |
| mecanico_id | INTEGER | FK→mecanicos(id), NULL | Mecânico responsável |
| valor | DECIMAL(10,2) | NOT NULL | Valor cobrado |
| observacoes | TEXT | NULL | Observações do serviço |

**Constraints adicionais:**
- ON DELETE CASCADE na OS (remove serviços ao excluir OS)

### Tabela: OS_PECAS (Tabela Pivot)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único do registro |
| os_id | INTEGER | FK→ordens_servico(id), NOT NULL | Ordem de Serviço |
| peca_id | INTEGER | FK→pecas(id), NOT NULL | Peça utilizada |
| quantidade | INTEGER | NOT NULL | Quantidade usada |
| valor_unitario | DECIMAL(10,2) | NOT NULL | Preço unitário |
| valor_total | DECIMAL(10,2) | NOT NULL | quantidade * valor_unitario |

**Constraints adicionais:**
- ON DELETE CASCADE na OS (remove peças ao excluir OS)
- Trigger automático de baixa no estoque ao inserir

### Tabela: OS_FOTOS

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | SERIAL | PRIMARY KEY | ID único da foto |
| os_id | INTEGER | FK→ordens_servico(id), NOT NULL | Ordem de Serviço |
| caminho | VARCHAR(500) | NOT NULL | Path do arquivo |
| descricao | TEXT | NULL | Descrição da foto |
| created_at | TIMESTAMP | DEFAULT NOW() | Data do upload |

**Constraints adicionais:**
- ON DELETE CASCADE na OS (remove fotos ao excluir OS)

---

## 5. ENDPOINTS DA API

**Base URL:** `https://sistema-oficina-backend.onrender.com/api`
**Formato:** JSON (Content-Type: application/json)

### 5.1 Clientes (`/api/clientes`)

#### GET `/api/clientes`
Retorna lista de todos os clientes

**Query params:**
- `busca` (opcional) - Busca por nome ou CPF/CNPJ

**Response 200:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "cpf_cnpj": "123.456.789-00",
    "telefone": "(11) 98765-4321",
    "email": "joao@email.com",
    "endereco": "Rua A, 123",
    "tipo_pessoa": "PF",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/clientes/:id`
Retorna um cliente específico

**Response 200:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "cpf_cnpj": "123.456.789-00",
  "telefone": "(11) 98765-4321",
  "email": "joao@email.com",
  "endereco": "Rua A, 123",
  "tipo_pessoa": "PF"
}
```

**Response 404:**
```json
{
  "erro": "Cliente não encontrado"
}
```

#### POST `/api/clientes`
Cria novo cliente

**Request Body:**
```json
{
  "nome": "João Silva",
  "cpf_cnpj": "123.456.789-00",
  "telefone": "(11) 98765-4321",
  "email": "joao@email.com",
  "endereco": "Rua A, 123",
  "tipo_pessoa": "PF"
}
```

**Response 201:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "cpf_cnpj": "123.456.789-00",
  "telefone": "(11) 98765-4321",
  "email": "joao@email.com",
  "endereco": "Rua A, 123",
  "tipo_pessoa": "PF"
}
```

**Response 400:**
```json
{
  "erro": "CPF/CNPJ já cadastrado"
}
```

#### PUT `/api/clientes/:id`
Atualiza cliente existente

**Request Body:** (mesmo formato do POST)

**Response 200:**
```json
{
  "id": 1,
  "nome": "João Silva Atualizado",
  ...
}
```

**Response 400:**
```json
{
  "erro": "Não é possível alterar CPF/CNPJ de cliente com veículos vinculados"
}
```

#### DELETE `/api/clientes/:id`
Exclui cliente (se não tiver veículos)

**Response 204:** (sem conteúdo)

**Response 400:**
```json
{
  "erro": "Não é possível excluir cliente com veículos vinculados"
}
```

#### GET `/api/clientes/autocomplete`
Busca clientes para autocomplete (retorna nome, CPF, telefone)

**Query params:**
- `busca` (obrigatório) - Termo de busca

**Response 200:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "cpf_cnpj": "123.456.789-00",
    "telefone": "(11) 98765-4321"
  }
]
```

---

### 5.2 Veículos (`/api/veiculos`)

#### GET `/api/veiculos`
Retorna lista de todos os veículos

**Query params:**
- `cliente_id` (opcional) - Filtra por cliente

**Response 200:**
```json
[
  {
    "id": 1,
    "placa": "ABC-1234",
    "modelo": "Gol",
    "marca": "Volkswagen",
    "ano": 2020,
    "cor": "Prata",
    "cliente_id": 1,
    "cliente_nome": "João Silva",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/veiculos/:id`
Retorna veículo específico

**Response 200:**
```json
{
  "id": 1,
  "placa": "ABC-1234",
  "modelo": "Gol",
  "marca": "Volkswagen",
  "ano": 2020,
  "cor": "Prata",
  "cliente_id": 1,
  "cliente": {
    "id": 1,
    "nome": "João Silva",
    "telefone": "(11) 98765-4321"
  }
}
```

#### GET `/api/veiculos/:id/tem-os`
Verifica se veículo tem ordens de serviço (para proteção de campos)

**Response 200:**
```json
{
  "sucesso": true,
  "tem_os": true,
  "campos_protegidos": ["placa", "marca", "modelo", "ano"]
}
```

#### POST `/api/veiculos`
Cria novo veículo

**Request Body:**
```json
{
  "placa": "ABC-1234",
  "modelo": "Gol",
  "marca": "Volkswagen",
  "ano": 2020,
  "cor": "Prata",
  "cliente_id": 1
}
```

**Response 201:** (mesmo formato da resposta GET)

**Response 400:**
```json
{
  "erro": "Placa já cadastrada"
}
```

#### PUT `/api/veiculos/:id`
Atualiza veículo

**Response 200:** (mesmo formato GET)

#### DELETE `/api/veiculos/:id`
Exclui veículo (se não tiver OS)

**Response 204:** (sem conteúdo)

**Response 400:**
```json
{
  "erro": "Não é possível excluir veículo com ordens de serviço vinculadas"
}
```

---

### 5.3 Mecânicos (`/api/mecanicos`)

#### GET `/api/mecanicos`
Lista todos os mecânicos

**Response 200:**
```json
[
  {
    "id": 1,
    "nome": "Carlos Mecânico",
    "cpf": "123.456.789-00",
    "telefone": "(11) 91234-5678",
    "email": "carlos@oficina.com",
    "especialidade": "Motor",
    "salario": 3500.00,
    "data_admissao": "2024-01-10",
    "status": "ativo"
  }
]
```

#### POST `/api/mecanicos`
Cria novo mecânico

**Request Body:**
```json
{
  "nome": "Carlos Mecânico",
  "cpf": "123.456.789-00",
  "telefone": "(11) 91234-5678",
  "email": "carlos@oficina.com",
  "especialidade": "Motor",
  "salario": 3500.00,
  "data_admissao": "2024-01-10",
  "status": "ativo"
}
```

**Response 201:** (mesmo formato)

#### PUT `/api/mecanicos/:id`
Atualiza mecânico

#### DELETE `/api/mecanicos/:id`
Exclui mecânico

**Response 204:** (sem conteúdo)

---

### 5.4 Serviços (`/api/servicos`)

#### GET `/api/servicos`
Lista todos os serviços

**Response 200:**
```json
[
  {
    "id": 1,
    "codigo": "SERV001",
    "nome": "Troca de Óleo",
    "descricao": "Troca de óleo do motor",
    "preco": 150.00,
    "tempo_estimado": 60,
    "categoria": "Manutenção"
  }
]
```

#### POST `/api/servicos`
Cria novo serviço

**Request Body:**
```json
{
  "codigo": "SERV001",
  "nome": "Troca de Óleo",
  "descricao": "Troca de óleo do motor",
  "preco": 150.00,
  "tempo_estimado": 60,
  "categoria": "Manutenção"
}
```

**Response 201:** (mesmo formato)

**Response 400:**
```json
{
  "erro": "Código de serviço já cadastrado"
}
```

#### PUT `/api/servicos/:id`
Atualiza serviço

#### DELETE `/api/servicos/:id`
Exclui serviço

---

### 5.5 Peças (`/api/pecas`)

#### GET `/api/pecas`
Lista todas as peças

**Response 200:**
```json
[
  {
    "id": 1,
    "codigo": "PECA001",
    "nome": "Filtro de Óleo",
    "descricao": "Filtro de óleo original",
    "preco_custo": 25.00,
    "preco_venda": 45.00,
    "estoque_atual": 50,
    "estoque_minimo": 10,
    "fornecedor": "Auto Peças XYZ",
    "alerta_estoque": false
  }
]
```

#### GET `/api/pecas/:id`
Retorna peça específica

#### POST `/api/pecas`
Cria nova peça

**Request Body:**
```json
{
  "codigo": "PECA001",
  "nome": "Filtro de Óleo",
  "descricao": "Filtro de óleo original",
  "preco_custo": 25.00,
  "preco_venda": 45.00,
  "estoque_atual": 50,
  "estoque_minimo": 10,
  "fornecedor": "Auto Peças XYZ"
}
```

**Response 201:** (mesmo formato)

**Response 400:**
```json
{
  "erro": "Código de peça já cadastrado"
}
```

#### PUT `/api/pecas/:id`
Atualiza peça

#### DELETE `/api/pecas/:id`
Exclui peça (se não tiver sido usada em OS)

---

### 5.6 Ordens de Serviço (`/api/ordens-servico`)

#### GET `/api/ordens-servico`
Lista todas as OS

**Query params:**
- `status` (opcional) - Filtra por status
- `data_inicio` (opcional) - Filtra por data inicial
- `data_fim` (opcional) - Filtra por data final

**Response 200:**
```json
[
  {
    "id": 1,
    "numero": "OS-2025-001",
    "veiculo_id": 1,
    "veiculo_placa": "ABC-1234",
    "veiculo_modelo": "Gol",
    "cliente_nome": "João Silva",
    "data_entrada": "2025-01-15",
    "data_prevista": "2025-01-20",
    "data_saida": null,
    "status": "em_andamento",
    "km_atual": 50000,
    "observacoes": "Cliente relata barulho no motor",
    "valor_total": 500.00,
    "desconto": 0.00,
    "valor_final": 500.00,
    "forma_pagamento": "Cartão"
  }
]
```

#### GET `/api/ordens-servico/:id`
Retorna OS completa com serviços, peças e fotos

**Response 200:**
```json
{
  "id": 1,
  "numero": "OS-2025-001",
  "veiculo": {
    "id": 1,
    "placa": "ABC-1234",
    "modelo": "Gol",
    "marca": "Volkswagen",
    "cliente": {
      "id": 1,
      "nome": "João Silva",
      "telefone": "(11) 98765-4321"
    }
  },
  "data_entrada": "2025-01-15",
  "data_prevista": "2025-01-20",
  "data_saida": null,
  "status": "em_andamento",
  "km_atual": 50000,
  "observacoes": "Cliente relata barulho no motor",
  "servicos": [
    {
      "id": 1,
      "servico_id": 1,
      "servico_nome": "Troca de Óleo",
      "mecanico_id": 1,
      "mecanico_nome": "Carlos Mecânico",
      "valor": 150.00,
      "observacoes": ""
    }
  ],
  "pecas": [
    {
      "id": 1,
      "peca_id": 1,
      "peca_nome": "Filtro de Óleo",
      "quantidade": 1,
      "valor_unitario": 45.00,
      "valor_total": 45.00
    }
  ],
  "fotos": [
    {
      "id": 1,
      "caminho": "/uploads/os-1-foto-1.jpg",
      "descricao": "Motor antes do serviço"
    }
  ],
  "valor_total": 500.00,
  "desconto": 0.00,
  "valor_final": 500.00,
  "forma_pagamento": "Cartão"
}
```

#### POST `/api/ordens-servico`
Cria nova OS (transação atômica)

**Request Body:**
```json
{
  "numero": "OS-2025-001",
  "veiculo_id": 1,
  "data_entrada": "2025-01-15",
  "data_prevista": "2025-01-20",
  "status": "aberta",
  "km_atual": 50000,
  "observacoes": "Cliente relata barulho no motor",
  "servicos": [
    {
      "servico_id": 1,
      "mecanico_id": 1,
      "valor": 150.00,
      "observacoes": ""
    }
  ],
  "pecas": [
    {
      "peca_id": 1,
      "quantidade": 1,
      "valor_unitario": 45.00,
      "valor_total": 45.00
    }
  ],
  "desconto": 0.00,
  "forma_pagamento": "Cartão"
}
```

**Response 201:** (mesmo formato GET completo)

**Response 400:**
```json
{
  "erro": "Estoque insuficiente para a peça: Filtro de Óleo"
}
```

**Observações:**
- Cálculo automático de `valor_total` e `valor_final`
- Baixa automática no estoque das peças
- Transação com rollback em caso de erro

#### PUT `/api/ordens-servico/:id`
Atualiza OS (transação atômica)

**Request Body:** (mesmo formato POST)

**Response 200:** (mesmo formato GET completo)

**Observações:**
- Recalcula totais automaticamente
- Ajusta estoque (devolve peças antigas, baixa novas)
- Transação com rollback em caso de erro

#### DELETE `/api/ordens-servico/:id`
Exclui OS (devolve peças ao estoque)

**Response 204:** (sem conteúdo)

**Observações:**
- Devolve automaticamente as peças ao estoque
- Remove serviços, peças e fotos relacionadas (CASCADE)

#### PATCH `/api/ordens-servico/:id/status`
Atualiza apenas o status da OS

**Request Body:**
```json
{
  "status": "finalizada",
  "data_saida": "2025-01-18"
}
```

**Response 200:**
```json
{
  "id": 1,
  "status": "finalizada",
  "data_saida": "2025-01-18"
}
```

---

### 5.7 Upload de Fotos (`/api/upload`)

#### POST `/api/upload`
Upload de foto para OS

**Request:** `multipart/form-data`
- `file` - Arquivo de imagem (JPG, PNG, max 5MB)
- `os_id` - ID da Ordem de Serviço
- `descricao` - Descrição da foto (opcional)

**Response 201:**
```json
{
  "id": 1,
  "os_id": 1,
  "caminho": "/uploads/os-1-foto-1234567890.jpg",
  "descricao": "Motor antes do serviço",
  "created_at": "2025-01-15T14:30:00.000Z"
}
```

**Response 400:**
```json
{
  "erro": "Arquivo muito grande. Máximo: 5MB"
}
```

---

### 5.8 Dashboard (`/api/dashboard`)

#### GET `/api/dashboard/estatisticas`
Retorna estatísticas gerais

**Response 200:**
```json
{
  "total_clientes": 150,
  "total_veiculos": 230,
  "total_os_abertas": 12,
  "total_os_mes": 45,
  "receita_mes": 35000.00,
  "pecas_estoque_baixo": 5,
  "os_atrasadas": 2
}
```

#### GET `/api/dashboard/os-recentes`
Retorna últimas 10 OS

**Response 200:**
```json
[
  {
    "id": 1,
    "numero": "OS-2025-001",
    "cliente_nome": "João Silva",
    "veiculo_placa": "ABC-1234",
    "status": "em_andamento",
    "valor_final": 500.00,
    "data_entrada": "2025-01-15"
  }
]
```

#### GET `/api/dashboard/pecas-estoque-baixo`
Retorna peças com estoque abaixo do mínimo

**Response 200:**
```json
[
  {
    "id": 1,
    "codigo": "PECA001",
    "nome": "Filtro de Óleo",
    "estoque_atual": 5,
    "estoque_minimo": 10,
    "diferenca": -5
  }
]
```

---

### Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 204 | No Content - Exclusão bem-sucedida |
| 400 | Bad Request - Dados inválidos ou erro de validação |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro no servidor |

---

## 6. REGRAS DE NEGÓCIO

### 6.1 Clientes

#### Cadastro
- ✅ **CPF/CNPJ único**: Não pode haver dois clientes com mesmo CPF/CNPJ
- ✅ **Nome obrigatório**: Campo `nome` é obrigatório
- ✅ **Telefone obrigatório**: Campo `telefone` é obrigatório
- ✅ **Email opcional**: Campo `email` pode ser vazio
- ✅ **Tipo pessoa**: Campo `tipo_pessoa` aceita 'PF' ou 'PJ'

#### Edição
- ✅ **CPF/CNPJ protegido**: Se o cliente tiver veículos vinculados, **não pode** alterar CPF/CNPJ
- ✅ **Demais campos livres**: Outros campos podem ser alterados livremente

#### Exclusão
- ❌ **Bloqueio se tiver veículos**: Não pode excluir cliente que tem veículos vinculados
- ✅ **Mensagem clara**: Retorna erro explicando o motivo
- ✅ **Solução**: Primeiro excluir todos os veículos do cliente

### 6.2 Veículos

#### Cadastro
- ✅ **Placa única**: Não pode haver dois veículos com mesma placa
- ✅ **Cliente obrigatório**: Todo veículo precisa estar vinculado a um cliente
- ✅ **Campos obrigatórios**: placa, modelo, marca, ano, cliente_id
- ✅ **Cor opcional**: Campo `cor` pode ser vazio

#### Edição
- ✅ **Proteção com OS**: Se o veículo tiver Ordens de Serviço vinculadas, **não pode** alterar Placa, Marca, Modelo ou Ano (integridade fiscal)
- ✅ **Trocar proprietário**: Pode alterar `cliente_id` para transferir veículo
- ✅ **Demais campos**: Cor, KM, Chassi podem ser alterados livremente

#### Exclusão
- ❌ **Bloqueio se tiver OS**: Não pode excluir veículo que tem ordens de serviço vinculadas
- ✅ **Histórico preservado**: Sistema mantém histórico de OS do veículo
- ✅ **Solução**: Não há - veículos com histórico são permanentes

### 6.3 Mecânicos

#### Cadastro
- ✅ **CPF único**: Não pode haver dois mecânicos com mesmo CPF (constraint UNIQUE)
- ✅ **Nome obrigatório**: Campo `nome` é obrigatório
- ✅ **Telefone obrigatório**: Campo `telefone` é obrigatório
- ✅ **Status padrão**: Se não informado, status é 'ativo'
- ✅ **Campos opcionais**: cpf, email, especialidade, salario, data_admissao

#### Edição
- ✅ **CPF protegido**: Se o mecânico tiver ordens de serviço vinculadas, **não pode** alterar CPF (integridade fiscal)
- ✅ **Demais campos livres**: Nome, especialidade, telefone, email podem ser alterados livremente
- ✅ **Validação no backend**: Controller `auxiliarController.js` (linhas 163-173)

#### Status
- ✅ **Ativo**: Mecânico disponível para novos serviços
- ✅ **Inativo**: Mecânico não aparece em listagens de seleção (mas histórico permanece)

#### Exclusão
- ❌ **Bloqueio se tiver OS**: Não pode excluir mecânico que possui ordens de serviço vinculadas
- ✅ **Alternativa**: Mudar status para 'inativo' preserva histórico
- ✅ **Proteção de Identidade**: CPF é imutável quando há histórico (garantia fiscal e trabalhista)

### 6.4 Serviços

#### Cadastro
- ✅ **Código único**: Não pode haver dois serviços com mesmo código
- ✅ **Nome obrigatório**: Campo `nome` é obrigatório
- ✅ **Preço obrigatório**: Campo `preco` é obrigatório
- ✅ **Preço padrão**: Preço cadastrado é sugestão, pode ser alterado na OS

#### Edição
- ✅ **Atualiza preço padrão**: Alterar preço não afeta OS antigas (usam valor da época)
- ✅ **Não afeta histórico**: OS antigas mantêm valores originais

#### Exclusão
- ✅ **Permitido**: Pode excluir mesmo com histórico de uso
- ⚠️ **Cuidado**: Serviços excluídos não aparecem mais no cadastro de novas OS

### 6.5 Peças

#### Cadastro
- ✅ **Código único**: Não pode haver duas peças com mesmo código
- ✅ **Nome obrigatório**: Campo `nome` é obrigatório
- ✅ **Preços obrigatórios**: `preco_custo` e `preco_venda` são obrigatórios
- ✅ **Estoque inicial**: Se não informado, inicia com 0
- ✅ **Estoque mínimo**: Se não informado, inicia com 0

#### Controle de Estoque
- ✅ **Baixa automática**: Ao criar OS com peças, estoque é baixado automaticamente
- ✅ **Devolução automática**: Ao excluir OS, peças retornam ao estoque
- ✅ **Ajuste em edição**: Ao editar OS:
  - Devolve peças antigas ao estoque
  - Baixa peças novas do estoque
- ❌ **Estoque negativo**: Sistema não permite estoque negativo
- ⚠️ **Alerta de estoque baixo**: Se `estoque_atual < estoque_minimo`, exibe alerta

#### Exclusão
- ⚠️ **Verificar uso**: Recomenda-se verificar se peça foi usada em OS antes de excluir
- ✅ **Alternativa**: Marcar como descontinuada (adicionar campo no futuro)

### 6.6 Ordens de Serviço (OS)

#### Cadastro
- ✅ **Número único**: Cada OS tem número único (ex: OS-2025-001)
- ✅ **Veículo obrigatório**: Toda OS precisa estar vinculada a um veículo
- ✅ **Data entrada obrigatória**: Campo `data_entrada` é obrigatório
- ✅ **Status padrão**: Se não informado, inicia como 'aberta'
- ✅ **Pode sem serviços/peças**: OS pode ser criada sem serviços ou peças (orçamento)

#### Cálculos Automáticos
```
valor_total = Σ(serviços) + Σ(peças)
valor_final = valor_total - desconto
```

- ✅ **Recalculo automático**: Backend sempre recalcula totais
- ✅ **Desconto em reais**: Campo `desconto` é em valor absoluto (não percentual)
- ✅ **Preço de venda**: Peças usam `preco_venda` no momento da OS

#### Validações de Estoque
- ❌ **Estoque insuficiente**: Não permite criar/editar OS se não houver peças suficientes
- ✅ **Mensagem clara**: Retorna qual peça está com estoque insuficiente
- ✅ **Transação atômica**: Ou salva tudo ou reverte tudo (não deixa inconsistência)

#### Edição
- ✅ **Recalcula totais**: Sempre recalcula `valor_total` e `valor_final`
- ✅ **Ajusta estoque**:
  1. Devolve peças antigas ao estoque
  2. Valida disponibilidade das novas peças
  3. Baixa novas peças do estoque
- ✅ **Transação atômica**: Garante consistência
- ❌ **BLOQUEIO: OS Paga**: Não é possível editar OS com status `Pago` (v2.3.0)
  - Backend retorna erro 400 com mensagem clara
  - Frontend desabilita botão de edição
  - Tooltip explicativo no botão desabilitado
  - Garante integridade fiscal e financeira

#### Exclusão
- ✅ **Devolve peças**: Automaticamente devolve peças ao estoque
- ✅ **Remove relacionados**: Remove serviços, peças e fotos (CASCADE)
- ❌ **BLOQUEIO: OS Paga**: Não é possível excluir OS com status `Pago` (v2.3.0)
- ⚠️ **Histórico perdido**: Considerar "cancelar" ao invés de excluir

#### Status da OS

| Status | Descrição | Ações Permitidas |
|--------|-----------|------------------|
| `aberta` | OS criada, aguardando início | Pode editar tudo |
| `em_andamento` | Serviços sendo executados | Pode editar tudo |
| `aguardando_pecas` | Aguardando chegada de peças | Pode editar tudo |
| `finalizada` | OS concluída e paga | ⚠️ Edição requer cuidado |
| `cancelada` | OS cancelada | ⚠️ Considerar não editar |

**Recomendação:** OS finalizadas e canceladas não deveriam ser editáveis (implementar validação no futuro)

#### Fotos
- ✅ **Upload ilimitado**: Pode anexar quantas fotos quiser
- ✅ **Formato aceito**: JPG, PNG
- ✅ **Tamanho máximo**: 5MB por foto
- ✅ **Descrição opcional**: Pode adicionar descrição em cada foto
- ✅ **Exclusão em cascata**: Ao excluir OS, fotos são removidas

### 6.7 Regras de Integridade Referencial

#### Clientes → Veículos
```
ON DELETE RESTRICT
```
- ❌ Não pode excluir cliente com veículos
- ✅ Solução: Excluir veículos primeiro

#### Veículos → Ordens de Serviço
```
ON DELETE RESTRICT
```
- ❌ Não pode excluir veículo com OS
- ✅ Histórico preservado permanentemente

#### OS → OS_Servicos / OS_Pecas / OS_Fotos
```
ON DELETE CASCADE
```
- ✅ Ao excluir OS, remove automaticamente:
  - Serviços vinculados
  - Peças vinculadas (e devolve ao estoque)
  - Fotos vinculadas

#### Mecânicos / Serviços / Peças → OS
```
ON DELETE RESTRICT (recomendado) ou SET NULL
```
- ⚠️ Atualmente permite excluir
- 🔮 **Melhoria futura**: Implementar proteção de histórico

### 6.8 Validações de Frontend vs Backend

#### Frontend (UX - Experiência do Usuário)
- ✅ Validação instantânea de campos obrigatórios
- ✅ Máscaras de CPF/CNPJ, telefone, placa
- ✅ Formatação automática de valores monetários
- ✅ Autocomplete para agilizar busca de clientes
- ✅ Desabilita campos protegidos (CPF de cliente com veículos)
- ✅ Cálculo em tempo real de totais da OS

#### Backend (Segurança)
- ✅ **Validação duplicada**: Mesmo com validação no frontend, backend valida tudo novamente
- ✅ **Proteção contra bypass**: Usuário mal-intencionado não consegue burlar validações
- ✅ **Unicidade garantida**: Valida CPF/CNPJ, placa, códigos únicos
- ✅ **Integridade referencial**: Valida existência de IDs referenciados
- ✅ **Transações atômicas**: Garante consistência em operações complexas

**Princípio:** Frontend valida para UX, Backend valida para segurança

### 6.9 Fluxo de Numeração de OS

#### Formato Padrão
```
OS-YYYY-NNN
```
- `YYYY` - Ano com 4 dígitos
- `NNN` - Sequencial com 3 dígitos

**Exemplos:**
- `OS-2025-001`
- `OS-2025-042`
- `OS-2025-150`

#### Geração Automática (Futuro)
🔮 **Melhoria sugerida**: Implementar geração automática no backend
```javascript
// Exemplo de lógica
const ultimaOS = await db('ordens_servico')
  .select('numero')
  .whereRaw("numero LIKE 'OS-2025-%'")
  .orderBy('numero', 'desc')
  .first();

const proximoNumero = ultimaOS
  ? parseInt(ultimaOS.numero.split('-')[2]) + 1
  : 1;

const novoNumero = `OS-2025-${String(proximoNumero).padStart(3, '0')}`;
```

Atualmente o número é informado manualmente pelo usuário.

---

## 7. BACKEND - PADRÕES DE DESENVOLVIMENTO

### 7.1 Estrutura de Arquivos

```
backend/
├── config/
│   └── db.js                 # Configuração Knex + Pool de conexões
├── controllers/
│   ├── clienteController.js  # Lógica CRUD clientes
│   ├── veiculoController.js  # Lógica CRUD veículos
│   ├── osController.js       # Lógica CRUD OS (complexa)
│   ├── estoqueController.js  # Lógica CRUD peças
│   ├── auxiliarController.js # Mecânicos, Serviços, Dashboard
│   └── uploadController.js   # Upload de fotos
├── routes/
│   ├── clienteRoutes.js      # Rotas /api/clientes
│   ├── veiculoRoutes.js      # Rotas /api/veiculos
│   ├── osRoutes.js           # Rotas /api/ordens-servico
│   ├── estoqueRoutes.js      # Rotas /api/pecas
│   ├── auxiliarRoutes.js     # Rotas /api/mecanicos, /api/servicos, /api/dashboard
│   └── uploadRoutes.js       # Rotas /api/upload
├── middlewares/
│   └── validarDados.js       # Validações de entrada
├── migrations/               # Migrations do banco
│   ├── 1731687600000_criar-tabela-clientes.js
│   ├── 1731687601000_criar-tabela-veiculos.js
│   ├── 1731687602000_criar-tabela-mecanicos.js
│   ├── 1731687603000_criar-tabela-servicos.js
│   ├── 1731687604000_criar-tabela-pecas.js
│   ├── 1731687605000_criar-tabela-ordens-servico.js
│   ├── 1731687606000_criar-tabelas-pivot.js
│   ├── 1763462311228_adicionar-not-null-clientes.js
│   └── 1764299000000_add-cpf-to-mecanicos.mjs
├── utils/
│   └── formatadores.js       # Funções auxiliares
├── uploads/                  # Pasta de uploads
├── server.js                 # Servidor Express
├── startup.js                # Entry point
├── knexfile.js               # Configuração Knex
├── package.json
└── .env                      # Variáveis de ambiente
```

### 7.2 Configuração do Knex (db.js)

**Arquivo:** `backend/config/db.js`

```javascript
import knex from 'knex';
import knexfile from '../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

const db = knex(config);

export default db;
```

**Observações:**
- Usa ES Modules (`import/export`)
- Detecta ambiente automaticamente (dev, prod, test)
- Pool de conexões configurado no knexfile.js

### 7.3 Padrão de Controller

**Estrutura padrão de um controller:**

```javascript
import db from '../config/db.js';

// GET todos
export const listar = async (req, res) => {
  try {
    const registros = await db('tabela').select('*');
    res.json(registros);
  } catch (erro) {
    console.error('Erro ao listar:', erro);
    res.status(500).json({ erro: 'Erro ao buscar registros' });
  }
};

// GET por ID
export const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await db('tabela').where({ id }).first();

    if (!registro) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    res.json(registro);
  } catch (erro) {
    console.error('Erro ao buscar:', erro);
    res.status(500).json({ erro: 'Erro ao buscar registro' });
  }
};

// POST criar
export const criar = async (req, res) => {
  try {
    const dados = req.body;

    // Validações específicas aqui

    const [novoRegistro] = await db('tabela')
      .insert(dados)
      .returning('*');

    res.status(201).json(novoRegistro);
  } catch (erro) {
    console.error('Erro ao criar:', erro);

    // Tratamento de erros específicos
    if (erro.code === '23505') { // Unique violation
      return res.status(400).json({ erro: 'Registro já existe' });
    }

    res.status(500).json({ erro: 'Erro ao criar registro' });
  }
};

// PUT atualizar
export const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    // Validações específicas aqui

    const [registroAtualizado] = await db('tabela')
      .where({ id })
      .update(dados)
      .returning('*');

    if (!registroAtualizado) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    res.json(registroAtualizado);
  } catch (erro) {
    console.error('Erro ao atualizar:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar registro' });
  }
};

// DELETE excluir
export const excluir = async (req, res) => {
  try {
    const { id } = req.params;

    // Validações de dependências aqui

    const deletado = await db('tabela').where({ id }).del();

    if (!deletado) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    res.status(204).send();
  } catch (erro) {
    console.error('Erro ao excluir:', erro);

    // Tratamento de erro de chave estrangeira
    if (erro.code === '23503') { // Foreign key violation
      return res.status(400).json({
        erro: 'Não é possível excluir registro com dependências'
      });
    }

    res.status(500).json({ erro: 'Erro ao excluir registro' });
  }
};
```

### 7.4 Padrão de Rotas

**Estrutura padrão de um arquivo de rotas:**

```javascript
import express from 'express';
import * as controller from '../controllers/nomeController.js';

const router = express.Router();

// Rotas CRUD
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

// Rotas customizadas
router.get('/autocomplete', controller.autocomplete); // ANTES de /:id
router.patch('/:id/status', controller.atualizarStatus);

export default router;
```

**⚠️ IMPORTANTE:** Rotas específicas devem vir ANTES de rotas com parâmetros

### 7.5 Transações Atômicas

**Usado em:** Ordem de Serviço (criar/atualizar/excluir)

```javascript
export const criarOS = async (req, res) => {
  const trx = await db.transaction(); // Inicia transação

  try {
    const { servicos, pecas, ...dadosOS } = req.body;

    // 1. Validar estoque ANTES de iniciar
    for (const peca of pecas) {
      const pecaDb = await trx('pecas').where({ id: peca.peca_id }).first();

      if (!pecaDb || pecaDb.estoque_atual < peca.quantidade) {
        await trx.rollback(); // Reverte tudo
        return res.status(400).json({
          erro: `Estoque insuficiente para: ${pecaDb?.nome || 'peça'}`
        });
      }
    }

    // 2. Criar OS
    const [novaOS] = await trx('ordens_servico')
      .insert(dadosOS)
      .returning('*');

    // 3. Inserir serviços
    if (servicos && servicos.length > 0) {
      const servicosComOS = servicos.map(s => ({ ...s, os_id: novaOS.id }));
      await trx('os_servicos').insert(servicosComOS);
    }

    // 4. Inserir peças E baixar estoque
    if (pecas && pecas.length > 0) {
      const pecasComOS = pecas.map(p => ({ ...p, os_id: novaOS.id }));
      await trx('os_pecas').insert(pecasComOS);

      // Baixar estoque
      for (const peca of pecas) {
        await trx('pecas')
          .where({ id: peca.peca_id })
          .decrement('estoque_atual', peca.quantidade);
      }
    }

    await trx.commit(); // Confirma tudo

    // 5. Buscar OS completa para retornar
    const osCompleta = await buscarOSCompleta(novaOS.id);
    res.status(201).json(osCompleta);

  } catch (erro) {
    await trx.rollback(); // Reverte tudo em caso de erro
    console.error('Erro ao criar OS:', erro);
    res.status(500).json({ erro: 'Erro ao criar ordem de serviço' });
  }
};
```

**Princípios de Transações:**
- ✅ **Atomicidade**: Ou faz tudo ou não faz nada
- ✅ **Validar primeiro**: Valida todas condições antes de modificar dados
- ✅ **Rollback explícito**: Sempre reverte em caso de erro
- ✅ **Commit explícito**: Confirma apenas se tudo deu certo

### 7.6 Tratamento de Erros PostgreSQL

**Códigos de erro comuns:**

```javascript
try {
  // operação no banco
} catch (erro) {
  console.error('Erro:', erro);

  // Violação de chave única (UNIQUE)
  if (erro.code === '23505') {
    const campo = erro.detail.match(/\(([^)]+)\)/)[1];
    return res.status(400).json({
      erro: `${campo} já cadastrado(a)`
    });
  }

  // Violação de chave estrangeira (FOREIGN KEY)
  if (erro.code === '23503') {
    return res.status(400).json({
      erro: 'Não é possível excluir registro com dependências'
    });
  }

  // Violação de NOT NULL
  if (erro.code === '23502') {
    return res.status(400).json({
      erro: `Campo obrigatório não informado: ${erro.column}`
    });
  }

  // Erro genérico
  res.status(500).json({ erro: 'Erro interno do servidor' });
}
```

### 7.7 Validações Backend

**Arquivo:** `backend/middlewares/validarDados.js`

```javascript
export const validarCliente = (req, res, next) => {
  const { nome, cpf_cnpj, telefone } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  if (!cpf_cnpj || cpf_cnpj.trim() === '') {
    return res.status(400).json({ erro: 'CPF/CNPJ é obrigatório' });
  }

  if (!telefone || telefone.trim() === '') {
    return res.status(400).json({ erro: 'Telefone é obrigatório' });
  }

  // Validação de formato CPF/CNPJ (opcional)
  const apenasNumeros = cpf_cnpj.replace(/\D/g, '');
  if (apenasNumeros.length !== 11 && apenasNumeros.length !== 14) {
    return res.status(400).json({ erro: 'CPF/CNPJ inválido' });
  }

  next();
};
```

**Uso nas rotas:**
```javascript
router.post('/', validarCliente, controller.criar);
router.put('/:id', validarCliente, controller.atualizar);
```

### 7.8 Queries Complexas (Joins)

**Exemplo: Listar Veículos com dados do Cliente**

```javascript
export const listarVeiculos = async (req, res) => {
  try {
    const veiculos = await db('veiculos as v')
      .leftJoin('clientes as c', 'v.cliente_id', 'c.id')
      .select(
        'v.*',
        'c.nome as cliente_nome',
        'c.telefone as cliente_telefone'
      )
      .orderBy('v.created_at', 'desc');

    res.json(veiculos);
  } catch (erro) {
    console.error('Erro ao listar veículos:', erro);
    res.status(500).json({ erro: 'Erro ao buscar veículos' });
  }
};
```

**Exemplo: Buscar OS Completa**

```javascript
const buscarOSCompleta = async (osId) => {
  const os = await db('ordens_servico as os')
    .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
    .leftJoin('clientes as c', 'v.cliente_id', 'c.id')
    .select(
      'os.*',
      'v.placa as veiculo_placa',
      'v.modelo as veiculo_modelo',
      'v.marca as veiculo_marca',
      'c.nome as cliente_nome',
      'c.telefone as cliente_telefone'
    )
    .where('os.id', osId)
    .first();

  // Buscar serviços
  const servicos = await db('os_servicos as oss')
    .leftJoin('servicos as s', 'oss.servico_id', 's.id')
    .leftJoin('mecanicos as m', 'oss.mecanico_id', 'm.id')
    .select(
      'oss.*',
      's.nome as servico_nome',
      'm.nome as mecanico_nome'
    )
    .where('oss.os_id', osId);

  // Buscar peças
  const pecas = await db('os_pecas as osp')
    .leftJoin('pecas as p', 'osp.peca_id', 'p.id')
    .select(
      'osp.*',
      'p.nome as peca_nome',
      'p.codigo as peca_codigo'
    )
    .where('osp.os_id', osId);

  // Buscar fotos
  const fotos = await db('os_fotos')
    .where('os_id', osId);

  return {
    ...os,
    servicos,
    pecas,
    fotos
  };
};
```

### 7.9 Middlewares do Express

**Arquivo:** `backend/server.js`

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middlewares globais (ordem importa!)
app.use(helmet());                    // Segurança HTTP headers
app.use(cors({                        // CORS
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());              // Parse JSON body
app.use(express.urlencoded({          // Parse URL-encoded body
  extended: true
}));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Log de requisições (dev)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Rotas da API
app.use('/api/clientes', clienteRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/mecanicos', auxiliarRoutes);
app.use('/api/servicos', auxiliarRoutes);
app.use('/api/pecas', estoqueRoutes);
app.use('/api/ordens-servico', osRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', auxiliarRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Sistema Oficina',
    versao: '2.1.0',
    status: 'online'
  });
});

// Middleware de erro 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

export default app;
```

### 7.10 Migrations

**Arquivo de exemplo:** `migrations/1731687600000_criar-tabela-clientes.js`

```javascript
export const up = async (knex) => {
  await knex.schema.createTable('clientes', (table) => {
    table.increments('id').primary();
    table.string('nome', 255).notNullable();
    table.string('cpf_cnpj', 18).notNullable().unique();
    table.string('telefone', 20).notNullable();
    table.string('email', 255);
    table.text('endereco');
    table.string('tipo_pessoa', 2);
    table.timestamps(true, true); // created_at, updated_at
  });
};

export const down = async (knex) => {
  await knex.schema.dropTableIfExists('clientes');
};
```

**Comandos:**
```bash
# Rodar migrations
npm run migrate

# Reverter última migration
npm run migrate:rollback

# Criar nova migration
npm run migrate:make nome-da-migration
```

**Scripts no package.json:**
```json
{
  "scripts": {
    "migrate": "npx knex migrate:latest",
    "migrate:rollback": "npx knex migrate:rollback",
    "migrate:make": "npx knex migrate:make"
  }
}
```

### 7.11 Variáveis de Ambiente

**Arquivo:** `backend/.env`

```bash
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/oficina_db

# ou separado:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oficina_db
DB_USER=usuario
DB_PASSWORD=senha

# Servidor
PORT=3000
NODE_ENV=development

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173

# Upload
MAX_FILE_SIZE=5242880  # 5MB em bytes
UPLOAD_DIR=uploads
```

**⚠️ IMPORTANTE:** Nunca commitar `.env` no Git!

**`.gitignore`:**
```
node_modules/
.env
uploads/
```

### 7.12 Upload de Arquivos

**Arquivo:** `backend/controllers/uploadController.js`

```javascript
import multer from 'multer';
import path from 'path';
import db from '../config/db.js';

// Configuração Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'os-' + req.body.os_id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use JPG ou PNG.'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

export const uploadFoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    const { os_id, descricao } = req.body;

    const [novaFoto] = await db('os_fotos')
      .insert({
        os_id,
        caminho: `/uploads/${req.file.filename}`,
        descricao
      })
      .returning('*');

    res.status(201).json(novaFoto);
  } catch (erro) {
    console.error('Erro ao fazer upload:', erro);
    res.status(500).json({ erro: 'Erro ao fazer upload' });
  }
};
```

**Rota:**
```javascript
import { upload, uploadFoto } from '../controllers/uploadController.js';

router.post('/', upload.single('file'), uploadFoto);
```

---

## 8. FRONTEND - PADRÕES DE DESENVOLVIMENTO

### 8.1 Estrutura de Arquivos

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       └── Layout.tsx         # Sidebar + AppBar + Outlet
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx      # Página inicial com estatísticas
│   │   ├── Clientes/
│   │   │   └── Clientes.tsx       # CRUD completo de clientes
│   │   ├── Veiculos/
│   │   │   └── Veiculos.tsx       # CRUD completo de veículos
│   │   ├── Mecanicos/
│   │   │   └── Mecanicos.tsx      # CRUD completo de mecânicos
│   │   ├── Servicos/
│   │   │   └── Servicos.tsx       # CRUD completo de serviços
│   │   ├── Pecas/
│   │   │   └── Pecas.tsx          # CRUD completo de peças
│   │   └── OrdemServico/
│   │       └── OrdemServico.tsx   # CRUD complexo de OS
│   ├── services/
│   │   ├── api.ts                 # Axios instance configurada
│   │   ├── clienteService.ts      # Funções de API de clientes
│   │   ├── veiculoService.ts      # Funções de API de veículos
│   │   ├── mecanicoService.ts     # Funções de API de mecânicos
│   │   ├── servicoService.ts      # Funções de API de serviços
│   │   ├── pecaService.ts         # Funções de API de peças
│   │   ├── ordemServicoService.ts # Funções de API de OS
│   │   └── dashboardService.ts    # Funções de API de dashboard
│   ├── types/
│   │   └── index.ts               # Interfaces TypeScript centralizadas
│   ├── App.tsx                    # Router principal + Theme
│   └── main.tsx                   # Entry point
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env                           # Variáveis de ambiente
```

### 8.2 Configuração do Axios (api.ts)

**Arquivo:** `frontend/src/services/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição (adicionar token futuramente)
api.interceptors.request.use(
  (config) => {
    // Futuramente: adicionar token de autenticação
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta (tratar erros globalmente)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento global de erros
    if (error.response) {
      // Erro de resposta do servidor
      console.error('Erro na resposta:', error.response.data);
    } else if (error.request) {
      // Erro de requisição (sem resposta)
      console.error('Erro na requisição:', error.request);
    } else {
      // Erro ao configurar requisição
      console.error('Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Variável de ambiente (.env):**
```bash
VITE_API_URL=http://localhost:3000/api
```

**Produção (.env.production):**
```bash
VITE_API_URL=https://sistema-oficina-backend.onrender.com/api
```

### 8.3 Padrão de Service

**Arquivo:** `frontend/src/services/clienteService.ts`

```typescript
import api from './api';
import { Cliente } from '../types';

export const clienteService = {
  // GET todos
  listar: async (): Promise<Cliente[]> => {
    const response = await api.get('/clientes');
    return response.data;
  },

  // GET por ID
  buscarPorId: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  // POST criar
  criar: async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
    const response = await api.post('/clientes', cliente);
    return response.data;
  },

  // PUT atualizar
  atualizar: async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data;
  },

  // DELETE excluir
  excluir: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },

  // GET autocomplete
  buscarAutocomplete: async (busca: string): Promise<Cliente[]> => {
    const response = await api.get('/clientes/autocomplete', {
      params: { busca },
    });
    return response.data;
  },
};
```

### 8.4 TypeScript - Interfaces Centralizadas

**Arquivo:** `frontend/src/types/index.ts`

```typescript
// ============= CLIENTES =============
export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email?: string;
  endereco?: string;
  tipo_pessoa?: 'PF' | 'PJ';
  created_at?: string;
  updated_at?: string;
}

// ============= VEÍCULOS =============
export interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  cor?: string;
  cliente_id: number;
  cliente_nome?: string; // Join com clientes
  created_at?: string;
  updated_at?: string;
}

// ============= MECÂNICOS =============
export interface Mecanico {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  especialidade?: string;
  salario?: number;
  data_admissao?: string;
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

// ============= SERVIÇOS =============
export interface Servico {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  preco: number;
  tempo_estimado?: number;
  categoria?: string;
  created_at?: string;
  updated_at?: string;
}

// ============= PEÇAS =============
export interface Peca {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  fornecedor?: string;
  alerta_estoque?: boolean; // Calculado no frontend
  created_at?: string;
  updated_at?: string;
}

// ============= ORDENS DE SERVIÇO =============
export interface OrdemServico {
  id: number;
  numero: string;
  veiculo_id: number;
  veiculo?: Veiculo; // Dados do veículo (join)
  data_entrada: string;
  data_prevista?: string;
  data_saida?: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_pecas' | 'finalizada' | 'cancelada';
  km_atual?: number;
  observacoes?: string;
  servicos?: OSServico[]; // Array de serviços
  pecas?: OSPeca[]; // Array de peças
  fotos?: OSFoto[]; // Array de fotos
  valor_total: number;
  desconto: number;
  valor_final: number;
  forma_pagamento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OSServico {
  id?: number;
  os_id?: number;
  servico_id: number;
  servico_nome?: string; // Join com servicos
  mecanico_id?: number;
  mecanico_nome?: string; // Join com mecanicos
  valor: number;
  observacoes?: string;
}

export interface OSPeca {
  id?: number;
  os_id?: number;
  peca_id: number;
  peca_nome?: string; // Join com pecas
  peca_codigo?: string; // Join com pecas
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface OSFoto {
  id: number;
  os_id: number;
  caminho: string;
  descricao?: string;
  created_at: string;
}

// ============= DASHBOARD =============
export interface EstatisticasDashboard {
  total_clientes: number;
  total_veiculos: number;
  total_os_abertas: number;
  total_os_mes: number;
  receita_mes: number;
  pecas_estoque_baixo: number;
  os_atrasadas: number;
}
```

### 8.5 Padrão de Página CRUD

**Estrutura comum de uma página CRUD:**

```typescript
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { clienteService } from '../../services/clienteService';
import { Cliente } from '../../types';

export default function Clientes() {
  // ============= ESTADOS =============
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [clienteAtual, setClienteAtual] = useState<Partial<Cliente>>({});
  const [erroAPI, setErroAPI] = useState('');

  // ============= CARREGAR DADOS =============
  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const dados = await clienteService.listar();
      setClientes(dados);
    } catch (erro: any) {
      console.error('Erro ao carregar clientes:', erro);
      setErroAPI(erro.response?.data?.erro || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // ============= AÇÕES CRUD =============
  const handleNovo = () => {
    setClienteAtual({});
    setModoEdicao(false);
    setDialogOpen(true);
  };

  const handleEditar = (cliente: Cliente) => {
    setClienteAtual(cliente);
    setModoEdicao(true);
    setDialogOpen(true);
  };

  const handleSalvar = async () => {
    try {
      setLoading(true);

      if (modoEdicao && clienteAtual.id) {
        await clienteService.atualizar(clienteAtual.id, clienteAtual);
      } else {
        await clienteService.criar(clienteAtual as Omit<Cliente, 'id'>);
      }

      setDialogOpen(false);
      carregarClientes();
    } catch (erro: any) {
      console.error('Erro ao salvar:', erro);
      setErroAPI(erro.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;

    try {
      setLoading(true);
      await clienteService.excluir(id);
      carregarClientes();
    } catch (erro: any) {
      console.error('Erro ao excluir:', erro);
      setErroAPI(erro.response?.data?.erro || 'Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  // ============= COLUNAS DA GRID =============
  const colunas: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nome', headerName: 'Nome', width: 250 },
    { field: 'cpf_cnpj', headerName: 'CPF/CNPJ', width: 150 },
    { field: 'telefone', headerName: 'Telefone', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEditar(params.row)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleExcluir(params.row.id)} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  // ============= RENDER =============
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Clientes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNovo}>
          Novo Cliente
        </Button>
      </Box>

      {/* Grid */}
      <Box sx={{ flexGrow: 1 }}>
        <DataGrid
          rows={clientes}
          columns={colunas}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{modoEdicao ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              value={clienteAtual.nome || ''}
              onChange={(e) => setClienteAtual({ ...clienteAtual, nome: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="CPF/CNPJ"
              value={clienteAtual.cpf_cnpj || ''}
              onChange={(e) => setClienteAtual({ ...clienteAtual, cpf_cnpj: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Telefone"
              value={clienteAtual.telefone || ''}
              onChange={(e) => setClienteAtual({ ...clienteAtual, telefone: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={clienteAtual.email || ''}
              onChange={(e) => setClienteAtual({ ...clienteAtual, email: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

### 8.6 Material-UI v7 - Grid Nativo

**⚠️ IMPORTANTE:** MUI v7 removeu `Unstable_Grid2`. Use `Box` com CSS Grid:

```typescript
// ❌ NÃO USAR (v6)
import { Unstable_Grid2 as Grid } from '@mui/material';

// ✅ USAR (v7)
import { Box } from '@mui/material';

// Grid responsivo com Box
<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',                    // Mobile: 1 coluna
      sm: 'repeat(2, 1fr)',         // Tablet: 2 colunas
      md: 'repeat(3, 1fr)',         // Desktop: 3 colunas
    },
    gap: 2,
  }}
>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</Box>
```

### 8.7 Roteamento com React Router v7

**Arquivo:** `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Clientes from './pages/Clientes/Clientes';
import Veiculos from './pages/Veiculos/Veiculos';
import Mecanicos from './pages/Mecanicos/Mecanicos';
import Servicos from './pages/Servicos/Servicos';
import Pecas from './pages/Pecas/Pecas';
import OrdemServico from './pages/OrdemServico/OrdemServico';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="veiculos" element={<Veiculos />} />
            <Route path="mecanicos" element={<Mecanicos />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="pecas" element={<Pecas />} />
            <Route path="ordens-servico" element={<OrdemServico />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
```

### 8.8 Layout com Sidebar

**Arquivo:** `frontend/src/components/Layout/Layout.tsx`

```typescript
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Build as BuildIcon,
  MiscellaneousServices as ServicesIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
  { text: 'Veículos', icon: <CarIcon />, path: '/veiculos' },
  { text: 'Mecânicos', icon: <BuildIcon />, path: '/mecanicos' },
  { text: 'Serviços', icon: <ServicesIcon />, path: '/servicos' },
  { text: 'Peças', icon: <CategoryIcon />, path: '/pecas' },
  { text: 'Ordens de Serviço', icon: <DescriptionIcon />, path: '/ordens-servico' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false); // Fecha drawer no mobile
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Sistema Oficina
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Sistema de Gestão de Oficina Mecânica
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Drawer Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
```

### 8.9 DataGrid do MUI

**Instalação:**
```bash
npm install @mui/x-data-grid
```

**Uso básico:**
```typescript
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const colunas: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'nome', headerName: 'Nome', flex: 1 },
  { field: 'telefone', headerName: 'Telefone', width: 150 },
];

<DataGrid
  rows={dados}
  columns={colunas}
  loading={loading}
  pageSizeOptions={[10, 25, 50]}
  initialState={{
    pagination: { paginationModel: { pageSize: 10 } },
  }}
  sx={{ height: 600 }}
/>
```

### 8.10 Formatação de Valores

**Criar arquivo:** `frontend/src/utils/formatadores.ts`

```typescript
// Formatar moeda BRL
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

// Formatar data BR
export const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR');
};

// Formatar CPF/CNPJ
export const formatarCPFCNPJ = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, '');

  if (apenasNumeros.length === 11) {
    // CPF: 000.000.000-00
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (apenasNumeros.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return valor;
};

// Formatar telefone
export const formatarTelefone = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, '');

  if (apenasNumeros.length === 11) {
    // (00) 90000-0000
    return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (apenasNumeros.length === 10) {
    // (00) 0000-0000
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return valor;
};
```

**Uso nas grids:**
```typescript
{
  field: 'preco',
  headerName: 'Preço',
  width: 120,
  valueFormatter: (value) => formatarMoeda(value),
}
```

---

## 9. FLUXOS CRÍTICOS DO SISTEMA

### 9.1 Fluxo Completo: Criar Ordem de Serviço

Este é o fluxo mais complexo do sistema, envolvendo múltiplas tabelas e transações atômicas.

#### Frontend (OrdemServico.tsx)

**Passo 1: Usuário preenche formulário**
```typescript
const [osAtual, setOsAtual] = useState<Partial<OrdemServico>>({
  numero: '',
  veiculo_id: 0,
  data_entrada: new Date().toISOString().split('T')[0],
  status: 'aberta',
  servicos: [],
  pecas: [],
  desconto: 0,
});
```

**Passo 2: Adiciona serviços**
```typescript
const adicionarServico = (servico: Servico, mecanico_id: number) => {
  const novoServico: OSServico = {
    servico_id: servico.id,
    servico_nome: servico.nome,
    mecanico_id,
    valor: servico.preco, // Pega preço padrão
    observacoes: '',
  };

  setOsAtual({
    ...osAtual,
    servicos: [...(osAtual.servicos || []), novoServico],
  });
};
```

**Passo 3: Adiciona peças**
```typescript
const adicionarPeca = (peca: Peca, quantidade: number) => {
  // Valida estoque ANTES de adicionar
  if (peca.estoque_atual < quantidade) {
    alert(`Estoque insuficiente! Disponível: ${peca.estoque_atual}`);
    return;
  }

  const novaPeca: OSPeca = {
    peca_id: peca.id,
    peca_nome: peca.nome,
    quantidade,
    valor_unitario: peca.preco_venda,
    valor_total: peca.preco_venda * quantidade,
  };

  setOsAtual({
    ...osAtual,
    pecas: [...(osAtual.pecas || []), novaPeca],
  });
};
```

**Passo 4: Calcula totais em tempo real**
```typescript
useEffect(() => {
  const totalServicos = osAtual.servicos?.reduce((sum, s) => sum + s.valor, 0) || 0;
  const totalPecas = osAtual.pecas?.reduce((sum, p) => sum + p.valor_total, 0) || 0;
  const valor_total = totalServicos + totalPecas;
  const valor_final = valor_total - (osAtual.desconto || 0);

  setOsAtual({
    ...osAtual,
    valor_total,
    valor_final,
  });
}, [osAtual.servicos, osAtual.pecas, osAtual.desconto]);
```

**Passo 5: Envia para API**
```typescript
const handleSalvar = async () => {
  try {
    setLoading(true);

    if (modoEdicao && osAtual.id) {
      await ordemServicoService.atualizar(osAtual.id, osAtual);
    } else {
      await ordemServicoService.criar(osAtual as Omit<OrdemServico, 'id'>);
    }

    setDialogOpen(false);
    carregarOrdens();
  } catch (erro: any) {
    alert(erro.response?.data?.erro || 'Erro ao salvar');
  } finally {
    setLoading(false);
  }
};
```

#### Backend (osController.js)

**Passo 6: Controller recebe requisição**
```javascript
export const criarOS = async (req, res) => {
  const trx = await db.transaction();

  try {
    const { servicos, pecas, ...dadosOS } = req.body;

    // PASSO 7: Validar estoque
    if (pecas && pecas.length > 0) {
      for (const peca of pecas) {
        const pecaDb = await trx('pecas').where({ id: peca.peca_id }).first();

        if (!pecaDb) {
          await trx.rollback();
          return res.status(404).json({ erro: `Peça ID ${peca.peca_id} não encontrada` });
        }

        if (pecaDb.estoque_atual < peca.quantidade) {
          await trx.rollback();
          return res.status(400).json({
            erro: `Estoque insuficiente para: ${pecaDb.nome}. Disponível: ${pecaDb.estoque_atual}`
          });
        }
      }
    }

    // PASSO 8: Calcular totais (backend sempre recalcula)
    const totalServicos = servicos?.reduce((sum, s) => sum + parseFloat(s.valor), 0) || 0;
    const totalPecas = pecas?.reduce((sum, p) => sum + parseFloat(p.valor_total), 0) || 0;
    const valor_total = totalServicos + totalPecas;
    const valor_final = valor_total - (parseFloat(dadosOS.desconto) || 0);

    dadosOS.valor_total = valor_total;
    dadosOS.valor_final = valor_final;

    // PASSO 9: Criar OS principal
    const [novaOS] = await trx('ordens_servico')
      .insert(dadosOS)
      .returning('*');

    // PASSO 10: Inserir serviços
    if (servicos && servicos.length > 0) {
      const servicosComOS = servicos.map(s => ({
        os_id: novaOS.id,
        servico_id: s.servico_id,
        mecanico_id: s.mecanico_id,
        valor: s.valor,
        observacoes: s.observacoes
      }));
      await trx('os_servicos').insert(servicosComOS);
    }

    // PASSO 11: Inserir peças E baixar estoque
    if (pecas && pecas.length > 0) {
      const pecasComOS = pecas.map(p => ({
        os_id: novaOS.id,
        peca_id: p.peca_id,
        quantidade: p.quantidade,
        valor_unitario: p.valor_unitario,
        valor_total: p.valor_total
      }));
      await trx('os_pecas').insert(pecasComOS);

      // Baixar estoque de cada peça
      for (const peca of pecas) {
        await trx('pecas')
          .where({ id: peca.peca_id })
          .decrement('estoque_atual', peca.quantidade);
      }
    }

    // PASSO 12: Commit da transação
    await trx.commit();

    // PASSO 13: Buscar OS completa para retornar
    const osCompleta = await buscarOSCompleta(novaOS.id);

    res.status(201).json(osCompleta);

  } catch (erro) {
    await trx.rollback();
    console.error('Erro ao criar OS:', erro);
    res.status(500).json({ erro: 'Erro ao criar ordem de serviço' });
  }
};
```

**Resultado final:**
- ✅ OS criada com sucesso
- ✅ Serviços vinculados
- ✅ Peças vinculadas
- ✅ Estoque baixado automaticamente
- ✅ Totais calculados corretamente
- ✅ Transação atômica (tudo ou nada)

---

### 9.2 Fluxo: Editar Ordem de Serviço

**Diferença crítica:** Ao editar OS, precisa **devolver peças antigas** e **baixar peças novas**.

#### Backend (osController.js)

```javascript
export const atualizarOS = async (req, res) => {
  const trx = await db.transaction();

  try {
    const { id } = req.params;
    const { servicos, pecas, ...dadosOS } = req.body;

    // PASSO 1: Buscar OS antiga para restaurar estoque
    const osAntiga = await trx('ordens_servico').where({ id }).first();
    if (!osAntiga) {
      await trx.rollback();
      return res.status(404).json({ erro: 'OS não encontrada' });
    }

    // PASSO 2: Buscar peças antigas
    const pecasAntigas = await trx('os_pecas').where({ os_id: id });

    // PASSO 3: Devolver peças antigas ao estoque
    for (const pecaAntiga of pecasAntigas) {
      await trx('pecas')
        .where({ id: pecaAntiga.peca_id })
        .increment('estoque_atual', pecaAntiga.quantidade);
    }

    // PASSO 4: Validar estoque das peças novas
    if (pecas && pecas.length > 0) {
      for (const peca of pecas) {
        const pecaDb = await trx('pecas').where({ id: peca.peca_id }).first();

        if (!pecaDb || pecaDb.estoque_atual < peca.quantidade) {
          await trx.rollback();
          return res.status(400).json({
            erro: `Estoque insuficiente para: ${pecaDb?.nome || 'peça'}`
          });
        }
      }
    }

    // PASSO 5: Excluir vínculos antigos
    await trx('os_servicos').where({ os_id: id }).del();
    await trx('os_pecas').where({ os_id: id }).del();

    // PASSO 6: Recalcular totais
    const totalServicos = servicos?.reduce((sum, s) => sum + parseFloat(s.valor), 0) || 0;
    const totalPecas = pecas?.reduce((sum, p) => sum + parseFloat(p.valor_total), 0) || 0;
    const valor_total = totalServicos + totalPecas;
    const valor_final = valor_total - (parseFloat(dadosOS.desconto) || 0);

    dadosOS.valor_total = valor_total;
    dadosOS.valor_final = valor_final;

    // PASSO 7: Atualizar OS principal
    const [osAtualizada] = await trx('ordens_servico')
      .where({ id })
      .update(dadosOS)
      .returning('*');

    // PASSO 8: Inserir novos serviços
    if (servicos && servicos.length > 0) {
      const servicosComOS = servicos.map(s => ({ ...s, os_id: id }));
      await trx('os_servicos').insert(servicosComOS);
    }

    // PASSO 9: Inserir novas peças E baixar estoque
    if (pecas && pecas.length > 0) {
      const pecasComOS = pecas.map(p => ({ ...p, os_id: id }));
      await trx('os_pecas').insert(pecasComOS);

      for (const peca of pecas) {
        await trx('pecas')
          .where({ id: peca.peca_id })
          .decrement('estoque_atual', peca.quantidade);
      }
    }

    await trx.commit();

    const osCompleta = await buscarOSCompleta(id);
    res.json(osCompleta);

  } catch (erro) {
    await trx.rollback();
    console.error('Erro ao atualizar OS:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar ordem de serviço' });
  }
};
```

**Sequência de operações:**
1. Devolve peças antigas ao estoque
2. Valida disponibilidade das novas peças
3. Remove vínculos antigos (serviços e peças)
4. Recalcula totais
5. Atualiza OS
6. Insere novos vínculos
7. Baixa novas peças do estoque
8. Commit

---

### 9.3 Fluxo: Excluir Ordem de Serviço

**Importante:** Ao excluir OS, precisa **devolver peças ao estoque**.

```javascript
export const excluirOS = async (req, res) => {
  const trx = await db.transaction();

  try {
    const { id } = req.params;

    // PASSO 1: Buscar peças da OS
    const pecas = await trx('os_pecas').where({ os_id: id });

    // PASSO 2: Devolver todas as peças ao estoque
    for (const peca of pecas) {
      await trx('pecas')
        .where({ id: peca.peca_id })
        .increment('estoque_atual', peca.quantidade);
    }

    // PASSO 3: Excluir OS (CASCADE remove serviços, peças e fotos)
    const deletado = await trx('ordens_servico').where({ id }).del();

    if (!deletado) {
      await trx.rollback();
      return res.status(404).json({ erro: 'OS não encontrada' });
    }

    await trx.commit();
    res.status(204).send();

  } catch (erro) {
    await trx.rollback();
    console.error('Erro ao excluir OS:', erro);
    res.status(500).json({ erro: 'Erro ao excluir ordem de serviço' });
  }
};
```

---

### 9.4 Fluxo: Proteção de Dados Críticos

#### Exemplo 1: Não pode alterar CPF/CNPJ de cliente com veículos

**Backend (clienteController.js):**
```javascript
export const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    // PROTEÇÃO: Buscar cliente atual
    const clienteAtual = await db('clientes').where({ id }).first();

    if (!clienteAtual) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    // Se está tentando alterar CPF/CNPJ
    if (dados.cpf_cnpj && dados.cpf_cnpj !== clienteAtual.cpf_cnpj) {
      // Verificar se tem veículos vinculados
      const veiculos = await db('veiculos').where({ cliente_id: id }).count('* as total');

      if (veiculos[0].total > 0) {
        return res.status(400).json({
          erro: 'Não é possível alterar CPF/CNPJ de cliente com veículos vinculados'
        });
      }
    }

    // Atualização permitida
    const [clienteAtualizado] = await db('clientes')
      .where({ id })
      .update(dados)
      .returning('*');

    res.json(clienteAtualizado);

  } catch (erro) {
    console.error('Erro ao atualizar cliente:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
};
```

**Frontend (Clientes.tsx):**
```typescript
// Desabilita campo CPF/CNPJ se cliente tiver veículos
const [clienteTemVeiculos, setClienteTemVeiculos] = useState(false);

useEffect(() => {
  if (modoEdicao && clienteAtual.id) {
    verificarVeiculos(clienteAtual.id);
  }
}, [modoEdicao, clienteAtual.id]);

const verificarVeiculos = async (clienteId: number) => {
  const veiculos = await veiculoService.listar({ cliente_id: clienteId });
  setClienteTemVeiculos(veiculos.length > 0);
};

<TextField
  label="CPF/CNPJ"
  value={clienteAtual.cpf_cnpj || ''}
  onChange={(e) => setClienteAtual({ ...clienteAtual, cpf_cnpj: e.target.value })}
  disabled={modoEdicao && clienteTemVeiculos} // Desabilita se tiver veículos
  required
  fullWidth
  helperText={
    modoEdicao && clienteTemVeiculos
      ? 'Não é possível alterar CPF/CNPJ de cliente com veículos'
      : ''
  }
/>
```

---

### 9.5 Fluxo: Autocomplete de Clientes

**Usado em:** Cadastro de veículos e Ordens de Serviço

**Frontend:**
```typescript
import { Autocomplete, TextField } from '@mui/material';

const [clientes, setClientes] = useState<Cliente[]>([]);
const [buscaCliente, setBuscaCliente] = useState('');

// Busca clientes conforme usuário digita
useEffect(() => {
  const timer = setTimeout(() => {
    if (buscaCliente.length >= 2) {
      buscarClientes();
    }
  }, 500); // Debounce de 500ms

  return () => clearTimeout(timer);
}, [buscaCliente]);

const buscarClientes = async () => {
  try {
    const resultados = await clienteService.buscarAutocomplete(buscaCliente);
    setClientes(resultados);
  } catch (erro) {
    console.error('Erro ao buscar clientes:', erro);
  }
};

<Autocomplete
  options={clientes}
  getOptionLabel={(option) => `${option.nome} - ${option.cpf_cnpj}`}
  onInputChange={(_, value) => setBuscaCliente(value)}
  onChange={(_, cliente) => {
    if (cliente) {
      setVeiculoAtual({ ...veiculoAtual, cliente_id: cliente.id });
    }
  }}
  renderInput={(params) => (
    <TextField {...params} label="Cliente" placeholder="Digite nome ou CPF/CNPJ" required />
  )}
  fullWidth
/>
```

**Backend:**
```javascript
export const buscarAutocomplete = async (req, res) => {
  try {
    const { busca } = req.query;

    if (!busca || busca.length < 2) {
      return res.json([]);
    }

    const clientes = await db('clientes')
      .where('nome', 'ilike', `%${busca}%`)
      .orWhere('cpf_cnpj', 'like', `%${busca}%`)
      .select('id', 'nome', 'cpf_cnpj', 'telefone')
      .limit(10);

    res.json(clientes);
  } catch (erro) {
    console.error('Erro ao buscar clientes:', erro);
    res.status(500).json({ erro: 'Erro ao buscar clientes' });
  }
};
```

---

### 9.6 Resumo dos Fluxos Críticos

| Fluxo | Complexidade | Transação | Validações Principais |
|-------|--------------|-----------|----------------------|
| **Criar OS** | Alta | Sim | Estoque, totais |
| **Editar OS** | Muito Alta | Sim | Estoque (devolve+baixa), totais |
| **Excluir OS** | Média | Sim | Devolve estoque |
| **Proteger CPF/CNPJ** | Média | Não | Verifica veículos vinculados |
| **Autocomplete** | Baixa | Não | Mínimo 2 caracteres |
| **Cadastros simples** | Baixa | Não | Unicidade, obrigatórios |

**Princípios aplicados:**
- ✅ Validação em camadas (frontend UX + backend segurança)
- ✅ Transações atômicas em operações complexas
- ✅ Recálculo de valores sempre no backend
- ✅ Proteção de dados críticos com dependências
- ✅ Mensagens de erro claras e específicas

---

## 10. CONFIGURAÇÃO DE AMBIENTE

### 10.1 Requisitos do Sistema

Antes de iniciar a configuração, certifique-se de ter os seguintes requisitos instalados:

| Ferramenta | Versão Mínima | Comando de Verificação | Download |
|------------|---------------|------------------------|----------|
| **Node.js** | 18.0.0+ (LTS recomendado) | `node --version` | https://nodejs.org |
| **npm** | 9.0.0+ | `npm --version` | Incluído com Node.js |
| **PostgreSQL** | 15.0+ | `psql --version` | https://www.postgresql.org |
| **Git** | 2.30+ | `git --version` | https://git-scm.com |

**Verificação rápida:**
```bash
# Execute estes comandos para verificar as versões instaladas
node --version    # Deve retornar v18.x.x ou superior
npm --version     # Deve retornar 9.x.x ou superior
psql --version    # Deve retornar 15.x ou superior
git --version     # Deve retornar 2.x.x ou superior
```

**Sistema Operacional:**
- ✅ Windows 10/11
- ✅ macOS 12+
- ✅ Linux (Ubuntu 20.04+, Debian 11+)

**Recursos de Hardware Recomendados:**
- 4GB RAM mínimo (8GB recomendado)
- 2GB espaço em disco
- Processador dual-core ou superior

---

### 10.2 Configuração do Backend

#### Passo 1: Clone o Repositório

```bash
# Clone o projeto (substitua pela URL do seu repositório)
git clone https://github.com/seu-usuario/sistema-oficina.git
cd sistema-oficina/backend
```

#### Passo 2: Instale as Dependências

```bash
# Instala todas as dependências do package.json
npm install
```

**Dependências que serão instaladas:**
- `express` - Framework web
- `pg` - Driver PostgreSQL
- `knex` - Query builder
- `multer` - Upload de arquivos
- `helmet` - Segurança HTTP
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Variáveis de ambiente
- `node-pg-migrate` - Sistema de migrations
- `nodemon` - Auto-reload em desenvolvimento

#### Passo 3: Configure as Variáveis de Ambiente

Crie o arquivo `.env` na pasta `backend/`:

```bash
# backend/.env

# ============================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ============================================
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=sua_senha_aqui
PGDATABASE=oficina_db

# ============================================
# CONFIGURAÇÕES DO SERVIDOR
# ============================================
PORT=3000

# ============================================
# AMBIENTE
# ============================================
NODE_ENV=development
```

**Importante:**
- ⚠️ Substitua `sua_senha_aqui` pela senha do seu PostgreSQL
- ⚠️ NUNCA commite o arquivo `.env` (está no `.gitignore`)
- ⚠️ Use senhas diferentes em produção

#### Passo 4: Configure o PostgreSQL

**Opção A - Usando pgAdmin:**
1. Abra o pgAdmin
2. Conecte-se ao servidor local
3. Clique com botão direito em "Databases" → "Create" → "Database"
4. Nome: `oficina_db`
5. Owner: `postgres`
6. Encoding: `UTF8`
7. Clique em "Save"

**Opção B - Usando linha de comando:**
```bash
# Conecte-se ao PostgreSQL
psql -U postgres

# Crie o banco de dados
CREATE DATABASE oficina_db WITH ENCODING 'UTF8';

# Liste os bancos para confirmar
\l

# Saia do psql
\q
```

#### Passo 5: Execute as Migrations

```bash
# Executa todas as migrations (cria as tabelas)
npm run migrate

# OU use o comando completo
npx node-pg-migrate up
```

**Migrations que serão executadas (em ordem):**
1. `1763228689561_initial-schema-setup.mjs` - Cria tabelas principais
2. `1763236820599_add-km-to-veiculos.mjs` - Adiciona campo km em veículos
3. `1763264646995_ajustar-tabela-servicos.mjs` - Ajusta tabela serviços
4. `1763265123131_adicionar-categorias-e-estoque-minimo.mjs` - Categorias e estoque
5. `1763265488801_adicionar-forma-pagamento-e-desconto-os.mjs` - Forma pagamento
6. `1763266638014_renomear-coluna-os-fotos.mjs` - Renomeia coluna fotos
7. `1763267000000_add-chassi-km-to-veiculos.mjs` - Adiciona chassi e km
8. `1763462311228_adicionar-not-null-clientes.js` - Constraints NOT NULL

**Saída esperada:**
```
> oficina-backend@2.0.0 migrate
> node-pg-migrate up

1763228689561_initial-schema-setup > migrating
1763228689561_initial-schema-setup > migrated (147ms)
1763236820599_add-km-to-veiculos > migrating
1763236820599_add-km-to-veiculos > migrated (28ms)
...
All migrations completed successfully!
```

#### Passo 6: Verifique a Estrutura do Banco

```bash
# Conecte-se ao banco
psql -U postgres -d oficina_db

# Liste as tabelas
\dt

# Veja a estrutura de uma tabela
\d clientes
\d veiculos
\d ordem_servico

# Saia
\q
```

**Tabelas esperadas:**
- `clientes`
- `veiculos`
- `mecanicos`
- `servicos`
- `pecas`
- `ordem_servico`
- `ordem_servico_servicos`
- `ordem_servico_pecas`
- `ordem_servico_fotos`
- `pgmigrations` (controle de migrations)

#### Passo 7: Inicie o Servidor de Desenvolvimento

```bash
# Inicia o servidor com auto-reload
npm run dev
```

**Saída esperada:**
```
> oficina-backend@2.0.0 dev
> npm run migrate && nodemon index.js

[nodemon] 3.0.1
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
Servidor rodando na porta 3000
```

**Teste o servidor:**
```bash
# Em outro terminal, teste a API
curl http://localhost:3000/api/mecanicos
# Deve retornar: []

curl http://localhost:3000/api/servicos
# Deve retornar: []
```

#### Estrutura de Pastas Criada

```
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── clienteController.js
│   ├── veiculoController.js
│   ├── osController.js
│   ├── estoqueController.js
│   ├── auxiliarController.js
│   └── uploadController.js
├── routes/
│   ├── clienteRoutes.js
│   ├── veiculoRoutes.js
│   ├── osRoutes.js
│   ├── estoqueRoutes.js
│   ├── auxiliarRoutes.js
│   └── uploadRoutes.js
├── middlewares/
│   └── validarDados.js
├── migrations/
│   └── [8 arquivos de migration]
├── utils/
│   └── formatadores.js
├── uploads/              # Criado automaticamente no primeiro upload
├── node_modules/         # Criado pelo npm install
├── .env                  # Você deve criar este arquivo
├── .env.example
├── .gitignore
├── knexfile.js
├── package.json
├── package-lock.json
├── server.js
└── startup.js
```

---

### 10.3 Configuração do Frontend

#### Passo 1: Navegue para a Pasta Frontend

```bash
# A partir da raiz do projeto
cd frontend
```

#### Passo 2: Instale as Dependências

```bash
# Instala todas as dependências do package.json
npm install
```

**Dependências principais que serão instaladas:**
- `react` (19.2.0) - Biblioteca UI
- `react-dom` (19.2.0) - Renderização React
- `react-router-dom` (7.9.6) - Roteamento SPA
- `@mui/material` (7.3.5) - Componentes Material-UI
- `@mui/icons-material` (7.3.5) - Ícones Material
- `axios` (1.13.2) - Cliente HTTP
- `typescript` (5.9.3) - Tipagem estática
- `vite` (7.2.2) - Build tool
- `zustand` (5.0.8) - State management

#### Passo 3: Configure as Variáveis de Ambiente

Crie o arquivo `.env` na pasta `frontend/`:

```bash
# frontend/.env

# URL da API backend (desenvolvimento)
VITE_API_URL=http://localhost:3000/api
```

**Para produção**, crie `.env.production`:
```bash
# frontend/.env.production

# URL da API backend (produção)
VITE_API_URL=https://sistema-oficina-backend.onrender.com/api
```

**Importante sobre variáveis Vite:**
- ✅ Prefixo `VITE_` é obrigatório para expor variáveis ao frontend
- ✅ Acesse com `import.meta.env.VITE_API_URL`
- ⚠️ Variáveis sem `VITE_` não estarão disponíveis no cliente

#### Passo 4: Inicie o Servidor de Desenvolvimento

```bash
# Inicia o Vite dev server
npm run dev
```

**Saída esperada:**
```
  VITE v7.2.2  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### Passo 5: Acesse o Sistema

Abra o navegador em: **http://localhost:5173**

Você verá:
- Dashboard com cards de estatísticas
- Menu lateral com todas as funcionalidades
- Navegação responsiva

#### Estrutura de Pastas Criada

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── Clientes/
│   │   │   └── Clientes.tsx
│   │   ├── Veiculos/
│   │   │   └── Veiculos.tsx
│   │   ├── Mecanicos/
│   │   │   └── Mecanicos.tsx
│   │   ├── Servicos/
│   │   │   └── Servicos.tsx
│   │   ├── Pecas/
│   │   │   └── Pecas.tsx
│   │   └── OrdemServico/
│   │       └── OrdemServico.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── clienteService.ts
│   │   ├── veiculoService.ts
│   │   ├── mecanicoService.ts
│   │   ├── servicoService.ts
│   │   ├── pecaService.ts
│   │   ├── ordemServicoService.ts
│   │   └── dashboardService.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
├── node_modules/         # Criado pelo npm install
├── .env                  # Você deve criar este arquivo
├── .env.production
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

### 10.4 Configuração do Banco de Dados

#### Verificação Completa das Tabelas

Após executar as migrations, verifique se todas as tabelas foram criadas corretamente:

```sql
-- Conecte-se ao banco
psql -U postgres -d oficina_db

-- Liste todas as tabelas
\dt

-- Saída esperada:
--              List of relations
--  Schema |           Name            | Type  |  Owner
-- --------+---------------------------+-------+----------
--  public | clientes                  | table | postgres
--  public | mecanicos                 | table | postgres
--  public | ordem_servico             | table | postgres
--  public | ordem_servico_fotos       | table | postgres
--  public | ordem_servico_pecas       | table | postgres
--  public | ordem_servico_servicos    | table | postgres
--  public | pecas                     | table | postgres
--  public | pgmigrations              | table | postgres
--  public | servicos                  | table | postgres
--  public | veiculos                  | table | postgres
```

#### Inserir Dados Iniciais (Opcional)

Para facilitar os testes, você pode inserir dados iniciais:

```sql
-- Inserir mecânicos de exemplo
INSERT INTO mecanicos (nome, especialidade, telefone) VALUES
('João Silva', 'Motor', '11987654321'),
('Maria Santos', 'Suspensão', '11987654322'),
('Pedro Oliveira', 'Elétrica', '11987654323');

-- Inserir serviços padrão
INSERT INTO servicos (nome, descricao, preco_padrao, categoria) VALUES
('Troca de Óleo', 'Troca de óleo do motor', 150.00, 'Manutenção'),
('Alinhamento', 'Alinhamento e balanceamento', 120.00, 'Suspensão'),
('Revisão Completa', 'Revisão geral do veículo', 500.00, 'Manutenção'),
('Troca de Pastilhas', 'Substituição de pastilhas de freio', 200.00, 'Freios');

-- Inserir peças de exemplo
INSERT INTO pecas (nome, codigo, preco, quantidade_estoque, estoque_minimo, categoria) VALUES
('Óleo Motor 5W30', 'OL-001', 45.00, 50, 10, 'Lubrificantes'),
('Filtro de Óleo', 'FO-001', 25.00, 30, 5, 'Filtros'),
('Pastilha de Freio Dianteira', 'PF-001', 80.00, 20, 5, 'Freios'),
('Filtro de Ar', 'FA-001', 35.00, 25, 5, 'Filtros'),
('Vela de Ignição', 'VI-001', 20.00, 40, 10, 'Motor');

-- Verificar inserções
SELECT COUNT(*) FROM mecanicos;   -- Deve retornar 3
SELECT COUNT(*) FROM servicos;    -- Deve retornar 4
SELECT COUNT(*) FROM pecas;       -- Deve retornar 5
```

#### Comandos Úteis de Manutenção

```sql
-- Ver tamanho das tabelas
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver número de registros em cada tabela
SELECT
  'clientes' AS tabela, COUNT(*) AS registros FROM clientes
UNION ALL
SELECT 'veiculos', COUNT(*) FROM veiculos
UNION ALL
SELECT 'mecanicos', COUNT(*) FROM mecanicos
UNION ALL
SELECT 'servicos', COUNT(*) FROM servicos
UNION ALL
SELECT 'pecas', COUNT(*) FROM pecas
UNION ALL
SELECT 'ordem_servico', COUNT(*) FROM ordem_servico;

-- Limpar todas as tabelas (CUIDADO!)
TRUNCATE TABLE ordem_servico_fotos CASCADE;
TRUNCATE TABLE ordem_servico_pecas CASCADE;
TRUNCATE TABLE ordem_servico_servicos CASCADE;
TRUNCATE TABLE ordem_servico CASCADE;
TRUNCATE TABLE veiculos CASCADE;
TRUNCATE TABLE clientes CASCADE;
TRUNCATE TABLE mecanicos CASCADE;
TRUNCATE TABLE servicos CASCADE;
TRUNCATE TABLE pecas CASCADE;
```

#### Backup e Restore

**Fazer backup:**
```bash
# Backup completo do banco
pg_dump -U postgres -d oficina_db -F c -f backup_oficina_$(date +%Y%m%d).dump

# Backup somente dados (sem schema)
pg_dump -U postgres -d oficina_db --data-only -f backup_dados.sql

# Backup somente schema (sem dados)
pg_dump -U postgres -d oficina_db --schema-only -f backup_schema.sql
```

**Restaurar backup:**
```bash
# Restaurar backup completo
pg_restore -U postgres -d oficina_db -c backup_oficina_20251127.dump

# Restaurar backup SQL
psql -U postgres -d oficina_db -f backup_dados.sql
```

---

### 10.5 Executando em Desenvolvimento

#### Fluxo Completo de Desenvolvimento

**Passo 1: Inicie o PostgreSQL**
```bash
# Windows (se instalado como serviço)
# O PostgreSQL inicia automaticamente

# Linux/macOS
sudo service postgresql start
# OU
brew services start postgresql
```

**Passo 2: Inicie o Backend**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Aguarde a mensagem:
# "Servidor rodando na porta 3000"
```

**Passo 3: Inicie o Frontend**
```bash
# Terminal 2 - Frontend
cd frontend
npm run dev

# Aguarde a mensagem:
# "Local: http://localhost:5173/"
```

**Passo 4: Acesse o Sistema**
- Abra o navegador em: http://localhost:5173
- A aplicação frontend está rodando na porta 5173
- A API backend está rodando na porta 3000

#### Comandos de Desenvolvimento Úteis

**Backend:**
```bash
# Desenvolvimento com auto-reload
npm run dev

# Executar migrations
npm run migrate

# Criar nova migration
npm run migrate:create nome-da-migration

# Reverter última migration
npm run migrate:down

# Resetar todas migrations (CUIDADO!)
npm run migrate:reset

# Executar testes (quando implementados)
npm test

# Iniciar em produção
npm start
```

**Frontend:**
```bash
# Desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build

# Prévia do build de produção
npm run preview

# Lint do código
npm run lint
```

#### Testando a API com cURL

```bash
# Teste de health check
curl http://localhost:3000/api/mecanicos

# Criar um mecânico
curl -X POST http://localhost:3000/api/mecanicos \
  -H "Content-Type: application/json" \
  -d '{"nome":"João","especialidade":"Motor","telefone":"11999999999"}'

# Buscar mecânicos
curl http://localhost:3000/api/mecanicos

# Atualizar mecânico (ID 1)
curl -X PUT http://localhost:3000/api/mecanicos/1 \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","especialidade":"Motor e Suspensão"}'

# Deletar mecânico (ID 1)
curl -X DELETE http://localhost:3000/api/mecanicos/1
```

#### Testando com Postman/Insomnia

**Importe esta coleção de endpoints:**

```json
{
  "name": "Sistema Oficina - API",
  "baseUrl": "http://localhost:3000/api",
  "endpoints": [
    {
      "name": "Listar Mecânicos",
      "method": "GET",
      "url": "{{baseUrl}}/mecanicos"
    },
    {
      "name": "Criar Mecânico",
      "method": "POST",
      "url": "{{baseUrl}}/mecanicos",
      "body": {
        "nome": "João Silva",
        "especialidade": "Motor",
        "telefone": "11987654321"
      }
    },
    {
      "name": "Listar Clientes",
      "method": "GET",
      "url": "{{baseUrl}}/clientes"
    },
    {
      "name": "Criar Cliente",
      "method": "POST",
      "url": "{{baseUrl}}/clientes",
      "body": {
        "nome": "Maria Santos",
        "cpf_cnpj": "12345678901",
        "telefone": "11987654322",
        "email": "maria@email.com",
        "endereco": "Rua A, 123"
      }
    },
    {
      "name": "Dashboard Stats",
      "method": "GET",
      "url": "{{baseUrl}}/dashboard/stats"
    }
  ]
}
```

#### Monitoramento de Logs

**Backend:**
```bash
# Os logs aparecem automaticamente no terminal com nodemon
# Exemplos de logs:

# Requisição bem-sucedida:
GET /api/mecanicos 200 15ms

# Erro de validação:
POST /api/clientes 400 8ms - Erro: CPF/CNPJ já cadastrado

# Erro interno:
POST /api/ordem-servico 500 102ms - Erro ao criar ordem de serviço
```

**Frontend:**
- Abra o DevTools (F12)
- Aba "Console" mostra logs do React
- Aba "Network" mostra requisições HTTP
- Aba "Components" (React DevTools) mostra árvore de componentes

#### Problemas Comuns em Desenvolvimento

| Problema | Causa | Solução |
|----------|-------|---------|
| `EADDRINUSE: address already in use :::3000` | Porta 3000 já em uso | `npx kill-port 3000` ou altere PORT no .env |
| `Cannot find module` | Dependência não instalada | `npm install` |
| `Connection refused` | PostgreSQL não está rodando | Inicie o PostgreSQL |
| `CORS error` | Backend não permite origem | Verifique configuração CORS em server.js |
| `404 on API calls` | URL da API incorreta | Verifique VITE_API_URL no .env |
| `Migration failed` | Erro no schema | Verifique logs, corrija migration, `npm run migrate:down` |

---

### 10.6 Deploy no Render

#### Pré-requisitos

- Conta no GitHub (para hospedar o código)
- Conta no Render (gratuita) - https://render.com
- Repositório Git com o código do projeto

#### Passo 1: Preparar o Código para Deploy

**Estrutura do repositório:**
```
projeto-oficina/
├── backend/
│   ├── [todos os arquivos do backend]
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── [todos os arquivos do frontend]
│   ├── package.json
│   └── .env.example
└── README.md
```

**Importante:**
- ✅ Não commite arquivos `.env`
- ✅ Use `.env.example` como template
- ✅ Configure `.gitignore` corretamente

**.gitignore na raiz:**
```
# Dependencies
node_modules/
*/node_modules/

# Environment
.env
.env.local
.env.production

# Build
dist/
build/
*/dist/
*/build/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo
```

#### Passo 2: Criar Banco de Dados PostgreSQL no Render

1. Acesse https://dashboard.render.com
2. Clique em "New" → "PostgreSQL"
3. Preencha:
   - **Name:** `banco-sistema-oficina`
   - **Database:** `oficina_db`
   - **User:** `oficina_user` (ou deixe auto-gerar)
   - **Region:** Oregon (Free)
   - **PostgreSQL Version:** 15
   - **Plan:** Free
4. Clique em "Create Database"
5. Aguarde a criação (2-3 minutos)

**Anote estas informações (aba "Info"):**
- **Internal Database URL:** `postgres://usuario:senha@host/database`
- **External Database URL:** `postgres://usuario:senha@host/database`
- **PSQL Command:** Para conectar via terminal

**Configurações importantes:**
- Free tier: 90 dias de retenção, depois é deletado se não houver atividade
- 256MB RAM
- 1GB Storage
- Conexões SSL obrigatórias

#### Passo 3: Deploy do Backend

1. No Render Dashboard, clique em "New" → "Web Service"
2. Conecte seu repositório GitHub
3. Preencha as configurações:

**Configurações básicas:**
- **Name:** `sistema-oficina-backend`
- **Region:** Oregon (Free)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Environment:** Node
- **Build Command:** `npm install && npm run migrate`
- **Start Command:** `npm start`
- **Plan:** Free

**Variáveis de Ambiente (aba "Environment"):**
```
NODE_ENV=production
PORT=3000
PGHOST=[copie do banco de dados]
PGPORT=5432
PGUSER=[copie do banco de dados]
PGPASSWORD=[copie do banco de dados]
PGDATABASE=oficina_db
DATABASE_URL=[copie Internal Database URL]
```

**IMPORTANTE sobre DATABASE_URL:**
```bash
# Formato da URL interna do Render:
postgres://usuario:senha@dpg-xxxxx-a/oficina_db

# Adicione ?ssl=true ao final:
postgres://usuario:senha@dpg-xxxxx-a/oficina_db?ssl=true
```

4. Clique em "Create Web Service"
5. Aguarde o deploy (5-10 minutos no primeiro deploy)

**Logs esperados no deploy:**
```
==> Cloning from https://github.com/seu-usuario/sistema-oficina...
==> Checking out commit abc123...
==> Running build command 'npm install && npm run migrate'...
    npm install
    added 245 packages in 18s
    npm run migrate
    1763228689561_initial-schema-setup > migrated (147ms)
    ...
    All migrations completed successfully!
==> Build successful
==> Starting service with 'npm start'...
    Servidor rodando na porta 3000
```

**URL do backend:**
- https://sistema-oficina-backend.onrender.com
- Teste: https://sistema-oficina-backend.onrender.com/api/mecanicos

#### Passo 4: Deploy do Frontend

1. No Render Dashboard, clique em "New" → "Static Site"
2. Conecte o mesmo repositório GitHub
3. Preencha as configurações:

**Configurações básicas:**
- **Name:** `sistema-oficina-frontend`
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

**Variáveis de Ambiente:**
```
VITE_API_URL=https://sistema-oficina-backend.onrender.com/api
```

4. Clique em "Create Static Site"
5. Aguarde o build (3-5 minutos)

**Logs esperados:**
```
==> Cloning from https://github.com/seu-usuario/sistema-oficina...
==> Checking out commit abc123...
==> Running build command 'npm install && npm run build'...
    npm install
    added 1842 packages in 45s
    npm run build
    vite v7.2.2 building for production...
    ✓ 1247 modules transformed.
    dist/index.html                   0.45 kB
    dist/assets/index-abc123.js     187.32 kB │ gzip: 62.18 kB
    dist/assets/index-xyz789.css      8.45 kB │ gzip:  2.31 kB
    ✓ built in 12.45s
==> Build successful
==> Uploading build to Render...
==> Deploy successful!
```

**URL do frontend:**
- https://sistema-oficina-frontend.onrender.com

#### Passo 5: Configurar CORS no Backend

Atualize o arquivo `backend/server.js`:

```javascript
import cors from 'cors';

// Lista de origens permitidas
const allowedOrigins = [
  'http://localhost:5173',                                    // Dev local
  'https://sistema-oficina-frontend.onrender.com',           // Produção
  'https://sistema-oficina-frontend-xpgo.onrender.com'       // Se tiver outro domínio
];

app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

Faça commit e push:
```bash
git add backend/server.js
git commit -m "Atualiza configuração CORS para produção"
git push origin main
```

O Render fará redeploy automático.

#### Passo 6: Configurações Adicionais do Render

**Auto-Deploy:**
- Por padrão, o Render faz redeploy automático a cada push no branch `main`
- Desabilite em Settings → Build & Deploy → Auto-Deploy se não quiser isso

**Custom Domain (opcional):**
1. Settings → Custom Domain
2. Adicione seu domínio: `oficina.seudominio.com.br`
3. Configure DNS CNAME apontando para o Render
4. Aguarde propagação (1-24 horas)

**Health Checks:**
1. Settings → Health Check Path: `/api/mecanicos`
2. Render verificará se a API está respondendo

**Environment Groups (para múltiplos serviços):**
1. Dashboard → Environment Groups
2. Crie um grupo `oficina-prod`
3. Adicione variáveis compartilhadas
4. Referencie em cada serviço

#### Monitoramento em Produção

**Logs:**
- Acesse o serviço → aba "Logs"
- Filtros: Error, Warning, Info
- Download de logs

**Métricas:**
- Aba "Metrics"
- CPU usage
- Memory usage
- Bandwidth
- Response times

**Alertas:**
- Settings → Notifications
- Configure notificações por email
- Alertas de: Deploy failed, Service down, High CPU

#### Limitações do Plano Free

| Recurso | Limite Free | Solução Upgrade |
|---------|-------------|-----------------|
| **Sleep após inatividade** | 15 min sem requisições | Plano Starter ($7/mês) |
| **Build minutes** | 500 min/mês | Plano Starter |
| **Bandwidth** | 100 GB/mês | Plano Starter |
| **PostgreSQL** | 90 dias inatividade → delete | Manter ativo ou backup regular |
| **Cold start** | 30s-1min na primeira requisição | Plano Starter (sem sleep) |

**Workaround para manter ativo (Free):**
- Use serviço de ping: https://cron-job.org
- Configure ping a cada 10 minutos: https://sistema-oficina-backend.onrender.com/api/mecanicos
- Evita sleep do serviço

#### Troubleshooting de Deploy

**Build falhou:**
```
Error: Cannot find module 'express'
```
Solução: Verifique se `package.json` tem todas as dependências em `dependencies` (não em `devDependencies`)

**Migrations falharam:**
```
Error: Connection terminated unexpectedly
```
Solução: Adicione `?ssl=true` na `DATABASE_URL`

**CORS error no frontend:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```
Solução: Adicione a URL do frontend no array `allowedOrigins` do backend

**Frontend mostra página em branco:**
- Verifique Console (F12) → erros de carregamento
- Verifique se `VITE_API_URL` está correto
- Verifique se o build gerou arquivos em `dist/`

---

## 11. COMO ADICIONAR NOVAS FUNCIONALIDADES

### 11.1 Fluxo Completo: Adicionar um Novo Cadastro CRUD

Vamos criar um cadastro completo de **Fornecedores** como exemplo prático.

#### Passo 1: Criar a Migration

```bash
cd backend
npm run migrate:create adicionar-tabela-fornecedores
```

Edite o arquivo criado em `backend/migrations/`:

```javascript
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('fornecedores', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    nome: {
      type: 'varchar(255)',
      notNull: true,
    },
    cnpj: {
      type: 'varchar(18)',
      notNull: true,
      unique: true,
    },
    telefone: {
      type: 'varchar(20)',
      notNull: true,
    },
    email: {
      type: 'varchar(255)',
    },
    endereco: {
      type: 'text',
    },
    especialidade: {
      type: 'varchar(100)',
      notNull: true,
    },
    ativo: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Índices para performance
  pgm.createIndex('fornecedores', 'cnpj');
  pgm.createIndex('fornecedores', 'nome');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('fornecedores');
};
```

Execute a migration:
```bash
npm run migrate
```

#### Passo 2: Criar o Controller

Crie `backend/controllers/fornecedorController.js`:

```javascript
import db from '../config/db.js';

// Listar todos os fornecedores
export const listarFornecedores = async (req, res) => {
  try {
    const fornecedores = await db('fornecedores')
      .select('*')
      .orderBy('nome', 'asc');

    res.json(fornecedores);
  } catch (erro) {
    console.error('Erro ao listar fornecedores:', erro);
    res.status(500).json({ erro: 'Erro ao listar fornecedores' });
  }
};

// Buscar fornecedor por ID
export const buscarFornecedorPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const fornecedor = await db('fornecedores')
      .where({ id })
      .first();

    if (!fornecedor) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    res.json(fornecedor);
  } catch (erro) {
    console.error('Erro ao buscar fornecedor:', erro);
    res.status(500).json({ erro: 'Erro ao buscar fornecedor' });
  }
};

// Criar novo fornecedor
export const criarFornecedor = async (req, res) => {
  try {
    const { nome, cnpj, telefone, email, endereco, especialidade } = req.body;

    // Validações
    if (!nome || !cnpj || !telefone || !especialidade) {
      return res.status(400).json({
        erro: 'Nome, CNPJ, telefone e especialidade são obrigatórios'
      });
    }

    // Verifica CNPJ duplicado
    const cnpjExiste = await db('fornecedores')
      .where({ cnpj })
      .first();

    if (cnpjExiste) {
      return res.status(400).json({ erro: 'CNPJ já cadastrado' });
    }

    const [novoFornecedor] = await db('fornecedores')
      .insert({
        nome,
        cnpj,
        telefone,
        email,
        endereco,
        especialidade,
      })
      .returning('*');

    res.status(201).json(novoFornecedor);
  } catch (erro) {
    console.error('Erro ao criar fornecedor:', erro);
    res.status(500).json({ erro: 'Erro ao criar fornecedor' });
  }
};

// Atualizar fornecedor
export const atualizarFornecedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, telefone, email, endereco, especialidade, ativo } = req.body;

    // Verifica se fornecedor existe
    const fornecedorExiste = await db('fornecedores')
      .where({ id })
      .first();

    if (!fornecedorExiste) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    // Se está alterando CNPJ, verifica duplicidade
    if (cnpj && cnpj !== fornecedorExiste.cnpj) {
      const cnpjEmUso = await db('fornecedores')
        .where({ cnpj })
        .whereNot({ id })
        .first();

      if (cnpjEmUso) {
        return res.status(400).json({ erro: 'CNPJ já cadastrado para outro fornecedor' });
      }
    }

    const [fornecedorAtualizado] = await db('fornecedores')
      .where({ id })
      .update({
        nome,
        cnpj,
        telefone,
        email,
        endereco,
        especialidade,
        ativo,
        updated_at: db.fn.now(),
      })
      .returning('*');

    res.json(fornecedorAtualizado);
  } catch (erro) {
    console.error('Erro ao atualizar fornecedor:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar fornecedor' });
  }
};

// Deletar fornecedor
export const deletarFornecedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se fornecedor existe
    const fornecedor = await db('fornecedores')
      .where({ id })
      .first();

    if (!fornecedor) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    // Aqui você pode adicionar verificações de dependências
    // Exemplo: verificar se há peças vinculadas a este fornecedor

    await db('fornecedores')
      .where({ id })
      .delete();

    res.json({ mensagem: 'Fornecedor deletado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar fornecedor:', erro);
    res.status(500).json({ erro: 'Erro ao deletar fornecedor' });
  }
};
```

#### Passo 3: Criar as Rotas

Crie `backend/routes/fornecedorRoutes.js`:

```javascript
import express from 'express';
import {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor,
  deletarFornecedor,
} from '../controllers/fornecedorController.js';

const router = express.Router();

router.get('/', listarFornecedores);
router.get('/:id', buscarFornecedorPorId);
router.post('/', criarFornecedor);
router.put('/:id', atualizarFornecedor);
router.delete('/:id', deletarFornecedor);

export default router;
```

#### Passo 4: Registrar as Rotas no Server

Edite `backend/server.js`:

```javascript
// Importe as rotas
import fornecedorRoutes from './routes/fornecedorRoutes.js';

// Registre as rotas
app.use('/api/fornecedores', fornecedorRoutes);
```

#### Passo 5: Criar o Service no Frontend

Crie `frontend/src/services/fornecedorService.ts`:

```typescript
import api from './api';

export interface Fornecedor {
  id?: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email?: string;
  endereco?: string;
  especialidade: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

const fornecedorService = {
  // Listar todos os fornecedores
  listar: async (): Promise<Fornecedor[]> => {
    const response = await api.get('/fornecedores');
    return response.data;
  },

  // Buscar fornecedor por ID
  buscarPorId: async (id: number): Promise<Fornecedor> => {
    const response = await api.get(`/fornecedores/${id}`);
    return response.data;
  },

  // Criar novo fornecedor
  criar: async (fornecedor: Fornecedor): Promise<Fornecedor> => {
    const response = await api.post('/fornecedores', fornecedor);
    return response.data;
  },

  // Atualizar fornecedor
  atualizar: async (id: number, fornecedor: Fornecedor): Promise<Fornecedor> => {
    const response = await api.put(`/fornecedores/${id}`, fornecedor);
    return response.data;
  },

  // Deletar fornecedor
  deletar: async (id: number): Promise<void> => {
    await api.delete(`/fornecedores/${id}`);
  },
};

export default fornecedorService;
```

#### Passo 6: Criar a Página Frontend

Crie `frontend/src/pages/Fornecedores/Fornecedores.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import fornecedorService, { Fornecedor } from '../../services/fornecedorService';

const Fornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [fornecedorAtual, setFornecedorAtual] = useState<Fornecedor>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    especialidade: '',
    ativo: true,
  });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      const dados = await fornecedorService.listar();
      setFornecedores(dados);
    } catch (erro) {
      setErro('Erro ao carregar fornecedores');
    }
  };

  const abrirDialogNovo = () => {
    setFornecedorAtual({
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      especialidade: '',
      ativo: true,
    });
    setModoEdicao(false);
    setDialogAberto(true);
  };

  const abrirDialogEdicao = (fornecedor: Fornecedor) => {
    setFornecedorAtual(fornecedor);
    setModoEdicao(true);
    setDialogAberto(true);
  };

  const fecharDialog = () => {
    setDialogAberto(false);
    setErro('');
  };

  const handleSalvar = async () => {
    try {
      if (modoEdicao && fornecedorAtual.id) {
        await fornecedorService.atualizar(fornecedorAtual.id, fornecedorAtual);
        setSucesso('Fornecedor atualizado com sucesso!');
      } else {
        await fornecedorService.criar(fornecedorAtual);
        setSucesso('Fornecedor criado com sucesso!');
      }

      fecharDialog();
      carregarFornecedores();
      setTimeout(() => setSucesso(''), 3000);
    } catch (erro: any) {
      setErro(erro.response?.data?.erro || 'Erro ao salvar fornecedor');
    }
  };

  const handleDeletar = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este fornecedor?')) {
      try {
        await fornecedorService.deletar(id);
        setSucesso('Fornecedor deletado com sucesso!');
        carregarFornecedores();
        setTimeout(() => setSucesso(''), 3000);
      } catch (erro: any) {
        setErro(erro.response?.data?.erro || 'Erro ao deletar fornecedor');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Fornecedores</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirDialogNovo}
        >
          Novo Fornecedor
        </Button>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {sucesso && <Alert severity="success" sx={{ mb: 2 }}>{sucesso}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Especialidade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fornecedores.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell>{fornecedor.nome}</TableCell>
                <TableCell>{fornecedor.cnpj}</TableCell>
                <TableCell>{fornecedor.telefone}</TableCell>
                <TableCell>{fornecedor.especialidade}</TableCell>
                <TableCell>{fornecedor.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => abrirDialogEdicao(fornecedor)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeletar(fornecedor.id!)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modoEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome"
              value={fornecedorAtual.nome}
              onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, nome: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="CNPJ"
              value={fornecedorAtual.cnpj}
              onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, cnpj: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Telefone"
              value={fornecedorAtual.telefone}
              onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, telefone: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={fornecedorAtual.email}
              onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Endereço"
              value={fornecedorAtual.endereco}
              onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, endereco: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Especialidade"
              value={fornecedorAtual.especialidade}
              onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, especialidade: e.target.value })}
              required
              fullWidth
            />
            {modoEdicao && (
              <FormControlLabel
                control={
                  <Switch
                    checked={fornecedorAtual.ativo}
                    onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, ativo: e.target.checked })}
                  />
                }
                label="Ativo"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialog}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Fornecedores;
```

#### Passo 7: Adicionar Rota no App.tsx

Edite `frontend/src/App.tsx`:

```typescript
import Fornecedores from './pages/Fornecedores/Fornecedores';

// Dentro do BrowserRouter:
<Route path="/fornecedores" element={<Fornecedores />} />
```

#### Passo 8: Adicionar ao Menu do Layout

Edite `frontend/src/components/Layout/Layout.tsx`:

```typescript
import { Business as BusinessIcon } from '@mui/icons-material';

// Adicione ao array de itens do menu:
{
  text: 'Fornecedores',
  icon: <BusinessIcon />,
  path: '/fornecedores',
},
```

#### Passo 9: Testar a Funcionalidade

1. Reinicie o backend: `npm run dev`
2. Reinicie o frontend: `npm run dev`
3. Acesse http://localhost:5173/fornecedores
4. Teste:
   - Criar novo fornecedor
   - Editar fornecedor
   - Deletar fornecedor
   - Validações de CNPJ duplicado

---

### 11.2 Adicionar Nova Migration

#### Cenário: Adicionar campo "observacoes" na tabela fornecedores

**Passo 1: Criar a migration**
```bash
cd backend
npm run migrate:create adicionar-observacoes-fornecedores
```

**Passo 2: Editar a migration**

```javascript
exports.up = (pgm) => {
  pgm.addColumn('fornecedores', {
    observacoes: {
      type: 'text',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('fornecedores', 'observacoes');
};
```

**Passo 3: Executar**
```bash
npm run migrate
```

**Passo 4: Atualizar TypeScript interface**

```typescript
export interface Fornecedor {
  // ... campos existentes
  observacoes?: string;
}
```

**Passo 5: Atualizar formulário**

```typescript
<TextField
  label="Observações"
  value={fornecedorAtual.observacoes}
  onChange={(e) => setFornecedorAtual({ ...fornecedorAtual, observacoes: e.target.value })}
  multiline
  rows={3}
  fullWidth
/>
```

#### Tipos Comuns de Migrations

**Adicionar coluna:**
```javascript
pgm.addColumn('tabela', {
  nome_coluna: {
    type: 'varchar(100)',
    notNull: false,
    default: 'valor_padrao',
  },
});
```

**Remover coluna:**
```javascript
pgm.dropColumn('tabela', 'nome_coluna');
```

**Renomear coluna:**
```javascript
pgm.renameColumn('tabela', 'nome_antigo', 'nome_novo');
```

**Alterar tipo de coluna:**
```javascript
pgm.alterColumn('tabela', 'nome_coluna', {
  type: 'text',
  using: 'nome_coluna::text', // Conversão de tipo
});
```

**Adicionar constraint:**
```javascript
pgm.addConstraint('tabela', 'nome_constraint', {
  check: 'preco > 0',
});
```

**Adicionar índice:**
```javascript
pgm.createIndex('tabela', 'coluna');
// OU índice composto:
pgm.createIndex('tabela', ['coluna1', 'coluna2']);
```

**Adicionar foreign key:**
```javascript
pgm.addConstraint('tabela_filha', 'fk_pai', {
  foreignKeys: {
    columns: 'pai_id',
    references: 'tabela_pai(id)',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
});
```

---

### 11.3 Adicionar Novo Endpoint na API

#### Cenário: Endpoint para buscar fornecedores ativos

**Passo 1: Adicionar função no controller**

`backend/controllers/fornecedorController.js`:

```javascript
// Buscar apenas fornecedores ativos
export const listarFornecedoresAtivos = async (req, res) => {
  try {
    const fornecedores = await db('fornecedores')
      .where({ ativo: true })
      .select('*')
      .orderBy('nome', 'asc');

    res.json(fornecedores);
  } catch (erro) {
    console.error('Erro ao listar fornecedores ativos:', erro);
    res.status(500).json({ erro: 'Erro ao listar fornecedores ativos' });
  }
};
```

**Passo 2: Adicionar rota**

`backend/routes/fornecedorRoutes.js`:

```javascript
import { listarFornecedoresAtivos } from '../controllers/fornecedorController.js';

// IMPORTANTE: rotas mais específicas devem vir ANTES das genéricas
router.get('/ativos', listarFornecedoresAtivos);  // Antes de '/:id'
router.get('/:id', buscarFornecedorPorId);
```

**Passo 3: Adicionar no service frontend**

`frontend/src/services/fornecedorService.ts`:

```typescript
const fornecedorService = {
  // ... métodos existentes

  listarAtivos: async (): Promise<Fornecedor[]> => {
    const response = await api.get('/fornecedores/ativos');
    return response.data;
  },
};
```

**Passo 4: Usar no componente**

```typescript
const [fornecedoresAtivos, setFornecedoresAtivos] = useState<Fornecedor[]>([]);

useEffect(() => {
  const carregarAtivos = async () => {
    const dados = await fornecedorService.listarAtivos();
    setFornecedoresAtivos(dados);
  };
  carregarAtivos();
}, []);
```

#### Exemplo: Endpoint com Query Parameters

**Controller:**
```javascript
export const buscarFornecedores = async (req, res) => {
  try {
    const { especialidade, ativo, busca } = req.query;

    let query = db('fornecedores');

    if (especialidade) {
      query = query.where({ especialidade });
    }

    if (ativo !== undefined) {
      query = query.where({ ativo: ativo === 'true' });
    }

    if (busca) {
      query = query.where((builder) => {
        builder
          .where('nome', 'ilike', `%${busca}%`)
          .orWhere('cnpj', 'like', `%${busca}%`);
      });
    }

    const fornecedores = await query.select('*').orderBy('nome');
    res.json(fornecedores);
  } catch (erro) {
    console.error('Erro ao buscar fornecedores:', erro);
    res.status(500).json({ erro: 'Erro ao buscar fornecedores' });
  }
};
```

**Service:**
```typescript
buscar: async (filtros: {
  especialidade?: string;
  ativo?: boolean;
  busca?: string;
}): Promise<Fornecedor[]> => {
  const params = new URLSearchParams();

  if (filtros.especialidade) params.append('especialidade', filtros.especialidade);
  if (filtros.ativo !== undefined) params.append('ativo', String(filtros.ativo));
  if (filtros.busca) params.append('busca', filtros.busca);

  const response = await api.get(`/fornecedores?${params.toString()}`);
  return response.data;
},
```

---

### 11.4 Adicionar Nova Página no Frontend

#### Cenário: Página de Relatórios

**Passo 1: Criar estrutura de diretório**
```
frontend/src/pages/Relatorios/
├── Relatorios.tsx
└── components/
    ├── RelatorioVendas.tsx
    ├── RelatorioEstoque.tsx
    └── RelatorioFinanceiro.tsx
```

**Passo 2: Criar página principal**

`frontend/src/pages/Relatorios/Relatorios.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import RelatorioVendas from './components/RelatorioVendas';
import RelatorioEstoque from './components/RelatorioEstoque';
import RelatorioFinanceiro from './components/RelatorioFinanceiro';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Relatorios: React.FC = () => {
  const [tabAtiva, setTabAtiva] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Relatórios
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabAtiva} onChange={(_, novaTab) => setTabAtiva(novaTab)}>
          <Tab label="Vendas" />
          <Tab label="Estoque" />
          <Tab label="Financeiro" />
        </Tabs>
      </Box>

      <TabPanel value={tabAtiva} index={0}>
        <RelatorioVendas />
      </TabPanel>
      <TabPanel value={tabAtiva} index={1}>
        <RelatorioEstoque />
      </TabPanel>
      <TabPanel value={tabAtiva} index={2}>
        <RelatorioFinanceiro />
      </TabPanel>
    </Box>
  );
};

export default Relatorios;
```

**Passo 3: Criar componente filho**

`frontend/src/pages/Relatorios/components/RelatorioVendas.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';

const RelatorioVendas: React.FC = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const gerarRelatorio = async () => {
    // Lógica para gerar relatório
    console.log('Gerando relatório de', dataInicio, 'até', dataFim);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Data Início"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Data Fim"
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={gerarRelatorio}
        >
          Gerar PDF
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Período</TableCell>
              <TableCell>Vendas</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Dados do relatório */}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RelatorioVendas;
```

**Passo 4: Adicionar rota**

`frontend/src/App.tsx`:

```typescript
import Relatorios from './pages/Relatorios/Relatorios';

<Route path="/relatorios" element={<Relatorios />} />
```

**Passo 5: Adicionar ao menu**

`frontend/src/components/Layout/Layout.tsx`:

```typescript
import { Assessment as AssessmentIcon } from '@mui/icons-material';

{
  text: 'Relatórios',
  icon: <AssessmentIcon />,
  path: '/relatorios',
},
```

---

### 11.5 Adicionar Nova Rota no Menu

#### Opção 1: Item de Menu Simples

`frontend/src/components/Layout/Layout.tsx`:

```typescript
const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    text: 'Fornecedores',
    icon: <BusinessIcon />,
    path: '/fornecedores',
  },
  // ... outros itens
];
```

#### Opção 2: Menu com Submenu (Dropdown)

```typescript
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

const [cadastrosAberto, setCadastrosAberto] = useState(false);

// No JSX:
<ListItem button onClick={() => setCadastrosAberto(!cadastrosAberto)}>
  <ListItemIcon>
    <FolderIcon />
  </ListItemIcon>
  <ListItemText primary="Cadastros" />
  {cadastrosAberto ? <ExpandLess /> : <ExpandMore />}
</ListItem>
<Collapse in={cadastrosAberto} timeout="auto" unmountOnExit>
  <List component="div" disablePadding>
    <ListItem button sx={{ pl: 4 }} onClick={() => navigate('/clientes')}>
      <ListItemIcon>
        <PeopleIcon />
      </ListItemIcon>
      <ListItemText primary="Clientes" />
    </ListItem>
    <ListItem button sx={{ pl: 4 }} onClick={() => navigate('/fornecedores')}>
      <ListItemIcon>
        <BusinessIcon />
      </ListItemIcon>
      <ListItemText primary="Fornecedores" />
    </ListItem>
  </List>
</Collapse>
```

---

### 11.6 Checklist de Qualidade

Antes de considerar uma funcionalidade completa, verifique:

#### Backend
- ✅ Migration criada e testada (up e down)
- ✅ Controller com todas operações CRUD
- ✅ Validações de dados obrigatórios
- ✅ Tratamento de erros com try/catch
- ✅ Verificação de duplicidade (quando aplicável)
- ✅ Verificação de dependências antes de deletar
- ✅ Rotas registradas no server.js
- ✅ Mensagens de erro claras e específicas
- ✅ Logs de erro no console
- ✅ Status HTTP corretos (200, 201, 400, 404, 500)

#### Frontend
- ✅ Interface TypeScript criada
- ✅ Service com todos os métodos da API
- ✅ Componente com CRUD completo
- ✅ Validações de formulário
- ✅ Feedback visual (loading, erros, sucesso)
- ✅ Confirmação antes de deletar
- ✅ Tratamento de erros com try/catch
- ✅ Design responsivo
- ✅ Acessibilidade (labels, alt text)
- ✅ Rota adicionada no App.tsx
- ✅ Item adicionado no menu do Layout

#### Testes
- ✅ Criar registro via API (Postman/curl)
- ✅ Criar registro via interface
- ✅ Editar registro existente
- ✅ Tentar criar duplicado (deve dar erro)
- ✅ Deletar registro sem dependências
- ✅ Tentar deletar com dependências (deve dar erro)
- ✅ Validar campos obrigatórios
- ✅ Testar em diferentes navegadores
- ✅ Testar responsividade (mobile, tablet, desktop)

#### Documentação
- ✅ Comentários em código complexo
- ✅ README atualizado (se necessário)
- ✅ Migration documentada
- ✅ Endpoint documentado (Postman collection)

#### Git
- ✅ Commit com mensagem descritiva
- ✅ Não comitar .env
- ✅ Não comitar node_modules
- ✅ Testar após pull/clone em outra máquina

---

## 12. TROUBLESHOOTING

### 12.1 Problemas Comuns do Backend

#### Erro: "Cannot find module"

**Sintoma:**
```
Error: Cannot find module 'express'
    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:636:15)
```

**Causas Possíveis:**
- Dependências não instaladas
- node_modules corrompido
- package.json inconsistente

**Soluções:**
```bash
# 1. Instalar dependências
npm install

# 2. Se o problema persistir, limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 3. Verificar se a dependência está no package.json
cat package.json | grep "express"
```

---

#### Erro: "EADDRINUSE: address already in use"

**Sintoma:**
```
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (net.js:1318:16)
```

**Causa:**
- Porta 3000 já está sendo usada por outro processo

**Soluções:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :3000
kill -9 <PID>

# OU use kill-port (funciona em qualquer SO)
npx kill-port 3000

# OU altere a porta no .env
PORT=3001
```

---

#### Erro: "Connection refused" (PostgreSQL)

**Sintoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1148:16)
```

**Causas:**
- PostgreSQL não está rodando
- Configurações de conexão incorretas
- Firewall bloqueando conexão

**Soluções:**
```bash
# 1. Verificar se PostgreSQL está rodando
# Windows
sc query postgresql-x64-15

# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# 2. Iniciar PostgreSQL
# Windows (Services.msc)
# Ou: net start postgresql-x64-15

# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql

# 3. Verificar credenciais no .env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=sua_senha_correta
PGDATABASE=oficina_db

# 4. Testar conexão manual
psql -U postgres -d oficina_db
```

---

#### Erro: "Migration failed"

**Sintoma:**
```
1763462311228_adicionar-not-null-clientes > migrating
ERROR: column "nome" of relation "clientes" does not exist
```

**Causas:**
- Migration mal escrita
- Ordem de execução incorreta
- Banco de dados em estado inconsistente

**Soluções:**
```bash
# 1. Verificar qual migration falhou
npm run migrate

# 2. Reverter última migration
npm run migrate:down

# 3. Corrigir o arquivo de migration

# 4. Executar novamente
npm run migrate

# 5. Se precisar resetar TUDO (CUIDADO!)
npm run migrate:down -- --count 999
npm run migrate

# 6. Verificar estado das migrations
psql -U postgres -d oficina_db
SELECT * FROM pgmigrations ORDER BY run_on DESC;
```

---

#### Erro: "CORS policy blocked"

**Sintoma:**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/clientes'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Causa:**
- Frontend não está na lista de origens permitidas
- CORS não configurado corretamente

**Solução:**

Edite `backend/server.js`:

```javascript
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sistema-oficina-frontend.onrender.com',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy does not allow access from this origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
```

---

#### Erro: "Transaction deadlock detected"

**Sintoma:**
```
Error: deadlock detected
DETAIL: Process 1234 waits for ShareLock on transaction 5678
```

**Causa:**
- Duas transações tentando modificar os mesmos recursos simultaneamente
- Operações complexas sem controle adequado de transação

**Soluções:**
```javascript
// 1. Use transações com timeout
const resultado = await db.transaction(async (trx) => {
  // Defina timeout
  await trx.raw('SET LOCAL statement_timeout = 5000'); // 5 segundos

  // Suas operações...
}, {
  isolationLevel: 'read committed'
});

// 2. Ordem consistente de locks
// SEMPRE bloqueie recursos na mesma ordem
// Exemplo: sempre busque cliente ANTES de veículo

// 3. Use FOR UPDATE com NOWAIT
const cliente = await db('clientes')
  .where({ id })
  .forUpdate()
  .noWait() // Falha imediatamente se bloqueado
  .first();
```

---

#### Erro: "Duplicate key value violates unique constraint"

**Sintoma:**
```
Error: duplicate key value violates unique constraint "clientes_cpf_cnpj_unique"
Key (cpf_cnpj)=(12345678901) already exists
```

**Causa:**
- Tentativa de inserir CPF/CNPJ duplicado
- Validação de duplicidade não funcionou

**Solução:**
```javascript
// Sempre verifique ANTES de inserir
export const criarCliente = async (req, res) => {
  try {
    const { cpf_cnpj } = req.body;

    // Verificação de duplicidade
    const existe = await db('clientes')
      .where({ cpf_cnpj })
      .first();

    if (existe) {
      return res.status(400).json({
        erro: 'CPF/CNPJ já cadastrado',
        campo: 'cpf_cnpj'
      });
    }

    // Prosseguir com inserção...
  } catch (erro) {
    // Tratamento de erro...
  }
};
```

---

#### Erro: "SSL connection required"

**Sintoma:**
```
Error: The server does not support SSL connections
```

**Causa:**
- Tentando conectar com SSL em ambiente local
- Configuração SSL incorreta para produção

**Solução:**

`backend/knexfile.js`:

```javascript
production: {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Para Render/Heroku
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: './migrations'
  }
}
```

---

### 12.2 Problemas Comuns do Frontend

#### Erro: "Cannot read property of undefined"

**Sintoma:**
```
TypeError: Cannot read property 'nome' of undefined
    at Clientes.tsx:45:32
```

**Causas:**
- Dados ainda não carregados (async)
- Propriedade não existe no objeto
- Estado inicial incorreto

**Soluções:**
```typescript
// 1. Use optional chaining
<Typography>{cliente?.nome}</Typography>

// 2. Verifique se existe antes de usar
{cliente && <Typography>{cliente.nome}</Typography>}

// 3. Use loading state
const [loading, setLoading] = useState(true);
const [cliente, setCliente] = useState<Cliente | null>(null);

useEffect(() => {
  const carregar = async () => {
    setLoading(true);
    const dados = await clienteService.buscarPorId(id);
    setCliente(dados);
    setLoading(false);
  };
  carregar();
}, [id]);

if (loading) return <CircularProgress />;
if (!cliente) return <Typography>Cliente não encontrado</Typography>;

return <Typography>{cliente.nome}</Typography>;
```

---

#### Erro: "Infinite loop in useEffect"

**Sintoma:**
- Página trava
- Console mostra milhares de requisições
- Navegador fica lento

**Causa:**
- Array de dependências do useEffect incorreto
- Atualização de estado dentro do useEffect sem condição

**Problema:**
```typescript
// ERRADO - Loop infinito!
useEffect(() => {
  const carregar = async () => {
    const dados = await clienteService.listar();
    setClientes(dados);
  };
  carregar();
  // Faltou array de dependências!
});
```

**Solução:**
```typescript
// CORRETO
useEffect(() => {
  const carregar = async () => {
    const dados = await clienteService.listar();
    setClientes(dados);
  };
  carregar();
}, []); // Array vazio = executa apenas uma vez

// CORRETO com dependência
useEffect(() => {
  const carregar = async () => {
    const dados = await veiculoService.buscarPorCliente(clienteId);
    setVeiculos(dados);
  };
  if (clienteId) {
    carregar();
  }
}, [clienteId]); // Executa quando clienteId muda
```

---

#### Erro: "Network Error" ou "404 Not Found"

**Sintoma:**
```
AxiosError: Network Error
    at XMLHttpRequest.handleError (axios.js:1234)
```

**Causas:**
- Backend não está rodando
- URL da API incorreta
- Endpoint não existe

**Soluções:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:3000/api/clientes

# 2. Verificar variável de ambiente
# frontend/.env
VITE_API_URL=http://localhost:3000/api

# 3. Verificar se está usando a variável corretamente
# frontend/src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Deve ser VITE_API_URL
});

# 4. No service, NÃO repita /api
// ERRADO
const response = await api.get('/api/clientes');

// CORRETO
const response = await api.get('/clientes');

# 5. Verificar CORS (ver seção 12.1)

# 6. Abrir DevTools → Network e ver requisição exata
```

---

#### Erro: "Material-UI: The value provided to Autocomplete is invalid"

**Sintoma:**
```
Warning: Material-UI: The value provided to Autocomplete is invalid.
None of the options match with `undefined`.
```

**Causa:**
- Valor inicial do Autocomplete incompatível com opções
- Estrutura de dados incorreta

**Solução:**
```typescript
// Estado inicial correto
const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
const [clientes, setClientes] = useState<Cliente[]>([]);

// Autocomplete correto
<Autocomplete
  value={clienteSelecionado}
  onChange={(_, novoValor) => setClienteSelecionado(novoValor)}
  options={clientes}
  getOptionLabel={(option) => option.nome}
  isOptionEqualToValue={(option, value) => option.id === value.id}
  renderInput={(params) => (
    <TextField {...params} label="Cliente" />
  )}
/>
```

---

#### Erro: Build do Vite falha

**Sintoma:**
```
✘ [ERROR] Could not resolve "@mui/material"
✘ [ERROR] TypeScript error in Clientes.tsx
    Type 'string' is not assignable to type 'number'
```

**Causas:**
- Dependências não instaladas
- Erros de TypeScript
- Importações incorretas

**Soluções:**
```bash
# 1. Verificar se todas as dependências estão instaladas
npm install

# 2. Verificar erros de TypeScript
npm run build

# 3. Consertar erros de tipo
// ERRADO
const [id, setId] = useState<number>('123');

// CORRETO
const [id, setId] = useState<number>(123);

# 4. Verificar importações
// ERRADO
import { Button } from '@mui/material/Button';

// CORRETO
import { Button } from '@mui/material';

# 5. Limpar cache e rebuildar
rm -rf node_modules .vite dist
npm install
npm run build
```

---

#### Erro: "Hydration failed" (React 19)

**Sintoma:**
```
Warning: Hydration failed because the server rendered HTML didn't match the client
```

**Causa:**
- Renderização diferente no servidor vs cliente
- useEffect modificando DOM antes do hydrate

**Solução:**
```typescript
// Use useLayoutEffect para código que modifica DOM
import { useLayoutEffect } from 'react';

// Ou use suppressHydrationWarning temporariamente
<div suppressHydrationWarning>
  {/* conteúdo dinâmico */}
</div>
```

---

### 12.3 Problemas de Banco de Dados

#### Erro: "Too many connections"

**Sintoma:**
```
Error: sorry, too many clients already
```

**Causa:**
- Pool de conexões esgotado
- Conexões não sendo liberadas

**Solução:**

`backend/knexfile.js`:

```javascript
pool: {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  createTimeoutMillis: 3000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
}
```

```javascript
// SEMPRE use transações corretamente
try {
  const resultado = await db.transaction(async (trx) => {
    // operações...
    return resultado;
  });
} catch (erro) {
  // Transação automaticamente revertida
  // Conexão automaticamente liberada
}

// NUNCA deixe transação aberta
// ERRADO:
const trx = await db.transaction();
await trx('clientes').insert(...);
// Esqueceu de fazer commit/rollback!

// CORRETO:
await db.transaction(async (trx) => {
  await trx('clientes').insert(...);
  // commit automático no final
});
```

---

#### Erro: "Permission denied for relation"

**Sintoma:**
```
Error: permission denied for relation clientes
```

**Causa:**
- Usuário do banco sem permissões adequadas

**Solução:**
```sql
-- Conectar como superusuário
psql -U postgres

-- Dar permissões ao usuário
GRANT ALL PRIVILEGES ON DATABASE oficina_db TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;
```

---

#### Problema: Banco de dados muito lento

**Sintomas:**
- Queries demoram muito
- Timeout em requisições
- CPU alta no PostgreSQL

**Diagnóstico:**
```sql
-- Ver queries lentas em execução
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Matar query problemática (se necessário)
SELECT pg_terminate_backend(pid);
```

**Soluções:**
```sql
-- 1. Adicionar índices
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_os_data ON ordem_servico(data_abertura);

-- 2. Analisar query plans
EXPLAIN ANALYZE SELECT * FROM clientes WHERE cpf_cnpj = '12345678901';

-- 3. Vacuum e analyze
VACUUM ANALYZE;

-- 4. Reindexar tabela problemática
REINDEX TABLE clientes;
```

---

#### Problema: Dados inconsistentes

**Sintomas:**
- Totais não batem
- Estoque negativo
- Valores duplicados inesperados

**Diagnóstico:**
```sql
-- Verificar inconsistências de estoque
SELECT p.id, p.nome, p.quantidade_estoque,
       COALESCE(SUM(osp.quantidade), 0) AS total_usado
FROM pecas p
LEFT JOIN ordem_servico_pecas osp ON p.id = osp.peca_id
GROUP BY p.id, p.nome, p.quantidade_estoque
HAVING p.quantidade_estoque < 0 OR COALESCE(SUM(osp.quantidade), 0) > p.quantidade_estoque;

-- Verificar totais de OS
SELECT os.id, os.valor_total,
       (COALESCE(SUM(oss.valor), 0) + COALESCE(SUM(osp.valor_total), 0)) AS total_calculado
FROM ordem_servico os
LEFT JOIN ordem_servico_servicos oss ON os.id = oss.ordem_servico_id
LEFT JOIN ordem_servico_pecas osp ON os.id = osp.ordem_servico_id
GROUP BY os.id, os.valor_total
HAVING os.valor_total != (COALESCE(SUM(oss.valor), 0) + COALESCE(SUM(osp.valor_total), 0));
```

**Correção:**
```javascript
// Script de correção de totais
export const recalcularTotaisOS = async (req, res) => {
  try {
    const ordens = await db('ordem_servico').select('id');

    for (const ordem of ordens) {
      await db.transaction(async (trx) => {
        // Calcular total de serviços
        const totalServicos = await trx('ordem_servico_servicos')
          .where({ ordem_servico_id: ordem.id })
          .sum('valor as total')
          .first();

        // Calcular total de peças
        const totalPecas = await trx('ordem_servico_pecas')
          .where({ ordem_servico_id: ordem.id })
          .sum('valor_total as total')
          .first();

        const valorTotal =
          (totalServicos.total || 0) +
          (totalPecas.total || 0);

        // Atualizar valor total
        await trx('ordem_servico')
          .where({ id: ordem.id })
          .update({ valor_total: valorTotal });
      });
    }

    res.json({ mensagem: 'Totais recalculados com sucesso' });
  } catch (erro) {
    console.error('Erro ao recalcular totais:', erro);
    res.status(500).json({ erro: 'Erro ao recalcular totais' });
  }
};
```

---

### 12.4 Problemas de Deploy no Render

#### Build falha no Render

**Sintoma:**
```
==> Build failed
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Causas Comuns:**
- Dependências em devDependencies
- Scripts npm incorretos
- Variáveis de ambiente faltando

**Soluções:**
```json
// package.json - Mova dependências necessárias para dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "knex": "^3.1.0"
    // TODAS as dependências necessárias em produção
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^30.2.0"
    // Apenas dev tools
  }
}
```

```bash
# Build Command no Render:
npm install && npm run migrate

# Start Command:
npm start
```

---

#### Migrations não executam no Render

**Sintoma:**
```
Error: relation "clientes" does not exist
```

**Causa:**
- Migrations não rodaram no build
- Build command incorreto

**Solução:**

Render Dashboard → Seu serviço → Settings → Build & Deploy:

```
Build Command: npm install && npm run migrate
```

OU crie script de startup que roda migrations:

`backend/startup.js`:
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function startup() {
  try {
    console.log('Executando migrations...');
    await execPromise('npm run migrate');
    console.log('Migrations executadas com sucesso');

    console.log('Iniciando servidor...');
    await import('./server.js');
  } catch (erro) {
    console.error('Erro no startup:', erro);
    process.exit(1);
  }
}

startup();
```

```json
// package.json
{
  "scripts": {
    "start": "node startup.js"
  }
}
```

---

#### Conexão SSL com PostgreSQL

**Sintoma:**
```
Error: Connection terminated unexpectedly
Error: The server does not support SSL connections
```

**Solução:**

`backend/knexfile.js`:

```javascript
// Adicione SSL config
production: {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  }
}
```

OU use variáveis separadas:

```javascript
production: {
  client: 'pg',
  connection: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false }
  }
}
```

---

#### Frontend não consegue conectar ao Backend

**Sintoma:**
- Frontend carrega mas não mostra dados
- Console mostra erros CORS
- Requisições retornam 404

**Diagnóstico:**
```javascript
// Abra DevTools → Console
console.log('API URL:', import.meta.env.VITE_API_URL);
// Deve mostrar: https://sistema-oficina-backend.onrender.com/api
```

**Soluções:**

1. Verifique variável de ambiente no Render:
   - Frontend Settings → Environment
   - `VITE_API_URL=https://sistema-oficina-backend.onrender.com/api`

2. Verifique CORS no backend:
```javascript
// backend/server.js
const allowedOrigins = [
  'https://sistema-oficina-frontend.onrender.com', // Adicione seu domínio
  'http://localhost:5173'
];
```

3. Redeploy do frontend após mudar variável:
   - Manual Deploy → Deploy Latest Commit

---

#### Serviço dorme (plano free)

**Sintoma:**
- Primeira requisição demora 30s-1min
- Depois funciona normal por 15 minutos

**Causa:**
- Plano free do Render dorme após 15min de inatividade

**Soluções:**

1. **Upgrade para plano pago** ($7/mês - sem sleep)

2. **Ping automático** (mantém ativo):
   - Use https://cron-job.org
   - Configure job para pingar a cada 10 minutos
   - URL: https://sistema-oficina-backend.onrender.com/api/mecanicos

3. **Self-ping do frontend**:
```typescript
// frontend/src/App.tsx
useEffect(() => {
  // Ping ao backend a cada 10 minutos
  const ping = setInterval(async () => {
    try {
      await api.get('/mecanicos?limit=1');
    } catch (erro) {
      console.log('Ping falhou:', erro);
    }
  }, 10 * 60 * 1000); // 10 minutos

  return () => clearInterval(ping);
}, []);
```

---

### 12.5 Erros Conhecidos e Soluções

#### CPF/CNPJ protegido não desprotege

**Problema:**
Cliente com veículos cadastrados consegue editar nome, mas CPF/CNPJ fica bloqueado mesmo após deletar todos os veículos.

**Causa:**
Frontend está cacheando o resultado da verificação.

**Solução:**
```typescript
// Recarregue o cliente após deletar veículo
const handleDeletarVeiculo = async (id: number) => {
  await veiculoService.deletar(id);
  // Recarrega cliente para atualizar proteção
  const clienteAtualizado = await clienteService.buscarPorId(clienteId);
  setCliente(clienteAtualizado);
};
```

---

#### Estoque fica negativo

**Problema:**
Ao criar/editar OS, estoque de peça fica negativo.

**Causa:**
Validação de estoque não está funcionando ou é possível burlar.

**Solução:**
```javascript
// Adicione constraint no banco
ALTER TABLE pecas ADD CONSTRAINT estoque_nao_negativo CHECK (quantidade_estoque >= 0);

// E valide no backend ANTES de baixar
export const criarOS = async (req, res) => {
  try {
    await db.transaction(async (trx) => {
      for (const peca of pecas) {
        const pecaAtual = await trx('pecas')
          .where({ id: peca.peca_id })
          .forUpdate() // Lock pessimístico
          .first();

        if (pecaAtual.quantidade_estoque < peca.quantidade) {
          throw new Error(`Estoque insuficiente para ${pecaAtual.nome}. Disponível: ${pecaAtual.quantidade_estoque}`);
        }

        // Baixa estoque
        await trx('pecas')
          .where({ id: peca.peca_id })
          .decrement('quantidade_estoque', peca.quantidade);
      }
    });
  } catch (erro) {
    // ...
  }
};
```

---

#### Upload de fotos não funciona

**Problema:**
Upload retorna erro 500 ou fotos não aparecem.

**Causas:**
- Pasta uploads não existe
- Permissões de escrita
- Caminho de URL incorreto

**Soluções:**
```bash
# 1. Criar pasta uploads
mkdir backend/uploads
chmod 755 backend/uploads

# 2. Verificar configuração multer
# backend/controllers/uploadController.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Pasta deve existir
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

# 3. Servir arquivos estáticos
# backend/server.js
app.use('/uploads', express.static('uploads'));

# 4. No frontend, construir URL completa
const imagemUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${foto.caminho}`;
```

---

#### Autocomplete não funciona/demora

**Problema:**
Autocomplete não busca ou demora muito.

**Causas:**
- Debounce não implementado
- Busca sem limite
- Índice faltando no banco

**Soluções:**
```typescript
// Frontend com debounce
import { useState, useEffect } from 'react';

const [busca, setBusca] = useState('');
const [opcoes, setOpcoes] = useState<Cliente[]>([]);

useEffect(() => {
  // Debounce de 500ms
  const timer = setTimeout(async () => {
    if (busca.length >= 2) {
      const resultados = await clienteService.buscarAutocomplete(busca);
      setOpcoes(resultados);
    } else {
      setOpcoes([]);
    }
  }, 500);

  return () => clearTimeout(timer);
}, [busca]);

<Autocomplete
  options={opcoes}
  onInputChange={(_, value) => setBusca(value)}
  // ...
/>
```

```javascript
// Backend com índice
// Migration:
pgm.createIndex('clientes', 'nome');
pgm.createIndex('clientes', 'cpf_cnpj');

// Controller com LIMIT
export const buscarAutocomplete = async (req, res) => {
  const { busca } = req.query;

  if (!busca || busca.length < 2) {
    return res.json([]);
  }

  const clientes = await db('clientes')
    .where('nome', 'ilike', `%${busca}%`)
    .orWhere('cpf_cnpj', 'like', `%${busca}%`)
    .select('id', 'nome', 'cpf_cnpj')
    .limit(10); // IMPORTANTE!

  res.json(clientes);
};
```

---

#### Totais de OS não batem

**Problema:**
Valor total da OS não corresponde à soma de serviços + peças.

**Causa:**
- Cálculo feito no frontend
- Desconto não aplicado
- Valores não atualizados

**Solução:**
```javascript
// SEMPRE calcular no backend
export const calcularTotalOS = (servicos, pecas, desconto = 0) => {
  const totalServicos = servicos.reduce((acc, s) => acc + parseFloat(s.valor || 0), 0);
  const totalPecas = pecas.reduce((acc, p) => acc + parseFloat(p.valor_total || 0), 0);
  const subtotal = totalServicos + totalPecas;
  const valorDesconto = desconto || 0;
  const total = subtotal - valorDesconto;

  return {
    totalServicos,
    totalPecas,
    subtotal,
    valorDesconto,
    total,
  };
};

// Ao salvar OS
const totais = calcularTotalOS(servicos, pecas, desconto);

await trx('ordem_servico').insert({
  // ...outros campos
  valor_total: totais.total,
  desconto: totais.valorDesconto,
});
```

---

## 13. HISTÓRICO DE MUDANÇAS

### 13.1 Versão 2.3.0 - 2025-11-30 ⭐ NOVA

#### Proteção de Edição de OS Paga
- ✅ **Bloqueio de Edição**: Implementada proteção completa para OS com status "Pago"
  - **Backend**: Validação na função `atualizarOS` (linha 256) bloqueando edição com erro 400
  - **Frontend**: Botão de edição desabilitado visualmente com tooltip explicativo
  - **Mensagem clara**: "Não é possível editar ordem de serviço com status 'Pago'"
  - **Integridade Fiscal**: Garante que OS pagas não sejam alteradas (auditoria)

- ✅ **Bloqueio de Exclusão**: Implementada proteção para exclusão de OS Paga
  - **Backend**: Validação na função `deletarOS` (linha 446)
  - **Mensagem clara**: "Não é possível excluir ordem de serviço com status 'Pago'"

#### Correções de Compatibilidade Backend/Frontend
- ✅ **Campo preco_servico vs preco_unitario**: Backend agora aceita ambos os formatos
- ✅ **Remoção de campos inexistentes**:
  - Removido campo `descricao_problema` (não existe na tabela `ordem_servico`)
  - Removido campo `quantidade` de `os_servicos` (não existe na tabela)
  - Mantido apenas campo `observacoes` (correto no schema)
- ✅ **Busca completa na edição**: Frontend agora busca OS completa (com serviços/peças) via `getById()` antes de editar

#### Melhorias de UX
- ✅ **Dialog unificado**: Mesmo dialog para criar e editar OS (título dinâmico)
- ✅ **Botão dinâmico**: "Criar OS" vs "Salvar Alterações" dependendo do contexto
- ✅ **Tooltip informativo**: Botão desabilitado mostra motivo do bloqueio
- ✅ **Campo Observações expandido**: 4 linhas (antes 2) após remoção do campo duplicado

#### Arquivos Modificados
- `backend/controllers/osController.js` - Validações de bloqueio e compatibilidade de campos
- `frontend/src/pages/OrdemServico/OrdemServico.tsx` - Dialog de edição e remoção de campos

#### Impacto
- Integridade fiscal garantida (OS pagas não podem ser alteradas)
- Menos erros 500 (campos agora compatíveis com schema do banco)
- Melhor experiência de edição (carrega dados completos)

---

### 13.2 Versão 2.2.1 - 2025-11-30

#### Melhorias de UX (Ordem de Serviço)
- ✅ **Validação Cliente-Veículo**: Implementada filtragem automática de veículos por cliente selecionado
- ✅ **Cadastro Rápido de Cliente**: Botão "+" ao lado do campo Cliente para cadastro rápido sem sair do formulário de OS
- ✅ **Cadastro Rápido de Veículo**: Botão "+" ao lado do campo Veículo para cadastro rápido (vinculado automaticamente ao cliente)
- ✅ **Auto-seleção**: Novos clientes e veículos são automaticamente selecionados após criação
- ✅ **Reset Inteligente**: Seleção de veículo é resetada automaticamente ao trocar de cliente

#### Arquivos Modificados
- `frontend/src/pages/OrdemServico/OrdemServico.tsx` - Validação, filtros e diálogos de cadastro rápido

#### Impacto na Experiência
- Fluxo mais rápido para criar OS de clientes novos
- Impossível vincular veículo ao cliente errado
- Menos navegação entre telas

---

### 13.2 Versão 2.2.0 - 2025-11-30

#### Melhorias de Design (Major Update)
- ✅ **Design System Enterprise Professional**: Implementado tema visual completamente novo
- ✅ **Paleta de Cores Profissional**: Navy Blue (#0f172a), Slate Gray, cores sóbrias e elegantes
- ✅ **Sidebar Escura**: Menu lateral com fundo escuro (padrão enterprise/admin)
- ✅ **Header Limpo**: AppBar branco minimalista com perfil de usuário
- ✅ **Tipografia Inter**: Fonte moderna e altamente legível
- ✅ **Componentes Refinados**: Cards, botões, tabelas e inputs com novo estilo profissional
- ✅ **Responsividade Aprimorada**: Layout totalmente responsivo com drawer colapsável

#### Arquivos Criados
- `frontend/src/theme/theme.ts` - Configuração completa do tema Material-UI
- `frontend/src/index.css` - Estilos globais e importação da fonte Inter

#### Arquivos Modificados
- `frontend/src/App.tsx` - Importação do novo tema
- `frontend/src/components/Layout/Layout.tsx` - Sidebar escura, header refinado, perfil de usuário

#### Impacto Visual
- Interface mais profissional e confiável
- Melhor hierarquia visual e contraste
- Experiência de usuário premium

---

### 13.2 Versão 2.1.2 - 2025-11-30

#### Correções de Bugs (Hotfix)
- ✅ **Serviços**: Corrigida exibição de "Preço Padrão" que aparecia como NaN na listagem
- ✅ **Serviços**: Corrigida persistência do status "Ativo/Inativo" que não estava salvando
- ✅ **Backend**: Ajustada query de listagem de serviços para retornar colunas corretas (`preco_padrao`, `ativo`)
- ✅ **Backend**: Ajustado controller para aceitar e persistir campo `ativo` na criação e atualização

#### Arquivos Modificados
- `frontend/src/pages/Servicos/Servicos.tsx` - Ajuste de tipos e handlers
- `backend/controllers/auxiliarController.js` - Ajuste de queries e lógica de update

---

### 13.2 Versão 2.1.1 (Atual) - 2025-11-28

#### Melhorias de Backend
- ✅ **Campo CPF para Mecânicos**: Adicionada coluna `cpf` (VARCHAR(20), UNIQUE) na tabela mecanicos
- ✅ **Migration**: Criada migration `1764299000000_add-cpf-to-mecanicos.mjs` em formato ES Modules
- ✅ **Proteção de CPF**: Implementada validação que impede alteração de CPF se mecânico tiver OS vinculadas
- ✅ **Listagem corrigida**: Campo `cpf` agora retornado na função `listarMecanicos()` do controller

#### Regras de Negócio - Proteção de Dados
- ✅ **Clientes**: CPF/CNPJ e Nome protegidos quando há OS vinculadas
- ✅ **Veículos**: Placa, Marca, Modelo e Ano protegidos quando há OS vinculadas
- ✅ **Mecânicos**: CPF protegido quando há OS vinculadas (integridade fiscal)
- ✅ **Ordens de Serviço**: Bloqueio total de edição para status "Finalizada" ou "Cancelada"

#### Arquivos Modificados
- `backend/controllers/auxiliarController.js` - Linha 14: Adicionado `cpf` no SELECT
- `backend/controllers/auxiliarController.js` - Linhas 163-173: Proteção contra alteração de CPF
- `backend/migrations/1764299000000_add-cpf-to-mecanicos.mjs` - Nova migration

---

### 13.2 Versão 2.1.0 - 2025-11-27

#### Melhorias de Documentação
- Documentação técnica completa criada
- 13 seções abrangentes cobrindo toda a stack
- Exemplos práticos de código em todas as seções
- Guias passo a passo para adicionar funcionalidades
- Troubleshooting extensivo com soluções comprovadas

#### Arquitetura
- Sistema full-stack consolidado e estável
- Backend: Node.js + Express + PostgreSQL + Knex
- Frontend: React 19 + TypeScript + Material-UI 7
- Deploy automatizado no Render

#### Funcionalidades Principais
- ✅ CRUD completo de Clientes com proteção de CPF/CNPJ
- ✅ CRUD completo de Veículos vinculados a clientes
- ✅ CRUD completo de Mecânicos com especialidades
- ✅ CRUD completo de Serviços com categorias
- ✅ CRUD completo de Peças com controle de estoque
- ✅ CRUD complexo de Ordens de Serviço com transações atômicas
- ✅ Dashboard com estatísticas em tempo real
- ✅ Upload de fotos para OS
- ✅ Autocomplete otimizado para buscas rápidas

#### Regras de Negócio Implementadas
- Proteção automática de CPF/CNPJ quando há veículos vinculados
- Validação de estoque ao criar/editar OS
- Devolução automática de estoque ao deletar OS
- Recálculo de totais sempre no backend (segurança)
- Transações atômicas com rollback automático em caso de erro
- Validações em duas camadas (frontend UX + backend segurança)

#### Banco de Dados
- 8 migrations implementadas
- 10 tabelas com relacionamentos bem definidos
- Constraints de integridade referencial
- Índices para performance
- Sistema de migrations versionado

---

### 13.2 Versão 2.0.0 - 2025-11-24

#### Mudanças Estruturais
- Migração para React 19.2.0
- Upgrade para Material-UI 7.3.5
- Remoção de `Unstable_Grid2` (deprecado)
- Implementação de CSS Grid nativo com Box

#### Breaking Changes
- Layout completamente reformulado
- Componentes Grid2 substituídos por Box + CSS Grid
- Sistema de rotas atualizado para React Router DOM 7.9.6

#### Novas Funcionalidades
- Upload de fotos para Ordens de Serviço
- Autocomplete otimizado para busca de clientes
- Proteção de edição de campos críticos
- Dashboard com estatísticas

#### Melhorias de UX
- Interface mais moderna e responsiva
- Feedback visual em todas as operações
- Mensagens de erro específicas e claras
- Loading states em operações assíncronas

#### Deploy
- Configuração completa para Render
- Migrations automáticas no build
- Variáveis de ambiente documentadas
- SSL configurado para PostgreSQL

---

### 13.3 Versão 1.0.0 - 2025-11-20

#### Lançamento Inicial
- Arquitetura full-stack definida
- Stack tecnológica selecionada
- Estrutura base do projeto

#### Backend
- Configuração Express + PostgreSQL
- Sistema de migrations com node-pg-migrate
- Knex.js como query builder
- 6 migrations iniciais
- CRUD básico de todas as entidades

#### Frontend
- Configuração React + TypeScript + Vite
- Material-UI como biblioteca de componentes
- React Router DOM para navegação
- Axios para comunicação HTTP
- Estrutura de pages e services

#### Banco de Dados
- Schema inicial com 7 tabelas principais
- Tabelas de relacionamento para OS
- Constraints básicas de integridade
- Campos obrigatórios definidos

#### Funcionalidades Básicas
- Cadastro de Clientes
- Cadastro de Veículos
- Cadastro de Mecânicos
- Cadastro de Serviços
- Cadastro de Peças
- Cadastro de Ordem de Serviço (versão básica)

---

### 13.4 Roadmap Futuro

#### Melhorias Planejadas (Versão 2.2.0)

**Autenticação e Autorização**
- Sistema de login com usuários e senhas
- Diferentes níveis de permissão (Admin, Mecânico, Atendente)
- JWT para autenticação
- Proteção de rotas no frontend e backend
- Log de auditoria de ações

**Relatórios**
- Relatório de vendas por período
- Relatório de serviços mais realizados
- Relatório de peças mais usadas
- Relatório financeiro (entradas/saídas)
- Exportação para PDF/Excel
- Gráficos com Chart.js ou Recharts

**Notificações**
- Alertas de estoque baixo
- Notificações de OS finalizadas
- Lembretes de manutenção preventiva
- Email/SMS para clientes

**Melhorias de Performance**
- Cache com Redis
- Paginação em todas as listagens
- Lazy loading de imagens
- Virtual scrolling para listas grandes
- Service Workers para PWA

**Funcionalidades Adicionais**
- Agenda de serviços (calendar view)
- Histórico completo de veículos
- Gestão de fornecedores
- Controle de compras de peças
- Integração com sistemas de pagamento
- App mobile com React Native

#### Melhorias Técnicas (Versão 2.3.0)

**Testes**
- Testes unitários com Jest (backend)
- Testes de integração (API endpoints)
- Testes E2E com Cypress (frontend)
- Coverage de pelo menos 80%
- CI/CD com GitHub Actions

**Documentação**
- API documentation com Swagger/OpenAPI
- Storybook para componentes do frontend
- Diagramas de fluxo atualizados
- Vídeos tutoriais para usuários

**DevOps**
- Docker containers para dev/prod
- Docker Compose para ambiente local
- Kubernetes para escalabilidade (se necessário)
- Monitoring com Prometheus + Grafana
- Logs centralizados com ELK Stack

**Segurança**
- Rate limiting na API
- Sanitização de inputs contra SQL injection
- Proteção contra XSS
- HTTPS obrigatório
- Backup automático do banco
- Política de retenção de dados

#### Features Avançadas (Versão 3.0.0)

**Inteligência e Automação**
- Predição de estoque com Machine Learning
- Sugestão automática de serviços baseado em histórico
- Previsão de demanda de peças
- Chatbot para atendimento

**Integrações**
- API pública para integrações
- Webhooks para eventos importantes
- Integração com sistemas de nota fiscal
- Integração com CRM externo
- Integração com WhatsApp Business API

**Multi-tenancy**
- Suporte para múltiplas oficinas
- Dados isolados por tenant
- Painel administrativo para gerenciar tenants
- Billing por tenant

**Mobile First**
- App nativo Android/iOS
- Offline-first com sincronização
- Push notifications
- Scannar de código de barras para peças
- Assinatura digital de clientes

---

### Versionamento Semântico

Este projeto segue o [Semantic Versioning](https://semver.org/):

**Formato:** MAJOR.MINOR.PATCH

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades mantendo compatibilidade
- **PATCH**: Correções de bugs mantendo compatibilidade

**Exemplos:**
- `1.0.0` → `1.0.1`: Correção de bug
- `1.0.1` → `1.1.0`: Nova funcionalidade (ex: relatórios)
- `1.1.0` → `2.0.0`: Breaking change (ex: mudança de schema do banco)

---

### Como Contribuir com Melhorias

#### Para Desenvolvedores

1. **Fork e Clone**
   ```bash
   git clone https://github.com/seu-usuario/sistema-oficina.git
   cd sistema-oficina
   ```

2. **Crie uma Branch**
   ```bash
   git checkout -b feature/nome-da-funcionalidade
   # OU
   git checkout -b fix/nome-do-bug
   ```

3. **Desenvolva e Teste**
   - Siga os padrões de código estabelecidos
   - Adicione testes para novas funcionalidades
   - Teste manualmente no navegador
   - Verifique console de erros

4. **Commit e Push**
   ```bash
   git add .
   git commit -m "feat: adiciona funcionalidade X"
   # OU
   git commit -m "fix: corrige bug Y"
   git push origin feature/nome-da-funcionalidade
   ```

5. **Pull Request**
   - Abra PR no GitHub
   - Descreva as mudanças claramente
   - Referencie issues relacionadas
   - Aguarde code review

#### Convenção de Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona autenticação de usuários
fix: corrige cálculo de totais em OS
docs: atualiza documentação de deploy
style: formata código com prettier
refactor: reorganiza estrutura de pastas
test: adiciona testes para clienteService
chore: atualiza dependências
```

#### Code Review Checklist

Antes de abrir PR, verifique:
- [ ] Código segue padrões do projeto
- [ ] Sem erros de TypeScript
- [ ] Sem warnings no console
- [ ] Funcionalidade testada manualmente
- [ ] Documentação atualizada (se necessário)
- [ ] Migration criada (se alterou banco)
- [ ] Commit messages seguem convenção
- [ ] Sem código comentado ou console.logs
- [ ] README atualizado (se necessário)

---

### Notas de Release

#### Como Criar uma Release

1. **Atualizar Versão**
   ```bash
   # backend/package.json
   "version": "2.2.0"

   # frontend/package.json
   "version": "2.2.0"

   # .claude/DOCUMENTACAO-COMPLETA.md
   # Atualizar no cabeçalho
   ```

2. **Gerar Changelog**
   ```bash
   # Liste commits desde última release
   git log v2.1.0..HEAD --oneline

   # Agrupe por tipo (feat, fix, docs, etc)
   # Escreva resumo das mudanças
   ```

3. **Criar Tag Git**
   ```bash
   git tag -a v2.2.0 -m "Release 2.2.0 - Autenticação e Relatórios"
   git push origin v2.2.0
   ```

4. **Deploy**
   ```bash
   # Backend (Render faz automaticamente)
   git push origin main

   # Frontend (Render faz automaticamente)
   # OU manual:
   npm run build
   ```

5. **Anunciar**
   - Criar release no GitHub com changelog
   - Notificar usuários (se aplicável)
   - Atualizar documentação pública

---

### Licença

Este projeto está sob a licença MIT.

```
MIT License

Copyright (c) 2025 Sistema de Oficina Mecânica

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### Agradecimentos

Este sistema foi desenvolvido com as seguintes tecnologias de código aberto:

**Backend:**
- [Node.js](https://nodejs.org/) - Runtime JavaScript
- [Express](https://expressjs.com/) - Framework web
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados
- [Knex.js](https://knexjs.org/) - Query builder
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate) - Migrations

**Frontend:**
- [React](https://react.dev/) - Biblioteca UI
- [TypeScript](https://www.typescriptlang.org/) - Tipagem estática
- [Material-UI](https://mui.com/) - Componentes
- [Vite](https://vitejs.dev/) - Build tool
- [Axios](https://axios-http.com/) - Cliente HTTP

**Deploy e Infraestrutura:**
- [Render](https://render.com/) - Hospedagem cloud
- [Git](https://git-scm.com/) - Controle de versão
- [GitHub](https://github.com/) - Repositório de código

Agradecimentos especiais à comunidade open source!

---

### Contato e Suporte

**Problemas ou Dúvidas:**
- Abra uma [issue no GitHub](https://github.com/seu-usuario/sistema-oficina/issues)
- Consulte esta documentação completa
- Verifique a seção de [Troubleshooting](#12-troubleshooting)

**Contribuições:**
- Pull requests são bem-vindos!
- Siga o guia de contribuição acima
- Participe das discussões no GitHub

**Documentação:**
- Esta documentação é mantida em `.claude/DOCUMENTACAO-COMPLETA.md`
- Sempre atualizada com a versão atual do código
- Sugestões de melhoria são bem-vindas

---

## FIM DA DOCUMENTAÇÃO

**Status:** ✅ Documentação completa e atualizada
**Última revisão:** 2025-11-30
**Versão do sistema:** 2.3.0
**Total de seções:** 13
**Total de linhas:** 6800+

**Índice rápido:**
1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura](#3-arquitetura-do-sistema)
4. [Banco de Dados](#4-schema-do-banco-de-dados)
5. [API](#5-endpoints-da-api)
6. [Regras de Negócio](#6-regras-de-negócio)
7. [Backend](#7-backend---padrões-de-desenvolvimento)
8. [Frontend](#8-frontend---padrões-de-desenvolvimento)
9. [Fluxos Críticos](#9-fluxos-críticos-do-sistema)
10. [Configuração](#10-configuração-de-ambiente)
11. [Novas Funcionalidades](#11-como-adicionar-novas-funcionalidades)
12. [Troubleshooting](#12-troubleshooting)
13. [Histórico](#13-histórico-de-mudanças)

---
