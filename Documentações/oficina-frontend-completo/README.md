# 🚗 Sistema de Oficina Mecânica - Frontend

Sistema completo de gestão de oficina mecânica com integração total ao backend.

---

## 📦 ARQUIVOS INCLUÍDOS

1. **index.html** - Interface do formulário de OS
2. **styles.css** - Estilos modernos e responsivos
3. **app.js** - Integração completa com as APIs
4. **cors-config.js** - Configuração CORS para o backend
5. **README.md** - Este arquivo

---

## 🚀 INSTALAÇÃO

### 1. Configurar CORS no Backend

**Instalar o pacote CORS:**
```bash
cd C:\oficina-backend
npm install cors
```

**Editar seu `server.js`:**

Adicione no início do arquivo, após os imports:

```javascript
const cors = require('cors');

// Opção 1: CORS simples (desenvolvimento)
app.use(cors());

// OU

// Opção 2: CORS configurado (recomendado)
const corsOptions = {
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
};
app.use(cors(corsOptions));
```

**Reiniciar o servidor:**
```bash
node server.js
```

### 2. Colocar os Arquivos Frontend

Crie uma pasta para o frontend:

```
C:\oficina-frontend\
├── index.html
├── styles.css
├── app.js
└── README.md
```

---

## ▶️ COMO USAR

### Opção 1: Live Server (VS Code) - Recomendado

1. Instale a extensão **Live Server** no VS Code
2. Abra a pasta `oficina-frontend` no VS Code
3. Clique com botão direito em `index.html`
4. Selecione **"Open with Live Server"**
5. O navegador abrirá automaticamente em `http://localhost:5500`

### Opção 2: Abrir Diretamente no Navegador

1. Abra o arquivo `index.html` diretamente no navegador
2. **⚠️ Importante:** Pode ter problemas de CORS. Use Live Server se possível.

---

## ✨ FUNCIONALIDADES IMPLEMENTADAS

### ✅ Gestão de Clientes
- [x] Listagem de clientes existentes
- [x] Cadastro rápido inline
- [x] Validação de CPF/CNPJ
- [x] Máscaras automáticas

### ✅ Gestão de Veículos
- [x] Listagem de veículos do cliente
- [x] Cadastro rápido inline
- [x] Validação de placa (antiga e Mercosul)
- [x] Vinculação automática ao cliente

### ✅ Serviços
- [x] Listagem de serviços disponíveis
- [x] Adição múltipla de serviços
- [x] Edição de quantidade e preço
- [x] Cálculo automático de subtotais

### ✅ Peças
- [x] Busca com autocomplete
- [x] Validação de estoque em tempo real
- [x] Alertas de estoque baixo
- [x] Edição de quantidade e preço
- [x] Cálculo automático de subtotais

### ✅ Ordem de Serviço
- [x] Formulário completo
- [x] Validações frontend e backend
- [x] Cálculo automático de valores
- [x] Desconto
- [x] Forma de pagamento
- [x] Status da OS

### ✅ UX
- [x] Loading states
- [x] Toasts de notificação
- [x] Design responsivo
- [x] Máscaras de input
- [x] Feedback visual de erros

---

## 🎯 FLUXO DE USO

### 1. Selecionar/Cadastrar Cliente
- Selecione um cliente existente no dropdown
- **OU** clique em **"+ Novo"** para cadastrar rapidamente

### 2. Selecionar/Cadastrar Veículo
- Após selecionar o cliente, escolha um veículo
- **OU** clique em **"+ Novo"** para cadastrar rapidamente

### 3. Preencher Dados da OS
- Selecione o mecânico responsável
- Defina a data de abertura
- Escolha o status
- Descreva o problema relatado

### 4. Adicionar Serviços
- Selecione um serviço no dropdown
- Clique em **"+ Adicionar"**
- Edite quantidade e preço se necessário

### 5. Adicionar Peças
- Digite o nome ou código da peça na busca
- Selecione a peça desejada
- O sistema valida o estoque automaticamente
- Edite quantidade e preço se necessário

### 6. Revisar Valores
- Confira o resumo de valores
- Adicione desconto se necessário
- Selecione forma de pagamento (obrigatório se status for "Pago")

### 7. Salvar OS
- Clique em **"💾 Salvar Ordem de Serviço"**
- Aguarde confirmação
- Formulário será limpo automaticamente

---

## 🔧 VALIDAÇÕES IMPLEMENTADAS

### Frontend
- ✅ Campos obrigatórios
- ✅ Formato de CPF/CNPJ
- ✅ Formato de telefone
- ✅ Formato de placa
- ✅ Ano do veículo
- ✅ Data de conclusão >= data de abertura
- ✅ Pelo menos 1 serviço OU 1 peça
- ✅ Quantidade > 0
- ✅ Estoque disponível
- ✅ Forma de pagamento se status = "Pago"

### Backend
- ✅ Algoritmo de validação de CPF/CNPJ
- ✅ CPF/CNPJ único
- ✅ Placa única
- ✅ Cliente existe
- ✅ Veículo pertence ao cliente
- ✅ Mecânico existe
- ✅ Estoque suficiente
- ✅ Valores >= 0

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro de CORS
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5500' 
has been blocked by CORS policy
```

**Solução:**
1. Certifique-se de que instalou o pacote `cors`
2. Verifique se adicionou `app.use(cors())` no `server.js`
3. Reinicie o servidor backend

### Backend não responde
**Solução:**
1. Verifique se o servidor está rodando: `node server.js`
2. Confirme que está na porta 3000
3. Teste a API diretamente: `http://localhost:3000/api/clientes`

