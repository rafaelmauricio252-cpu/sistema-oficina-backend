/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cpf_cnpj VARCHAR(20) UNIQUE,
        telefone VARCHAR(20),
        email VARCHAR(255),
        endereco TEXT,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS veiculos (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        marca VARCHAR(100) NOT NULL,
        modelo VARCHAR(100) NOT NULL,
        ano INTEGER,
        placa VARCHAR(10) UNIQUE NOT NULL,
        cor VARCHAR(50),
        observacoes TEXT,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS pecas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        fabricante VARCHAR(100),
        numero_peca VARCHAR(100) UNIQUE,
        preco_custo DECIMAL(10, 2),
        preco_venda DECIMAL(10, 2) NOT NULL,
        quantidade_estoque INTEGER NOT NULL DEFAULT 0,
        localizacao_estoque VARCHAR(100),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS servicos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        descricao TEXT,
        preco DECIMAL(10, 2) NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS mecanicos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        especialidade VARCHAR(100),
        telefone VARCHAR(20),
        email VARCHAR(255) UNIQUE,
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS ordem_servico (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
        veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
        mecanico_id INTEGER REFERENCES mecanicos(id) ON DELETE SET NULL,
        data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_fechamento TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL DEFAULT 'Aberta',
        observacoes TEXT,
        valor_total DECIMAL(10, 2) DEFAULT 0.00,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS os_pecas (
        id SERIAL PRIMARY KEY,
        os_id INTEGER NOT NULL REFERENCES ordem_servico(id) ON DELETE CASCADE,
        peca_id INTEGER NOT NULL REFERENCES pecas(id) ON DELETE RESTRICT,
        quantidade INTEGER NOT NULL,
        preco_unitario DECIMAL(10, 2) NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS os_servicos (
        id SERIAL PRIMARY KEY,
        os_id INTEGER NOT NULL REFERENCES ordem_servico(id) ON DELETE CASCADE,
        servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
        preco_servico DECIMAL(10, 2) NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS os_fotos (
        id SERIAL PRIMARY KEY,
        os_id INTEGER NOT NULL REFERENCES ordem_servico(id) ON DELETE CASCADE,
        url_foto VARCHAR(255) NOT NULL,
        descricao TEXT,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes (cpf_cnpj);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos (placa);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_pecas_numero_peca ON pecas (numero_peca);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_os_cliente_id ON ordem_servico (cliente_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_os_veiculo_id ON ordem_servico (veiculo_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_os_mecanico_id ON ordem_servico (mecanico_id);`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex('clientes', 'idx_clientes_cpf_cnpj', { ifExists: true });
  pgm.dropIndex('veiculos', 'idx_veiculos_placa', { ifExists: true });
  pgm.dropIndex('pecas', 'idx_pecas_numero_peca', { ifExists: true });
  pgm.dropIndex('ordem_servico', 'idx_os_cliente_id', { ifExists: true });
  pgm.dropIndex('ordem_servico', 'idx_os_veiculo_id', { ifExists: true });
  pgm.dropIndex('ordem_servico', 'idx_os_mecanico_id', { ifExists: true });

  pgm.dropTable('os_fotos', { cascade: true });
  pgm.dropTable('os_servicos', { cascade: true });
  pgm.dropTable('os_pecas', { cascade: true });
  pgm.dropTable('ordem_servico', { cascade: true });
  pgm.dropTable('veiculos', { cascade: true });
  pgm.dropTable('clientes', { cascade: true });
  pgm.dropTable('mecanicos', { cascade: true });
  pgm.dropTable('servicos', { cascade: true });
  pgm.dropTable('pecas', { cascade: true });
};
