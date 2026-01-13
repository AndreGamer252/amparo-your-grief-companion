# 🚀 Guia de Deploy - Amparo no Netlify

Este guia completo explica como fazer o deploy da aplicação Amparo no Netlify, incluindo integrações, segurança e banco de dados.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Banco de Dados (Supabase)](#configuração-do-banco-de-dados-supabase)
3. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
4. [Deploy no Netlify](#deploy-no-netlify)
5. [Integrações Necessárias](#integrações-necessárias)
6. [Segurança](#segurança)
7. [Migração de Dados](#migração-de-dados)

---

## 📦 Pré-requisitos

- Conta no [Netlify](https://www.netlify.com/)
- Conta no [Supabase](https://supabase.com/) (banco de dados gratuito)
- Conta no [OpenAI](https://platform.openai.com/) (para API)
- Repositório Git (GitHub, GitLab ou Bitbucket)

---

## 🗄️ Configuração do Banco de Dados (Supabase)

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/)
2. Crie uma conta (gratuita)
3. Clique em "New Project"
4. Preencha:
   - **Name**: `amparo-db`
   - **Database Password**: (anote esta senha!)
   - **Region**: Escolha a mais próxima (ex: South America)
5. Aguarde a criação do projeto (~2 minutos)

### 2. Criar Tabelas no Banco de Dados

Acesse o **SQL Editor** no Supabase e execute o seguinte script:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  subscription_active BOOLEAN DEFAULT false,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  total_tokens_used INTEGER DEFAULT 0,
  input_tokens_used INTEGER DEFAULT 0,
  output_tokens_used INTEGER DEFAULT 0,
  token_limit INTEGER,
  profile_data JSONB DEFAULT '{}'::jsonb
);

-- Tabela de memórias
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('carta', 'lembranca')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Tabela de mensagens do chat
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'amparo')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de progresso da jornada
CREATE TABLE journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Índices para performance
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_date ON check_ins(date);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_journey_progress_user_id ON journey_progress(user_id);

-- RLS (Row Level Security) - Segurança
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (usuários só podem ver/editar seus próprios dados)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own memories" ON memories
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own memories" ON memories
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own check_ins" ON check_ins
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own check_ins" ON check_ins
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own chat_messages" ON chat_messages
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own chat_messages" ON chat_messages
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own journey_progress" ON journey_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own journey_progress" ON journey_progress
  FOR ALL USING (auth.uid()::text = user_id::text);
```

### 3. Obter Credenciais do Supabase

1. No Supabase, vá em **Settings** → **API**
2. Anote:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: (chave pública)
   - **service_role key**: (chave privada - mantenha segura!)

---

## 🔐 Configuração de Variáveis de Ambiente

### Variáveis Necessárias

No Netlify, você precisará configurar as seguintes variáveis:

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `VITE_OPENAI_API_KEY` | Chave da API OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Settings → API no Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase | Settings → API no Supabase |
| `VITE_SUPABASE_SERVICE_KEY` | Chave privada (apenas backend) | Settings → API no Supabase |

### Como Configurar no Netlify

1. No Netlify, vá em **Site settings** → **Environment variables**
2. Adicione cada variável:
   - **Key**: Nome da variável (ex: `VITE_OPENAI_API_KEY`)
   - **Value**: Valor da variável
   - **Scopes**: Deixe como "All scopes" ou selecione "Production"

---

## 🚀 Deploy no Netlify

### Opção 1: Deploy via Git (Recomendado)

1. **Conecte seu repositório**:
   - No Netlify, clique em "Add new site" → "Import an existing project"
   - Conecte seu repositório (GitHub/GitLab/Bitbucket)
   - Selecione o repositório do Amparo

2. **Configure o build**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - (Já configurado no `netlify.toml`)

3. **Adicione variáveis de ambiente**:
   - Vá em **Site settings** → **Environment variables**
   - Adicione todas as variáveis listadas acima

4. **Deploy**:
   - Clique em "Deploy site"
   - Aguarde o build completar (~2-3 minutos)

### Opção 2: Deploy Manual (Drag & Drop)

1. **Build local**:
   ```bash
   npm install
   npm run build
   ```

2. **Deploy**:
   - No Netlify, vá em "Add new site" → "Deploy manually"
   - Arraste a pasta `dist` para a área de deploy

---

## 🔌 Integrações Necessárias

### 1. OpenAI API

- **Status**: ✅ Já integrado
- **Configuração**: Adicione `VITE_OPENAI_API_KEY` no Netlify
- **Custo**: Pay-as-you-go (GPT-4o-mini é barato)

### 2. Supabase (Banco de Dados)

- **Status**: ⚠️ Precisa migrar do localStorage
- **Configuração**: 
  - Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
  - Instale: `npm install @supabase/supabase-js`

### 3. Netlify Functions (Opcional - para API backend)

Se precisar de funções serverless:

```bash
npm install netlify-cli -g
mkdir netlify/functions
```

---

## 🛡️ Segurança

### Implementações Necessárias

1. **Variáveis de Ambiente**:
   - ✅ Nunca commitar `.env` no Git
   - ✅ Usar apenas variáveis no Netlify

2. **CORS**:
   - Configurar no Supabase: Settings → API → CORS
   - Adicionar domínio do Netlify: `https://seu-site.netlify.app`

3. **Row Level Security (RLS)**:
   - ✅ Já configurado no SQL acima
   - Usuários só acessam seus próprios dados

4. **HTTPS**:
   - ✅ Automático no Netlify

5. **Headers de Segurança**:
   - ✅ Configurado no `netlify.toml`

### Checklist de Segurança

- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] `.env` no `.gitignore`
- [ ] CORS configurado no Supabase
- [ ] RLS habilitado no Supabase
- [ ] Senhas hasheadas (usar bcrypt)
- [ ] API keys nunca expostas no frontend

---

## 📊 Migração de Dados

### Do localStorage para Supabase

Você precisará criar funções de migração. Crie um arquivo `src/lib/migration.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função para migrar dados do localStorage
export async function migrateLocalStorageToSupabase(userId: string) {
  // Migrar memórias
  const memories = JSON.parse(localStorage.getItem('amparo_memories') || '[]');
  // ... código de migração
  
  // Migrar check-ins
  const checkIns = JSON.parse(localStorage.getItem('amparo_checkins') || '[]');
  // ... código de migração
}
```

---

## 📝 Próximos Passos

1. **Instalar Supabase Client**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Criar arquivo de configuração Supabase**:
   - `src/lib/supabase.ts`

3. **Migrar funções de localStorage**:
   - `src/lib/auth.ts` → usar Supabase
   - `src/lib/admin.ts` → usar Supabase
   - `src/context/AmparoContext.tsx` → usar Supabase

4. **Testar localmente**:
   ```bash
   npm run dev
   ```

5. **Deploy**:
   - Push para Git → Deploy automático no Netlify

---

## 🆘 Troubleshooting

### Erro: "Module not found"
- Execute `npm install` novamente
- Verifique se todas as dependências estão no `package.json`

### Erro: "Environment variable not found"
- Verifique se as variáveis estão configuradas no Netlify
- Reinicie o build após adicionar variáveis

### Erro: "CORS policy"
- Configure CORS no Supabase
- Adicione o domínio do Netlify nas configurações

### Build falha
- Verifique os logs no Netlify
- Teste localmente: `npm run build`

---

## 📚 Recursos Úteis

- [Documentação Netlify](https://docs.netlify.com/)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação OpenAI](https://platform.openai.com/docs)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html)

---

## ✅ Checklist Final

Antes de fazer deploy:

- [ ] Banco de dados criado no Supabase
- [ ] Tabelas criadas e RLS configurado
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] `netlify.toml` criado
- [ ] `.env` no `.gitignore`
- [ ] Build local funciona: `npm run build`
- [ ] CORS configurado no Supabase
- [ ] Testado localmente com variáveis de ambiente

---

**Pronto para deploy! 🚀**
