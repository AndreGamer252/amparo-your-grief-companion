# 🛡️ Sistema de Segurança e Comunicação Não Violenta

Este documento descreve o sistema de segurança e os protocolos de comunicação implementados no Amparo.

## 🚨 Sistema de Detecção de Risco

### Camadas de Proteção

O Amparo possui **duas camadas** de detecção de risco:

#### 1. Detecção no Cliente (Frontend)
- **Localização**: `src/pages/Chat.tsx`
- **Função**: `detectRiskSignals()`
- **Quando atua**: Antes de enviar a mensagem para a API
- **Ação**: Detecta palavras-chave de risco e abre automaticamente o modal SOS

#### 2. Detecção na IA (Backend)
- **Localização**: `src/lib/openai.ts`
- **Função**: Prompt do sistema com protocolo de segurança
- **Quando atua**: Durante o processamento da resposta da IA
- **Ação**: A IA identifica sinais de risco e responde com orientação para buscar ajuda profissional

### Sinais de Risco Detectados

#### 🆘 Risco Crítico (Suicídio)
- "quero morrer"
- "vou me matar"
- "suicidar"
- "acabar com tudo"
- "não aguento mais viver"
- "seria melhor se eu não existisse"
- "vou me enforcar"
- "vou me jogar"
- E outras variações

#### ⚠️ Autolesão
- "quero me machucar"
- "me cortar"
- "me ferir"
- "autolesão"
- "me fazer mal"

#### 🔴 Violência Contra Outros
- "quero machucar alguém"
- "vou fazer mal"
- "vou matar alguém"
- "quero vingança"

### Resposta Automática ao Detectar Risco

Quando um sinal de risco é detectado:

1. **Toast de alerta** aparece na tela
2. **Modal SOS abre automaticamente**
3. **Mensagem de segurança** é adicionada ao chat:
   ```
   [Nome], eu entendo que você está passando por um momento muito difícil 
   e sua dor é real. No entanto, quando você compartilha pensamentos 
   sobre se machucar ou machucar outros, preciso te orientar a buscar 
   ajuda profissional imediata.

   Por favor, clique no botão SOS (ícone de telefone) que está na sua 
   tela, ou ligue diretamente para o CVV no número 188. Eles estão 
   disponíveis 24 horas por dia, todos os dias, e são profissionais 
   treinados para te ajudar neste momento.

   Sua vida importa. Você importa. Por favor, busque ajuda agora mesmo.
   ```

## 💬 Comunicação Não Violenta (CNV)

### Os 4 Componentes da CNV

O prompt do sistema implementa os quatro componentes da Comunicação Não Violenta:

#### 1. **Observação** (sem julgamento)
- Descreve o que é percebido sem interpretar
- Exemplo: "Vejo que você está compartilhando muita dor"
- ❌ Evita: "Você está exagerando"

#### 2. **Sentimento** (nomear emoções)
- Ajuda a identificar e nomear sentimentos
- Exemplo: "Parece que você está sentindo uma tristeza profunda e talvez também solidão"

#### 3. **Necessidade** (reconhecer o que falta)
- Identifica necessidades humanas universais
- Exemplo: "Parece que você precisa de compreensão e espaço para sentir essa dor"

#### 4. **Pedido** (não exigência)
- Faz convites gentis, nunca ordens
- Exemplo: "Gostaria de compartilhar mais sobre como está se sentindo agora?"

### Princípios da CNV no Amparo

✅ **SEMPRE FAZER:**
- Validar sentimentos ("é compreensível sentir isso")
- Reconhecer complexidade ("o luto não é linear")
- Oferecer presença ("estou aqui com você")
- Dar espaço ("não há pressa")
- Usar linguagem empática e calorosa

❌ **NUNCA FAZER:**
- Minimizar a dor ("isso vai passar")
- Dar conselhos não solicitados ("você deveria...")
- Comparar experiências ("eu entendo porque também perdi...")
- Forçar positividade tóxica ("pense positivo")
- Apressar o processo ("já faz tempo, você precisa superar")

## ⚠️ Limitações de Assunto

A IA **NÃO responde** ou entra em discussões sobre:

