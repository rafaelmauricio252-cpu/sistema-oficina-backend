# 🚀 GUIA RÁPIDO - COMEÇAR EM 10 MINUTOS

## ⏱️ TIMELINE DE INSTALAÇÃO

```
┌─────────────────────────────────────────────────────────────┐
│  0min     2min     5min     7min     9min     10min         │
│   │        │        │        │        │        │            │
│   ▼        ▼        ▼        ▼        ▼        ▼            │
│  Node   PostgreSQL Criar   Executar Config  Testar         │
│         Instalado   Banco    SQL     .env   Servidor        │
│                                                              │
│  ✅       ✅        ✅       ✅       ✅       ✅            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST VISUAL

### 🔧 INSTALAÇÃO INICIAL (5 minutos)

```
┌──────────────────────────────────────────────┐
│ [ ] 1. Instalar Node.js                      │
│     └─> https://nodejs.org/                  │
│                                               │
│ [ ] 2. Instalar PostgreSQL                   │
│     └─> https://www.postgresql.org/          │
│     └─> Anote a SENHA!                       │
│                                               │
│ [ ] 3. Instalar VS Code                      │
│     └─> https://code.visualstudio.com/       │
└──────────────────────────────────────────────┘
```

### 📁 ORGANIZAÇÃO (2 minutos)

```
oficina-backend/
├── [ ] package.json         ← Aqui na raiz!
├── [ ] .env                 ← Aqui na raiz!
├── [ ] server.js            ← Aqui na raiz!
├── [ ] .gitignore           ← Aqui na raiz!
│
├── [ ] config/
│   └── database.js          ← Mover para cá!
│
├── [ ] sql/
│   └── criar_tabelas.sql    ← Mover para cá!
│
└── [ ] Criar mais 5 pastas: controllers, routes,
        middlewares, utils, models, uploads/fotos
```

### 💻 TERMINAL (3 minutos)

```
┌──────────────────────────────────────────────┐
│ PASSO 1: Navegar até a pasta                 │
│ > cd C:\oficina-backend                      │
│                                               │
│ PASSO 2: Instalar dependências               │
│ > npm install                                 │
│ ⏳ Aguarde 1-2 minutos...                    │
│                                               │
│ PASSO 3: Iniciar servidor                    │
│ > npm start                                   │
│                                               │
│ ✅ Viu mensagens de sucesso? PRONTO!         │
└──────────────────────────────────────────────┘
```

### 🗄️ BANCO DE DADOS (3 minutos)

```
┌──────────────────────────────────────────────┐
│ PGADMIN:                                      │
│                                               │
│ 1. Abrir pgAdmin                              │
│ 2. Botão direito em "Databases"              │
│ 3. Create → Database                          │
│ 4. Nome: oficina_db                           │
│ 5. Save                                       │
│                                               │
│ 6. Clicar em "oficina_db"                     │
│ 7. Tools → Query Tool (ou ícone ⚡)          │
│ 8. Abrir arquivo criar_tabelas.sql           │
│ 9. Copiar TUDO                                │
│ 10. Colar no Query Tool                       │
│ 11. F5 (Execute)                              │
│                                               │
│ ✅ "Query returned successfully" → Sucesso!  │
└──────────────────────────────────────────────┘
```

### ⚙️ CONFIGURAÇÃO (1 minuto)

```
┌──────────────────────────────────────────────┐
│ ARQUIVO .env:                                 │
│                                               │
│ DB_PASSWORD=SUA_SENHA_AQUI                    │
│      ▲                                        │
│      │                                        │
│      └── Trocar pela senha do PostgreSQL     │
│                                               │
│ Exemplo:                                      │
│ DB_PASSWORD=admin123                          │
│                                               │
│ ⚠️ SALVAR O ARQUIVO! (Ctrl+S)                │
└──────────────────────────────────────────────┘
```

---

## 🧪 TESTES - SABER SE ESTÁ FUNCIONANDO

### ✅ TESTE 1: Servidor Online

```
┌──────────────────────────────────────────────┐
│ Abrir navegador:                              │
│ http://localhost:3000/                        │
│                                               │
│ Deve aparecer:                                │
│ {                                             │
│   "mensagem": "🚗 API está funcionando!"     │
│   "status": "online"                          │
│ }                                             │
└──────────────────────────────────────────────┘
```

### ✅ TESTE 2: Banco Conectado

```
┌──────────────────────────────────────────────┐
│ Abrir navegador:                              │
│ http://localhost:3000/api/teste-banco         │
│                                               │
│ Deve aparecer:                                │
│ {                                             │
│   "mensagem": "✅ Banco conectado!"          │
│   "horario_servidor": "..."                   │
│ }                                             │
└──────────────────────────────────────────────┘
```

---

## 🆘 AJUDA RÁPIDA - ERROS COMUNS

| ❌ Erro | ✅ Solução |
|---------|-----------|
| `Cannot find module` | `npm install` |
| `password authentication failed` | Conferir senha no `.env` |
| `database does not exist` | Criar banco no pgAdmin |
| `Port already in use` | Mudar PORT no `.env` |
| `ECONNREFUSED` | Iniciar PostgreSQL |

---

## 📊 STATUS DO PROJETO

```
┌────────────────────────────────────────────────────┐
│                                                     │
│  ✅ BACKEND CONFIGURADO                            │
│  ✅ BANCO DE DADOS CRIADO                          │
│  ✅ SERVIDOR FUNCIONANDO                           │
│                                                     │
│  🔜 PRÓXIMO: Criar APIs (Controllers + Routes)    │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 🎯 O QUE TEMOS ATÉ AGORA?

```
✅ Estrutura do Projeto
✅ Servidor Express configurado
✅ Conexão com PostgreSQL
✅ 11 Tabelas criadas
✅ 2 Triggers automáticos (número OS, estoque)
✅ Dados de exemplo (mecânicos, serviços, peças)
✅ Rotas de teste funcionando
```

---

## 🚀 PRÓXIMOS PASSOS

```
1️⃣ Criar APIs para BUSCAR CLIENTE
2️⃣ Criar APIs para CADASTRAR CLIENTE  
3️⃣ Criar APIs para VEÍCULOS
4️⃣ Criar APIs para VALIDAR ESTOQUE
5️⃣ Criar API para SALVAR ORDEM DE SERVIÇO
6️⃣ Testar integração com o formulário frontend
```

---

## 💡 DICA IMPORTANTE

**Sempre que alterar código:**
1. Pare o servidor (CTRL+C)
2. Salve os arquivos (CTRL+S)
3. Reinicie o servidor (npm start)

**Sempre que fizer query no banco:**
1. Use o pgAdmin (Query Tool)
2. Teste a query primeiro
3. Depois coloque no código

---

🎉 **PARABÉNS! VOCÊ CONFIGUROU O BACKEND!**

Agora é só criar as APIs e conectar com o frontend! 🚀