### Dados não carregam
**Solução:**
1. Abra o Console do navegador (F12)
2. Verifique erros de rede
3. Confirme que o backend está acessível
4. Verifique se há dados cadastrados no banco

### Estoque não valida
**Solução:**
1. Confirme que há peças cadastradas com estoque > 0
2. Verifique a rota `/api/estoque/validar` no backend
3. Teste a busca de peças no frontend

---

## 📊 ESTRUTURA DO CÓDIGO

### app.js

```
├── Configuração
│   └── API_BASE_URL
├── Estado da Aplicação
│   └── state { clientes, veiculos, mecanicos, servicos, pecas, ... }
├── Inicialização
│   ├── inicializarApp()
│   └── configurarEventos()
├── APIs
│   ├── carregarClientes()
│   ├── salvarCliente()
│   ├── carregarVeiculosCliente()
│   ├── salvarVeiculo()
│   ├── carregarMecanicos()
│   ├── carregarServicos()
│   ├── buscarPecas()
│   └── salvarOS()
├── Renderização
│   ├── popularSelects()
│   ├── renderizarServicos()
│   └── renderizarPecas()
├── Cálculos
│   └── calcularTotal()
├── Validações
│   ├── validarEstoque()
│   └── onStatusChange()
└── Utilitários
    ├── showLoading()
    ├── hideLoading()
    ├── showToast()
    └── formatarCpfCnpj()
```

---

## 🎨 CUSTOMIZAÇÃO

### Cores
Edite as variáveis CSS em `styles.css`:

```css
:root {
    --primary: #2563eb;        /* Cor principal */
    --primary-dark: #1e40af;   /* Cor principal escura */
    --success: #10b981;        /* Cor de sucesso */
    --danger: #ef4444;         /* Cor de erro */
    --warning: #f59e0b;        /* Cor de aviso */
}
```

### API URL
Edite em `app.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

---

## 📱 RESPONSIVIDADE

O sistema é totalmente responsivo e funciona em:
- 💻 Desktop (1920px+)
- 💻 Laptop (1366px)
- 📱 Tablet (768px)
- 📱 Mobile (375px)

---

## 🚀 PRÓXIMOS PASSOS (Épico 5)

- [ ] Listagem de Ordens de Serviço
- [ ] Edição de OS existente
- [ ] Filtros e busca
- [ ] Visualização detalhada
- [ ] Alteração de status
- [ ] Impressão de OS

---

## 🆘 SUPORTE

### Erros Comuns

1. **"Nenhum dado carregado"**
   - Verifique se há dados no banco
   - Confirme que as rotas retornam dados

2. **"Cliente/Veículo não encontrado"**
   - Cadastre pelo menos 1 cliente
   - Vincule pelo menos 1 veículo ao cliente

3. **"Erro ao salvar OS"**
   - Verifique o console para detalhes
   - Confirme que todos os campos estão preenchidos
   - Valide se há estoque suficiente

### Logs Úteis

Abra o Console do navegador (F12) e verifique:
- Requisições de rede (aba Network)
- Erros JavaScript (aba Console)
- Estado da aplicação: `console.log(state)`

---

## 📝 CHECKLIST PRÉ-USO

Antes de começar, certifique-se:

- [ ] Backend rodando na porta 3000
- [ ] CORS configurado no backend
- [ ] Banco de dados com estrutura criada
- [ ] Pelo menos 1 cliente cadastrado
- [ ] Pelo menos 1 mecânico cadastrado
- [ ] Pelo menos 1 serviço cadastrado
- [ ] Peças com estoque > 0
- [ ] Live Server instalado (VS Code)
- [ ] Arquivos na pasta correta

---

## ✅ TESTES REALIZADOS

- ✅ Cadastro de cliente (CPF e CNPJ)
- ✅ Cadastro de veículo (placa antiga e Mercosul)
- ✅ Busca de peças com autocomplete
- ✅ Validação de estoque
- ✅ Adição de múltiplos serviços
- ✅ Adição de múltiplas peças
- ✅ Cálculo de valores
- ✅ Aplicação de desconto
- ✅ Criação de OS completa
- ✅ Validações de campos
- ✅ Feedback visual (toasts)
- ✅ Loading states
- ✅ Responsividade mobile

---

## 🎓 TECNOLOGIAS

- **HTML5** - Estrutura semântica
- **CSS3** - Design moderno com variáveis CSS
- **JavaScript (ES6+)** - Lógica e integração
- **Fetch API** - Requisições HTTP
- **Async/Await** - Operações assíncronas
- **Local State Management** - Gerenciamento de estado

---

## 📄 LICENÇA

Este projeto faz parte do sistema de gestão de oficina mecânica.

---

## 👨‍💻 DESENVOLVEDOR

Sistema desenvolvido seguindo as melhores práticas de:
- Clean Code
- Separação de responsabilidades
- Validações robustas
- UX intuitiva
- Performance otimizada

---

**Última atualização:** 12/11/2025  
**Versão:** 1.0  
**Épico:** 4 - Integração Frontend ↔ Backend
