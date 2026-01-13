# 🔄 Como Funciona o Input e Output do Chat

Este documento explica detalhadamente como funciona o fluxo de comunicação entre o usuário e a IA no Amparo.

## 📊 Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO DIGITA MENSAGEM                   │
│              "Estou me sentindo muito triste"                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  1. INTERFACE (Chat.tsx)                                     │
│     • Captura o texto do input                               │
│     • Cria objeto ChatMessage                                │
│     • Adiciona mensagem ao estado local                      │
│     • Mostra mensagem na tela imediatamente                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. CONVERSÃO DE FORMATO (openai.ts)                         │
│     • Pega todas as mensagens anteriores                     │
│     • Converte formato da app → formato da API               │
│     • Formato App: { sender: 'user', content: '...' }        │
│     • Formato API: { role: 'user', content: '...' }         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. PREPARAÇÃO DO CONTEXTO (openai.ts)                       │
│     • Busca informações do usuário:                          │
│       - Nome: "Maria"                                         │
│       - Tipo de perda: "mae" (mãe)                           │
│       - Nome da pessoa perdida: (se informado)               │
│     • Gera prompt do sistema personalizado                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. MONTAGEM DA REQUISIÇÃO                                    │
│     {                                                         │
│       model: "gpt-4o-mini",                                  │
│       messages: [                                             │
│         {                                                     │
│           role: "system",                                    │
│           content: "Você é Amparo... [prompt personalizado]" │
│         },                                                    │
│         { role: "user", content: "Mensagem 1" },             │
│         { role: "assistant", content: "Resposta 1" },        │
│         { role: "user", content: "Mensagem atual" }          │
│       ],                                                      │
│       temperature: 0.7,                                      │
│       max_tokens: 500                                        │
│     }                                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  5. CHAMADA À API OPENAI                                      │
│     POST https://api.openai.com/v1/chat/completions          │
│     Headers:                                                  │
│       Authorization: Bearer sk-...                           │
│       Content-Type: application/json                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  6. PROCESSAMENTO PELA IA                                     │
│     • GPT-4o-mini analisa todo o contexto                    │
│     • Considera o prompt do sistema (personalizado)          │
│     • Analisa histórico de mensagens                         │
│     • Gera resposta empática e contextualizada               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  7. RESPOSTA DA API                                           │
│     {                                                         │
│       choices: [{                                             │
│         message: {                                           │
│           role: "assistant",                                  │
│           content: "Entendo sua tristeza..."                 │
│         }                                                     │
│       }]                                                      │
│     }                                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  8. PROCESSAMENTO DA RESPOSTA (openai.ts)                     │
│     • Extrai o conteúdo da resposta                           │
│     • Remove espaços em branco                                │
│     • Retorna string limpa                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  9. EXIBIÇÃO NA INTERFACE (Chat.tsx)                          │
│     • Cria objeto ChatMessage com a resposta                  │
│     • Adiciona ao estado de mensagens                        │
│     • Atualiza a UI automaticamente                           │
│     • Remove indicador de "digitando..."                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Detalhamento Técnico

### **INPUT (Entrada do Usuário)**

#### 1. Captura da Mensagem
```typescript
// Usuário digita no input
<input 
  value={input} 
  onChange={(e) => setInput(e.target.value)}
  placeholder="Escreva o que está sentindo..."
/>

// Ao submeter (Enter ou botão)
const sendMessage = async (content: string) => {
  // content = "Estou me sentindo muito triste"
}
```

#### 2. Criação do Objeto de Mensagem
```typescript
const userMessage: ChatMessage = {
  id: Date.now().toString(),        // ID único
  content: "Estou me sentindo...",  // Texto do usuário
  sender: 'user',                   // Remetente
  timestamp: new Date(),             // Data/hora
};
```

#### 3. Conversão para Formato da API
```typescript
// Formato da aplicação
{ sender: 'user', content: '...' }

// ↓ convertMessagesToAPIFormat()

// Formato da API OpenAI
{ role: 'user', content: '...' }
```