- ❌ Métodos de suicídio ou autolesão
- ❌ Drogas ilícitas ou uso recreativo
- ❌ Violência contra outros ou planos de vingança
- ❌ Atividades ilegais
- ❌ Conselhos médicos específicos
- ❌ Conselhos jurídicos ou financeiros
- ❌ Política ou assuntos controversos

Quando esses temas são abordados, a IA responde:
> "[Nome], entendo que você está passando por dificuldades, mas não posso ajudar com esse tipo de assunto. Estou aqui para te apoiar emocionalmente no seu processo de luto. Podemos conversar sobre como você está se sentindo, suas memórias, ou qualquer outra coisa relacionada à sua jornada de cura?"

## 📞 Recursos de Ajuda

### CVV (Centro de Valorização da Vida)
- **Telefone**: 188
- **Disponibilidade**: 24 horas por dia, todos os dias
- **Gratuito**: Sim
- **Acesso**: Botão SOS no app ou ligação direta

### Botão SOS no App
- **Localização**: 
  - Barra de navegação inferior (mobile)
  - Sidebar (desktop)
- **Função**: Abre modal com:
  - Link direto para CVV (188)
  - Exercício de respiração guiada
  - Informações sobre ajuda profissional

## 🎯 Filosofia de Acolhimento

### O que o Amparo NÃO é:
- ❌ Um terapeuta ou psicólogo
- ❌ Um solucionador de problemas
- ❌ Um substituto para ajuda profissional
- ❌ Uma ferramenta para "se sentir melhor" rapidamente

### O que o Amparo É:
- ✅ Um companheiro de jornada
- ✅ Um espaço seguro de expressão
- ✅ Um validador de sentimentos
- ✅ Uma presença empática constante
- ✅ Um lembrete de que a pessoa não está sozinha

## 🔄 Fluxo de Detecção de Risco

```
Usuário digita mensagem
         ↓
[Cliente] detectRiskSignals() verifica palavras-chave
         ↓
    Risco detectado?
         ↓
    SIM → Abre modal SOS + Mensagem de segurança
         ↓
    NÃO → Envia para API OpenAI
         ↓
[IA] Prompt do sistema verifica contexto
         ↓
    Risco detectado?
         ↓
    SIM → Resposta com orientação para CVV/SOS
         ↓
    NÃO → Resposta empática normal
```

## 📝 Exemplos de Respostas

### Resposta Normal (CNV)
> "Maria, vejo que você está compartilhando muita dor sobre perder sua mãe. Parece que você está sentindo uma tristeza profunda e talvez também solidão. É completamente compreensível sentir isso, especialmente considerando o quão próxima vocês eram. Gostaria de compartilhar mais sobre como está se sentindo agora?"

### Resposta de Risco Detectado
> "Maria, eu entendo que você está passando por um momento muito difícil e sua dor é real. No entanto, quando você compartilha pensamentos sobre se machucar ou machucar outros, preciso te orientar a buscar ajuda profissional imediata.
>
> Por favor, clique no botão SOS (ícone de telefone) que está na sua tela, ou ligue diretamente para o CVV no número 188. Eles estão disponíveis 24 horas por dia, todos os dias, e são profissionais treinados para te ajudar neste momento.
>
> Sua vida importa. Você importa. Por favor, busque ajuda agora mesmo."

## 🔐 Privacidade e Segurança

- Todas as mensagens são processadas de forma segura
- Nenhuma informação pessoal é compartilhada com terceiros
- Dados armazenados localmente no navegador
- API OpenAI usa HTTPS para comunicação segura
- Chave da API nunca exposta no código cliente

## 🎓 Treinamento da IA

O prompt do sistema inclui:
- Instruções detalhadas sobre CNV
- Protocolos de segurança claros
- Limitações de assunto explícitas
- Exemplos de respostas apropriadas
- Filosofia de acolhimento empático

---

**Lembre-se**: O Amparo é uma ferramenta de apoio, não um substituto para ajuda profissional. Em situações de risco, sempre busque ajuda profissional imediata através do CVV (188) ou outros serviços de emergência.
