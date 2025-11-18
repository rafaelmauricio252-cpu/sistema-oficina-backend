# 🚗 SISTEMA DE OFICINA - BACKEND

Sistema completo de gestão de oficina mecânica com controle de ordens de serviço, clientes, veículos e estoque.

---

## 📋 PRÉ-REQUISITOS

Antes de começar, você precisa ter instalado:

- ✅ **Node.js** (versão 18 ou superior) - https://nodejs.org/
- ✅ **PostgreSQL** (versão 14 ou superior) - https://www.postgresql.org/
- ✅ **pgAdmin** (para gerenciar o banco) - já vem com PostgreSQL
- ✅ **VS Code** (editor de código) - https://code.visualstudio.com/

---

## 🚀 INSTALAÇÃO - PASSO A PASSO

### **PASSO 1: Baixar o Projeto**

1. Extraia todos os arquivos em uma pasta
2. Exemplo: `C:\oficina-backend\` (Windows) ou `~/oficina-backend/` (Mac/Linux)

### **PASSO 2: Instalar Dependências**

1. Abra o **Terminal/Prompt de Comando**
2. Navegue até a pasta do projeto:
   ```bash
   cd C:\oficina-backend
   ```
3. Instale as bibliotecas necessárias:
   ```bash
   npm install
   ```
   ⏳ Aguarde alguns minutos (vai baixar tudo automaticamente)

### **PASSO 3: Configurar o Banco de Dados**

#### 3.1 - Criar o Banco

1. Abra o **pgAdmin**
2. Clique com botão direito em **Databases**
3. Escolha **Create → Database**
4. Nome do banco: `oficina_db`
5. Clique em **Save**

#### 3.2 - Executar o Script SQL

1. No pgAdmin, clique no banco `oficina_db`
2. Clique no ícone **Query Tool** (raio/SQL)
3. Abra o arquivo `criar_tabelas.sql`
4. Copie TODO o conteúdo
5. Cole na janela do Query Tool
6. Clique em **Execute/Run** (F5)
7. ✅ Deve aparecer "Query returned successfully"

### **PASSO 4: Configurar as Senhas**

1. Abra o arquivo `.env` no VS Code
2. Encontre a linha:
   ```
   DB_PASSWORD=SUA_SENHA_AQUI
   ```
3. Troque `SUA_SENHA_AQUI` pela senha do seu PostgreSQL
4. Exemplo:
   ```
   DB_PASSWORD=admin123
   ```
5. **SALVE O ARQUIVO** (Ctrl+S)

### **PASSO 5: Criar Pastas Necessárias**

Crie as seguintes pastas dentro de `oficina-backend`:

```
oficina-backend/
├── config/
├── controllers/
├── routes/
├── middlewares/
├── utils/
├── models/
├── uploads/
│   └── fotos/
└── sql/
```

**Como criar no Windows:**
- Clique com botão direito → Nova Pasta

**Como criar no Mac/Linux (terminal):**
```bash
mkdir -p config controllers routes middlewares utils models uploads/fotos sql
```

### **PASSO 6: Organizar os Arquivos**

Mova os arquivos para as pastas corretas:

- ✅ `database.js` → coloque dentro da pasta `config/`
- ✅ `criar_tabelas.sql` → coloque dentro da pasta `sql/`
- ✅ Deixe `server.js`, `package.json` e `.env` na pasta raiz

Estrutura final:
```
oficina-backend/
├── package.json           ✅ (raiz)
├── .env                   ✅ (raiz)
├── server.js              ✅ (raiz)
├── config/
│   └── database.js        ✅
├── sql/
│   └── criar_tabelas.sql  ✅
├── uploads/
│   └── fotos/
└── (outras pastas vazias por enquanto)
```

---

## ▶️ EXECUTAR O SERVIDOR

### **Iniciar o Servidor:**

No terminal, dentro da pasta do projeto, digite:

```bash
npm start
```

### **Se tudo estiver certo, você verá:**

```
==============================================
🚗  SERVIDOR DA OFICINA INICIADO!
==============================================
📡 Rodando em: http://localhost:3000
🕐 Iniciado em: 10/11/2024 14:30:00
==============================================