#### 4. Montagem do Contexto Completo
```typescript
const requestMessages = [
  // Prompt do sistema (sempre primeiro)
  {
    role: 'system',
    content: `Você é Amparo... [instruções personalizadas]`
  },
  
  // Histórico de mensagens anteriores
  { role: 'user', content: 'Mensagem 1' },
  { role: 'assistant', content: 'Resposta 1' },
  
  // Nova mensagem do usuário
  { role: 'user', content: 'Mensagem atual' }
];
```

### **OUTPUT (Resposta da IA)**

#### 1. Requisição HTTP
```typescript
POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer ${apiKey}
  Content-Type: application/json
Body:
  {
    model: "gpt-4o-mini",
    messages: [...],
    temperature: 0.7,
    max_tokens: 500
  }
```

#### 2. Resposta da API
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Entendo sua tristeza, Maria. É completamente normal sentir isso após perder sua mãe..."
    }
  }],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 80,
    "total_tokens": 230
  }
}
```

#### 3. Extração e Processamento
```typescript
const data = await response.json();
const assistantMessage = data.choices?.[0]?.message?.content;
// "Entendo sua tristeza, Maria..."

return assistantMessage.trim(); // Remove espaços extras
```

#### 4. Exibição na Interface
```typescript
const amparoMessage: ChatMessage = {
  id: (Date.now() + 1).toString(),
  content: response,              // Resposta da IA
  sender: 'amparo',               // Remetente
  timestamp: new Date(),
};

addMessage(amparoMessage); // Adiciona ao estado
// UI atualiza automaticamente via React
```

## 🎯 Personalização do Prompt

O prompt do sistema é **dinamicamente gerado** baseado no perfil do usuário:

```typescript
function getSystemPrompt(userContext) {
  // Exemplo para usuário que perdeu a mãe:
  return `
    Você é Amparo, uma assistente de IA especializada em acolhimento emocional.
    
    Contexto da pessoa:
    - Nome: Maria
    - Perdeu: mãe
    
    [Instruções específicas de como responder...]
  `;
}
```

Isso permite que a IA:
- Use o nome da pessoa nas respostas
- Entenda o contexto da perda
- Personalize o tom e abordagem

## 🔄 Estados do Chat

### Estados Visuais

1. **Input vazio**: Botão desabilitado
2. **Digitando**: Botão habilitado
3. **Enviando**: 
   - Mensagem do usuário aparece
   - Indicador "digitando..." aparece
   - Botão desabilitado
4. **Resposta recebida**:
   - Resposta da IA aparece
   - Indicador "digitando..." desaparece
   - Botão habilitado novamente
5. **Erro**:
   - Mensagem de erro aparece
   - Toast de notificação
   - Mensagem amigável da IA

## 📝 Formato dos Dados

### Formato Interno (Aplicação)
```typescript
interface ChatMessage {
  id: string;                    // "1234567890"
  content: string;                // "Estou triste"
  sender: 'user' | 'amparo';     // Quem enviou
  timestamp: Date;                // Data/hora
}
```

### Formato da API (OpenAI)
```typescript
interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

## 🛡️ Tratamento de Erros

### Possíveis Erros e Como São Tratados

1. **API Key não configurada**
   - Erro: "Chave da API OpenAI não configurada"
   - Solução: Verificar arquivo `.env`

2. **Chave inválida**
   - Erro: "Invalid API Key"
   - Solução: Verificar se a chave está correta

3. **Rate limit**
   - Erro: "Rate limit exceeded"
   - Solução: Aguardar e tentar novamente

4. **Erro de rede**
   - Erro: "Erro ao comunicar com a IA"
   - Solução: Verificar conexão

Todos os erros mostram:
- Mensagem de erro na interface
- Toast de notificação
- Mensagem amigável da IA para o usuário

## 💡 Otimizações Implementadas

1. **Mensagens aparecem imediatamente**: UX melhor
2. **Histórico completo enviado**: Contexto preservado
3. **Prompt personalizado**: Respostas mais relevantes
4. **Limite de tokens**: Controla custos (max_tokens: 500)
5. **Temperature 0.7**: Balanceia criatividade e consistência

## 🔐 Segurança

- ✅ Chave da API nunca exposta no código
- ✅ Variáveis de ambiente (.env) no .gitignore
- ✅ Requisições HTTPS para a API
- ✅ Validação de erros antes de exibir
