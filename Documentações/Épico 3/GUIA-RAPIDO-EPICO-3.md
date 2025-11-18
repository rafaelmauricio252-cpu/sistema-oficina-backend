# 🚀 GUIA RÁPIDO - ÉPICO 3

## ⚡ INSTALAR EM 5 MINUTOS

### **1. Copiar Arquivos (1 minuto)**

Copie TODOS os arquivos baixados para `oficina-backend`:

```
✅ server.js           → SOBRESCREVER o antigo!
✅ package.json        → SOBRESCREVER o antigo!
✅ env-example.txt     → Renomear para .env
✅ .gitignore

✅ controllers/        → NOVA pasta (6 arquivos)
✅ routes/             → NOVA pasta (6 arquivos)
✅ middlewares/        → NOVA pasta (1 arquivo)
✅ utils/              → NOVA pasta (2 arquivos)
```

### **2. Instalar Dependências (2 minutos)**

```bash
cd oficina-backend
npm install
```

### **3. Iniciar Servidor (1 minuto)**

```bash
npm start
```

### **4. Testar (1 minuto)**

Abra o navegador:
```
http://localhost:3000/
```

Deve mostrar todas as rotas disponíveis! ✅

---

## 🧪 TESTES RÁPIDOS

### **Teste 1: Buscar Peças**
```
http://localhost:3000/api/pecas/buscar?q=filtro
```

### **Teste 2: Listar Mecânicos**
```
http://localhost:3000/api/mecanicos
```

### **Teste 3: Dashboard**
```
http://localhost:3000/api/dashboard
```

---

## 📝 CRIAR SUA PRIMEIRA OS (Postman)

### **URL:**
```
POST http://localhost:3000/api/os
```

### **Body (JSON):**
```json
{
  "cliente_id": 1,
  "veiculo_id": 1,
  "mecanico_id": 1,
  "data_abertura": "2024-11-10",
  "status": "Em Andamento",
  "desconto": 0,
  "servicos": [
    {
      "servico_id": 1,
      "quantidade": 1,
      "preco_unitario": 150.00
    }
  ],
  "pecas": [
    {
      "peca_id": 1,
      "quantidade": 1,
      "preco_unitario": 45.90
    }
  ]
}
```

### **Resposta Esperada:**
```json
{
  "sucesso": true,
  "mensagem": "Ordem de Serviço criada com sucesso",
  "os": {
    "id": 1,
    "numero_os": "OS-2024-00001",
    "valor_total": "195.90"
  }
}
```

---

## 🎯 PRINCIPAIS ENDPOINTS

| Funcionalidade | Método | Endpoint |
|----------------|--------|----------|
| Buscar clientes | GET | `/api/clientes/buscar?q=nome` |
| Cadastrar cliente | POST | `/api/clientes/rapido` |
| Listar veículos | GET | `/api/veiculos?cliente_id=1` |
| Cadastrar veículo | POST | `/api/veiculos/rapido` |
| Buscar peças | GET | `/api/pecas/buscar?q=nome` |
| Validar estoque | GET | `/api/estoque/validar?peca_id=1&quantidade=2` |
| Criar OS | POST | `/api/os` |
| Listar OS | GET | `/api/os` |
| Upload foto | POST | `/api/upload/foto` |
| Dashboard | GET | `/api/dashboard` |

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Servidor iniciou sem erros?
- [ ] GET http://localhost:3000/ mostra as rotas?
- [ ] GET /api/mecanicos retorna dados?
- [ ] GET /api/pecas/buscar?q=filtro funciona?
- [ ] POST /api/clientes/rapido cria cliente?
- [ ] Dashboard (/api/dashboard) mostra estatísticas?

---

## 🆘 ERRO COMUM

### ❌ "Cannot find module"
```bash
npm install
```

### ❌ Server não inicia
1. Pare o servidor antigo (CTRL+C)
2. Verifique se .env está configurado
3. npm start

### ❌ "ECONNREFUSED"
- PostgreSQL está rodando? Inicie o serviço.

---

## 🎉 PRONTO!

Você tem agora **30+ APIs funcionando**!

Para ver todos os detalhes:
👉 Leia o arquivo **README-EPICO-3.md**

Para integrar com o frontend:
👉 Aguarde o **ÉPICO 4**!

---

💡 **Dica:** Use o Postman ou Thunder Client para testar todas as APIs antes de integrar com o frontend!
