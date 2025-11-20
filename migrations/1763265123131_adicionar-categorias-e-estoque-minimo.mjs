/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // 1. Criar tabela de categorias de peças
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS categorias_pecas (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      descricao TEXT,
      criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Inserir categorias padrão
  pgm.sql(`
    INSERT INTO categorias_pecas (nome, descricao) VALUES
    ('Motor', 'Peças relacionadas ao motor'),
    ('Suspensão', 'Peças de suspensão e amortecimento'),
    ('Freios', 'Sistema de freios'),
    ('Elétrica', 'Componentes elétricos'),
    ('Transmissão', 'Peças de câmbio e transmissão'),
    ('Filtros', 'Filtros de óleo, ar, combustível'),
    ('Outros', 'Peças diversas')
    ON CONFLICT (nome) DO NOTHING;
  `);

  // 3. Adicionar coluna categoria_id na tabela pecas
  pgm.addColumn('pecas', {
    categoria_id: {
      type: 'integer',
      references: 'categorias_pecas(id)',
      onDelete: 'SET NULL',
      notNull: false
    }
  });

  // 4. Adicionar coluna estoque_minimo na tabela pecas
  pgm.addColumn('pecas', {
    estoque_minimo: {
      type: 'integer',
      notNull: true,
      default: 5,
      comment: 'Quantidade mínima em estoque antes de alerta'
    }
  });

  // 5. Criar tabela de movimentação de estoque
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS estoque_movimentacao (
      id SERIAL PRIMARY KEY,
      peca_id INTEGER NOT NULL REFERENCES pecas(id) ON DELETE CASCADE,
      os_id INTEGER REFERENCES ordem_servico(id) ON DELETE SET NULL,
      tipo_movimentacao VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SAIDA', 'AJUSTE'
      quantidade INTEGER NOT NULL,
      quantidade_anterior INTEGER NOT NULL,
      quantidade_nova INTEGER NOT NULL,
      motivo TEXT,
      data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Criar índices
  pgm.createIndex('estoque_movimentacao', 'peca_id');
  pgm.createIndex('estoque_movimentacao', 'os_id');
  pgm.createIndex('estoque_movimentacao', 'data_movimentacao');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remover índices
  pgm.dropIndex('estoque_movimentacao', 'peca_id', { ifExists: true });
  pgm.dropIndex('estoque_movimentacao', 'os_id', { ifExists: true });
  pgm.dropIndex('estoque_movimentacao', 'data_movimentacao', { ifExists: true });

  // Remover tabela de movimentação
  pgm.dropTable('estoque_movimentacao', { ifExists: true, cascade: true });

  // Remover colunas da tabela pecas
  pgm.dropColumn('pecas', 'estoque_minimo', { ifExists: true });
  pgm.dropColumn('pecas', 'categoria_id', { ifExists: true });

  // Remover tabela de categorias
  pgm.dropTable('categorias_pecas', { ifExists: true, cascade: true });
};
