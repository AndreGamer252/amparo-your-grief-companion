# 🚀 Passo a Passo: Migração para Supabase

## ✅ Passo 1: Criar Projeto no Supabase (JÁ FEITO?)

1. Acesse [supabase.com](https://supabase.com/)
2. Crie um projeto (se ainda não criou)
3. Anote:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: (chave pública)

## ✅ Passo 2: Executar SQL no Supabase

1. No Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole TODO o conteúdo do arquivo `supabase_setup.sql`
4. Clique em **Run** (ou F5)
5. Aguarde a confirmação de sucesso

## ✅ Passo 3: Configurar Variáveis no Netlify

1. No Netlify, vá em **Site settings** → **Environment variables**
2. Adicione estas variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

3. Salve e faça um novo deploy

## ✅ Passo 4: Testar

Após o deploy, teste:
- [ ] Criar uma conta nova
- [ ] Fazer login
- [ ] Criar uma memória
- [ ] Fazer um check-in
- [ ] Verificar se os dados aparecem no Supabase

---

## 📝 Status da Migração

- ✅ Cliente Supabase criado (`src/lib/supabase.ts`)
- ✅ SQL para tabelas criado (`supabase_setup.sql`)
- ✅ Autenticação migrada (`src/lib/auth.ts`) - com fallback
- ⏳ Admin migrado (próximo passo)
- ⏳ Context migrado (próximo passo)
- ⏳ Journey migrado (próximo passo)

---

## 🔄 Próximos Passos

Após executar o SQL no Supabase e configurar as variáveis, me avise para continuarmos!
