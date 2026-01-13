# ⚡ Quick Start - Deploy Rápido

Guia rápido para colocar o Amparo online em 15 minutos.

## 🚀 Passos Rápidos

### 1. Criar Contas (5 min)

- [ ] [Netlify](https://www.netlify.com/) - Hospedagem
- [ ] [Supabase](https://supabase.com/) - Banco de dados
- [ ] [OpenAI](https://platform.openai.com/) - API (já tem)

### 2. Configurar Supabase (5 min)

1. Criar projeto no Supabase
2. Copiar SQL do `DEPLOY_NETLIFY.md` → SQL Editor → Executar
3. Settings → API → Copiar URL e Anon Key

### 3. Deploy no Netlify (5 min)

1. Conectar repositório Git
2. Adicionar variáveis de ambiente:
   - `VITE_OPENAI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

## 📋 Checklist Mínimo

- [ ] Banco criado no Supabase
- [ ] Tabelas criadas (SQL executado)
- [ ] Variáveis configuradas no Netlify
- [ ] Deploy funcionando

## ⚠️ Importante

**Ainda usa localStorage!** Para migrar para Supabase, veja `MIGRACAO_BANCO_DADOS.md`.

---

**Pronto! 🎉**
