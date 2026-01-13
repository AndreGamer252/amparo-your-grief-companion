# Configurar Chave da OpenAI no Netlify

## Passo a Passo

1. **Acesse o Netlify Dashboard**
   - Vá para [app.netlify.com](https://app.netlify.com)
   - Faça login na sua conta

2. **Navegue até o seu site**
   - Clique no site "amparo-your-grief-companion" (ou o nome do seu site)

3. **Acesse as configurações de ambiente**
   - No menu lateral, clique em **"Site settings"**
   - Role até encontrar **"Environment variables"**
   - Clique em **"Add a variable"**

4. **Adicione a variável VITE_OPENAI_API_KEY**
   - **Key**: `VITE_OPENAI_API_KEY`
   - **Value**: Cole sua chave da API OpenAI (começa com `sk-...`)
   - Clique em **"Save"**

5. **Redeploy do site**
   - Após adicionar a variável, o Netlify pode fazer um redeploy automático
   - Se não fizer, vá em **"Deploys"** e clique em **"Trigger deploy"** > **"Clear cache and deploy site"**

## Como obter a chave da OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Faça login na sua conta
3. Vá em **"API keys"** no menu lateral
4. Clique em **"Create new secret key"**
5. Dê um nome (ex: "Amparo Production")
6. Copie a chave (ela só aparece uma vez!)

## Verificação

Após configurar, a aplicação deve:
- ✅ Conseguir fazer chamadas à API da OpenAI
- ✅ Gerar conteúdo personalizado no Dashboard
- ✅ Gerar conteúdo nos módulos da Jornada
- ✅ Responder no Chat com IA

## Nota de Segurança

⚠️ **NUNCA** commite a chave da API no Git!
- A chave já está no `.gitignore`
- Use apenas variáveis de ambiente no Netlify
- Para desenvolvimento local, use o arquivo `.env` (que não é commitado)
