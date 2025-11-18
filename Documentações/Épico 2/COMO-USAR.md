# 📥 COMO USAR OS ARQUIVOS BAIXADOS

## 🎯 VOCÊ BAIXOU 9 ARQUIVOS:

### 📄 **Arquivos de Código:**
1. `package.json` - Configurações do projeto
2. `env-example.txt` - Arquivo de configuração (RENOMEAR!)
3. `server.js` - Servidor principal
4. `database.js` - Conexão com banco
5. `criar_tabelas.sql` - Script do banco de dados
6. `.gitignore` - Proteção de arquivos sensíveis

### 📖 **Arquivos de Documentação:**
7. `README.md` - Documentação completa
8. `GUIA-RAPIDO.md` - Tutorial visual
9. `RESUMO-EPICO-2.md` - O que foi feito

---

## 📁 PASSO A PASSO - ORGANIZAR ARQUIVOS

### **1. Criar Pasta Principal**

Crie uma pasta chamada `oficina-backend`:
- **Windows:** `C:\oficina-backend\`
- **Mac/Linux:** `~/oficina-backend/`

### **2. Colocar Arquivos na Pasta**

Mova os arquivos baixados para a pasta `oficina-backend`:

```
oficina-backend/
├── package.json       ← Cole aqui
├── server.js          ← Cole aqui
└── env-example.txt    ← Cole aqui (e renomeie!)
```

### **3. IMPORTANTE: Renomear env-example.txt**

**Renomeie** `env-example.txt` para `.env`

⚠️ **ATENÇÃO:**
- **Windows:** Arquivo vai ficar como `.env` (sem extensão visível)
- **Mac/Linux:** Terminal: `mv env-example.txt .env`

Se não conseguir ver arquivos ocultos no Windows:
1. Abra a pasta no Explorer
2. Menu "Exibir"
3. Marque "Itens ocultos"

### **4. Criar Subpastas**

Dentro de `oficina-backend`, crie estas pastas:

```
oficina-backend/
├── config/            ← Criar esta pasta
├── controllers/       ← Criar esta pasta
├── routes/            ← Criar esta pasta
├── middlewares/       ← Criar esta pasta
├── utils/             ← Criar esta pasta
├── models/            ← Criar esta pasta
├── sql/               ← Criar esta pasta
└── uploads/           ← Criar esta pasta
    └── fotos/         ← Criar esta subpasta
```

**Windows (criar todas de uma vez):**
- Crie manualmente pasta por pasta OU
- Use o terminal: 
  ```cmd
  mkdir config controllers routes middlewares utils models sql uploads uploads\fotos
  ```

**Mac/Linux:**
```bash
mkdir -p config controllers routes middlewares utils models sql uploads/fotos
```

### **5. Mover Arquivos para Subpastas**

Mova os arquivos para suas respectivas pastas:

```
oficina-backend/
├── package.json           ✅ (raiz)
├── .env                   ✅ (raiz)
├── server.js              ✅ (raiz)
├── .gitignore             ✅ (raiz)
│
├── config/
│   └── database.js        ← Mova para aqui
│
└── sql/
    └── criar_tabelas.sql  ← Mova para aqui
```

### **6. Estrutura Final**

Verifique se ficou assim:

```
oficina-backend/
│
├── 📄 package.json         (raiz)
├── 📄 .env                 (raiz)
├── 📄 server.js            (raiz)
├── 📄 .gitignore           (raiz)
├── 📄 README.md            (raiz - opcional)
├── 📄 GUIA-RAPIDO.md       (raiz - opcional)
│
├── 📁 config/
│   └── database.js
│
├── 📁 sql/
│   └── criar_tabelas.sql
│
├── 📁 controllers/         (vazia)
├── 📁 routes/              (vazia)
├── 📁 middlewares/         (vazia)
├── 📁 utils/               (vazia)
├── 📁 models/              (vazia)
│
└── 📁 uploads/
    └── fotos/              (vazia)
```

---

## ⚙️ PRÓXIMOS PASSOS

Depois de organizar os arquivos:

1. ✅ Abra o terminal na pasta `oficina-backend`
2. ✅ Execute: `npm install`
3. ✅ Configure o arquivo `.env` com sua senha
4. ✅ Crie o banco no pgAdmin
5. ✅ Execute o script SQL
6. ✅ Inicie o servidor: `npm start`

**Veja o README.md ou GUIA-RAPIDO.md para instruções detalhadas!**

---

## 🆘 PROBLEMAS COMUNS

### ❌ "Não consigo renomear para .env"
**Solução:** Use o terminal:
- Windows: `ren env-example.txt .env`
- Mac/Linux: `mv env-example.txt .env`

### ❌ "Arquivo .env não aparece"
**Solução:** Arquivos começando com ponto são ocultos. Ative a exibição de arquivos ocultos.

### ❌ "npm install não funciona"
**Solução:** 
1. Verifique se o Node.js está instalado: `node --version`
2. Verifique se está na pasta correta: `cd C:\oficina-backend`
3. Verifique se o arquivo `package.json` está na pasta

---

## 📞 CHECKLIST FINAL

- [ ] Pasta `oficina-backend` criada
- [ ] Todos os 9 arquivos baixados
- [ ] Arquivos organizados (raiz, config/, sql/)
- [ ] Todas as subpastas criadas
- [ ] `env-example.txt` renomeado para `.env`
- [ ] Pronto para executar `npm install`

---

🎉 **ESTRUTURA ORGANIZADA! AGORA É SÓ SEGUIR O README.md**

Para ver instruções detalhadas de instalação:
👉 Abra o arquivo **README.md**

Para ver um guia visual rápido:
👉 Abra o arquivo **GUIA-RAPIDO.md**

---

💡 **DICA:** Mantenha os arquivos README.md, GUIA-RAPIDO.md e RESUMO-EPICO-2.md na pasta raiz para consulta rápida!
