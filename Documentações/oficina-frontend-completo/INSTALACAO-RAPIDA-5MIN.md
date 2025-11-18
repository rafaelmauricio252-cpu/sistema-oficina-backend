# 🚀 INSTALAÇÃO RÁPIDA - 5 MINUTOS

## ⚡ PASSO A PASSO

### 1️⃣ Configure CORS no Backend (2 min)

Abra o terminal na pasta do backend:

```bash
cd C:\oficina-backend
npm install cors
```

Edite o arquivo `server.js` e adicione no início (após os imports):

```javascript
const cors = require('cors');
app.use(cors());
```

Reinicie o servidor:

```bash
node server.js
```

✅ Deve aparecer: "Servidor rodando na porta 3000"

---

### 2️⃣ Coloque os Arquivos Frontend (1 min)

Crie a pasta:

```
C:\oficina-frontend\
```

Copie os arquivos para lá:
- index.html
- styles.css
- app.js

---

### 3️⃣ Abra no Navegador (1 min)

**Opção A - Live Server (VS Code):**
1. Abra a pasta no VS Code
2. Instale extensão "Live Server"
3. Clique direito em `index.html` → "Open with Live Server"

**Opção B - Direto no navegador:**
1. Dê duplo clique em `index.html`

---

### 4️⃣ PRONTO! 🎉

Acesse: `http://localhost:5500`

---

## ✅ TESTE RÁPIDO

1. Clique em "Cliente" → "+ Novo"
2. Preencha: Nome, CPF (11122233344), Telefone
3. Clique em "Salvar Cliente"
4. ✅ Deve aparecer toast: "Cliente cadastrado com sucesso!"

---

## 🐛 SE DER ERRO

**CORS Error?**
- Certifique-se que instalou `npm install cors`
- Adicionou `app.use(cors())` no server.js
- Reiniciou o servidor

**Backend não responde?**
- Verifique: `http://localhost:3000/api/clientes`
- Deve retornar JSON com lista de clientes

**Nada carrega?**
- Abra Console (F12)
- Veja erros na aba Console
- Veja requisições na aba Network

---

## 📞 AJUDA

Abra o arquivo `README.md` completo para mais detalhes.

---

**Tempo total:** ~5 minutos  
**Dificuldade:** ⭐ Fácil