✅ Banco de dados conectado com sucesso!

📋 Rotas disponíveis:
   - GET  http://localhost:3000/
   - GET  http://localhost:3000/api/teste-banco

💡 Pressione CTRL+C para parar o servidor
==============================================
```

---

## 🧪 TESTAR SE ESTÁ FUNCIONANDO

### **Teste 1: API Online**

Abra o navegador e acesse:
```
http://localhost:3000/
```

Deve aparecer:
```json
{
  "mensagem": "🚗 API da Oficina está funcionando!",
  "versao": "1.0.0",
  "status": "online"
}
```

### **Teste 2: Conexão com Banco**

Acesse:
```
http://localhost:3000/api/teste-banco
```

Deve aparecer:
```json
{
  "mensagem": "✅ Banco de dados conectado!",
  "horario_servidor": "2024-11-10T14:30:00.000Z"
}
```

---

## 🐛 PROBLEMAS COMUNS

### **Erro: "Cannot find module 'express'"**
**Solução:** Rode `npm install` novamente

### **Erro: "password authentication failed"**
**Solução:** Verifique a senha no arquivo `.env`

### **Erro: "database 'oficina_db' does not exist"**
**Solução:** Crie o banco no pgAdmin (passo 3.1)

### **Erro: "Port 3000 already in use"**
**Solução:** Mude a porta no arquivo `.env`:
```
PORT=3001
```

### **Erro: "ECONNREFUSED"**
**Solução:** PostgreSQL não está rodando. Inicie o serviço:
- **Windows:** Serviços → PostgreSQL → Iniciar
- **Mac:** `brew services start postgresql`
- **Linux:** `sudo systemctl start postgresql`

---

## 📁 ESTRUTURA DO PROJETO

```
oficina-backend/
│
├── 📄 package.json           # Dependências do projeto
├── 📄 .env                   # Configurações (SENHAS!)
├── 📄 server.js              # Servidor principal
│
├── 📁 config/
│   └── database.js           # Conexão com banco
│
├── 📁 controllers/           # Lógica de negócio (VAZIO - próximo passo)
├── 📁 routes/                # Rotas da API (VAZIO - próximo passo)
├── 📁 middlewares/           # Validações (VAZIO - próximo passo)
├── 📁 models/                # Modelos (VAZIO - próximo passo)
├── 📁 utils/                 # Funções auxiliares (VAZIO - próximo passo)
│
├── 📁 uploads/
│   └── fotos/                # Fotos das OS
│
└── 📁 sql/
    └── criar_tabelas.sql     # Script do banco
```

---

## ✅ CHECKLIST DE INSTALAÇÃO

- [ ] Node.js instalado
- [ ] PostgreSQL instalado
- [ ] Banco `oficina_db` criado
- [ ] Script SQL executado com sucesso
- [ ] Arquivo `.env` configurado com a senha
- [ ] Comando `npm install` executado
- [ ] Pastas criadas
- [ ] Arquivos organizados
- [ ] Servidor iniciado sem erros
- [ ] Testes funcionando (http://localhost:3000)

---

## 🎯 PRÓXIMOS PASSOS

Agora que o backend está configurado, vamos criar:

1. ✅ **Controllers** - Lógica de negócio
2. ✅ **Routes** - Endpoints da API
3. ✅ **Validações** - CPF, CNPJ, Estoque
4. ✅ **Integração** - Conectar com o formulário frontend

---

## 📞 SUPORTE

Se tiver algum erro ou dúvida:
1. Leia a seção "Problemas Comuns"
2. Verifique se seguiu todos os passos
3. Anote a mensagem de erro completa

---

## 📝 OBSERVAÇÕES IMPORTANTES

⚠️ **NUNCA compartilhe o arquivo `.env`** (contém senhas!)
⚠️ **Sempre pare o servidor** antes de fazer alterações (CTRL+C)
⚠️ **Faça backup** do banco antes de executar scripts SQL

---

🚗 **Sistema desenvolvido para gestão completa de oficinas mecânicas**
