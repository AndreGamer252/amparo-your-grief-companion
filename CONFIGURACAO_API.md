# Configuração da API OpenAI

Este guia explica como configurar a integração com a API da OpenAI (GPT-4o-mini) para o Amparo.

## 📋 Pré-requisitos

1. Uma conta na OpenAI (https://platform.openai.com/)
2. Uma chave de API válida

## 🔑 Como obter sua chave de API

1. Acesse https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI
3. Clique em "Create new secret key"
4. Dê um nome para a chave (ex: "Amparo App")
5. Copie a chave gerada (ela só será mostrada uma vez!)

## ⚙️ Configuração

### 1. Criar arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
VITE_OPENAI_API_KEY=sk-sua-chave-api-aqui
```

**⚠️ IMPORTANTE:** Substitua `sk-sua-chave-api-aqui` pela sua chave real da OpenAI.

### 2. Estrutura do arquivo `.env`

```
amparo-your-grief-companion/
├── .env                 ← Crie este arquivo
├── .env.example         ← Exemplo (não contém chaves reais)
├── package.json
├── src/
└── ...
```

### 3. Adicionar ao .gitignore

Certifique-se de que o arquivo `.env` está no `.gitignore` para não commitar sua chave:

```gitignore
# Environment variables
.env
.env.local
.env.production
```

## 🚀 Como funciona

### Modelo usado
- **GPT-4o-mini**: Modelo mais econômico e rápido da OpenAI, ideal para conversas de suporte emocional

### Personalização
O sistema usa informações do perfil do usuário para personalizar as respostas:
- Nome da pessoa
- Tipo de perda (mãe, pai, filho(a), etc.)
- Nome da pessoa que foi perdida (se informado)

### Prompt do Sistema
O Amparo é configurado com um prompt especializado em:
- Acolhimento emocional
- Suporte durante o luto
- Escuta ativa e empática
- Validação de sentimentos
- Espaço seguro sem julgamentos

## 💰 Custos

O GPT-4o-mini é um modelo econômico:
- **Input**: ~$0.15 por 1M tokens
- **Output**: ~$0.60 por 1M tokens

Uma conversa típica custa aproximadamente **$0.001-0.005** (menos de 1 centavo).

## 🔒 Segurança

1. **Nunca commite** o arquivo `.env` no Git
2. **Nunca compartilhe** sua chave de API publicamente
3. **Monitore** o uso da API no dashboard da OpenAI
4. **Configure limites** de uso na OpenAI se necessário

## 🐛 Solução de Problemas

### Erro: "Chave da API OpenAI não configurada"

**Solução:**
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Verifique se a variável está escrita corretamente: `VITE_OPENAI_API_KEY`
3. Reinicie o servidor de desenvolvimento após criar/modificar o `.env`

### Erro: "Invalid API Key"

**Solução:**
1. Verifique se copiou a chave completa (começa com `sk-`)
2. Verifique se não há espaços extras antes/depois da chave
3. Gere uma nova chave na OpenAI se necessário

### Erro: "Rate limit exceeded"

**Solução:**
1. Você atingiu o limite de requisições
2. Aguarde alguns minutos e tente novamente
3. Considere fazer upgrade do plano na OpenAI

### Respostas muito lentas

**Solução:**
1. O GPT-4o-mini é rápido, mas pode haver latência de rede
2. Verifique sua conexão com a internet
3. Se persistir, pode ser um problema temporário da OpenAI

## 📚 Recursos Adicionais

- [Documentação da API OpenAI](https://platform.openai.com/docs)
- [Dashboard da OpenAI](https://platform.openai.com/)
- [Preços da OpenAI](https://openai.com/pricing)

## 🆘 Suporte

Se tiver problemas com a configuração, verifique:
1. Se o arquivo `.env` está na raiz do projeto
2. Se a variável de ambiente está correta
3. Se reiniciou o servidor após criar o `.env`
4. Se sua chave de API está ativa na OpenAI
