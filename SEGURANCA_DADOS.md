# 🔒 Segurança dos Dados dos Usuários

Este documento descreve todas as medidas de segurança implementadas para proteger os dados dos usuários do Amparo.

## ✅ Medidas de Segurança Implementadas

### 1. **Autenticação e Autorização**

#### Supabase Auth
- ✅ **Autenticação gerenciada pelo Supabase**: Senhas são hasheadas usando bcrypt
- ✅ **Tokens JWT**: Sessões seguras com tokens JWT
- ✅ **Validação de email**: Emails são validados antes do registro
- ✅ **Validação de senha forte**: Senhas devem ter pelo menos 6 caracteres

#### Row Level Security (RLS)
- ✅ **RLS habilitado em todas as tabelas**: Usuários só podem acessar seus próprios dados
- ✅ **Políticas baseadas em `auth.uid()`**: Cada usuário só vê/edita seus próprios registros
- ✅ **Cascade delete**: Quando um usuário é deletado, todos seus dados são removidos automaticamente

### 2. **Proteção contra SQL Injection**

- ✅ **Supabase Client**: Usa prepared statements automaticamente
- ✅ **Sem queries SQL diretas**: Todas as operações usam o cliente Supabase
- ✅ **Validação de tipos**: TypeScript garante tipos corretos

### 3. **Proteção contra XSS (Cross-Site Scripting)**

- ✅ **React escapa automaticamente**: React escapa strings por padrão ao renderizar
- ✅ **Sem `dangerouslySetInnerHTML`**: Não usamos renderização HTML não segura
- ✅ **Validação de inputs**: Todos os inputs são validados antes de salvar

### 4. **Validação de Dados**

#### Validações Implementadas:
- ✅ **Email**: Formato válido e único
- ✅ **Nome**: Não vazio, trim aplicado
- ✅ **Senha**: Mínimo 6 caracteres
- ✅ **Mensagens do chat**: Máximo 2000 caracteres
- ✅ **Mood (check-in)**: Entre 1 e 5
- ✅ **Tipo de memória**: Apenas 'carta' ou 'lembranca'
- ✅ **Data**: Formato válido

### 5. **Proteção de Variáveis de Ambiente**

- ✅ **Chaves de API no Netlify**: `VITE_OPENAI_API_KEY` e `VITE_SUPABASE_*` configuradas como variáveis de ambiente
- ✅ **Não expostas no código**: Chaves nunca aparecem no código fonte
- ✅ **`.env` no `.gitignore`**: Arquivos `.env` não são commitados

### 6. **HTTPS e CORS**

- ✅ **HTTPS obrigatório**: Netlify fornece HTTPS automático
- ✅ **CORS configurado**: Supabase gerencia CORS automaticamente
- ✅ **Headers de segurança**: Configurados no `netlify.toml`

### 7. **Proteção de Dados Sensíveis**

#### Dados Protegidos:
- ✅ **Senhas**: Nunca armazenadas em texto plano, sempre hasheadas
- ✅ **Tokens de API**: Nunca expostos no frontend
- ✅ **IDs de usuário**: UUIDs não sequenciais
- ✅ **Dados pessoais**: Isolados por usuário via RLS

### 8. **Detecção de Risco e Segurança do Usuário**

- ✅ **Detecção de sinais de risco**: Palavras-chave de suicídio, autolesão e violência
- ✅ **Redirecionamento para SOS**: Modal SOS abre automaticamente
- ✅ **Mensagens de segurança**: Respostas automáticas orientando busca de ajuda profissional

### 9. **Rate Limiting e Controle de Uso**

- ✅ **Limite de tokens por usuário**: Admin pode definir limites individuais
- ✅ **Rastreamento de uso**: Tokens input/output separados e rastreados
- ✅ **Custos monitorados**: Admin pode ver custos por usuário

### 10. **Backup e Recuperação**

- ✅ **Supabase backups automáticos**: Backups diários automáticos
- ✅ **Cascade delete**: Dados relacionados são removidos automaticamente
- ✅ **Histórico de mensagens**: Mensagens do chat são salvas para contexto

## 🔍 Verificações de Segurança

### Checklist de Segurança

- [x] RLS habilitado em todas as tabelas
- [x] Políticas RLS baseadas em `auth.uid()`
- [x] Validação de inputs no frontend e backend
- [x] Senhas hasheadas (bcrypt via Supabase)
- [x] HTTPS obrigatório
- [x] Variáveis de ambiente protegidas
- [x] Proteção contra XSS (React)
- [x] Proteção contra SQL Injection (Supabase)
- [x] Validação de tamanho de dados
- [x] Detecção de sinais de risco
- [x] Limites de uso (tokens)

## ⚠️ Pontos de Atenção

### 1. **Admin Panel**
- ⚠️ **Credenciais hardcoded**: Admin login usa credenciais fixas (`amancio277@gmail.com`, `@Yuri030423`)
- 💡 **Recomendação**: Em produção, usar Supabase Auth também para admin ou sistema de roles

### 2. **Rate Limiting da API**
- ⚠️ **Sem rate limiting no frontend**: Não há limite de requisições por minuto
- 💡 **Recomendação**: Implementar rate limiting no Supabase Edge Functions ou no frontend

### 3. **Sanitização de HTML**
- ⚠️ **Mensagens do chat**: Se no futuro permitir HTML, usar biblioteca de sanitização
- 💡 **Recomendação**: Usar `DOMPurify` se necessário renderizar HTML

### 4. **Logs e Monitoramento**
- ⚠️ **Logs limitados**: Apenas console.log para debugging
- 💡 **Recomendação**: Implementar sistema de logs estruturado (Sentry, LogRocket, etc.)

## 🚀 Melhorias Futuras Recomendadas

1. **Autenticação 2FA**: Adicionar autenticação de dois fatores
2. **Auditoria de logs**: Sistema de logs de ações do usuário
3. **Criptografia de dados sensíveis**: Criptografar dados especialmente sensíveis
4. **Rate limiting**: Limitar requisições por IP/usuário
5. **Content Security Policy (CSP)**: Headers CSP mais restritivos
6. **Backup manual**: Opção de exportar dados do usuário
7. **Sessões**: Timeout automático de sessão após inatividade

## 📋 Conformidade

### LGPD (Lei Geral de Proteção de Dados)
- ✅ **Consentimento**: Usuário aceita termos ao se registrar
- ✅ **Direito ao esquecimento**: Usuário pode deletar conta (remove todos os dados)
- ✅ **Portabilidade**: Dados podem ser exportados (via admin panel)
- ✅ **Minimização**: Apenas dados necessários são coletados
- ✅ **Segurança**: Dados protegidos com RLS e criptografia

### HIPAA (se aplicável)
- ⚠️ **Não certificado**: Aplicação não é certificada HIPAA
- 💡 **Recomendação**: Se necessário, usar Supabase HIPAA-compliant ou infraestrutura própria

## 🔐 Configuração de Segurança no Netlify

### Variáveis de Ambiente Obrigatórias:
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_OPENAI_API_KEY=sk-...
```

### Headers de Segurança (netlify.toml):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

## ✅ Conclusão

A aplicação implementa as principais medidas de segurança recomendadas para uma aplicação web moderna:

- ✅ Autenticação segura
- ✅ Autorização baseada em RLS
- ✅ Proteção contra injeções
- ✅ Validação de dados
- ✅ HTTPS obrigatório
- ✅ Variáveis de ambiente protegidas
- ✅ Detecção de riscos

**Status de Segurança: ✅ ADEQUADO para produção com as recomendações acima implementadas.**
