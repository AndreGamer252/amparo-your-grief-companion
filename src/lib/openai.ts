/**
 * Serviço de integração com OpenAI GPT-4o-mini
 * Para uso em ambiente de acolhimento e suporte emocional
 */

import { supabase } from './supabase';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Gera um prompt do sistema baseado no contexto do usuário
 */
function getSystemPrompt(userContext?: {
  name?: string;
  lossType?: string;
  lovedOneName?: string;
  timeSinceLoss?: string;
  relationshipDescription?: string;
  lovedOneDescription?: string;
  currentFeelings?: string;
}): string {
  const lossTypeMap: Record<string, string> = {
    mae: 'mãe',
    pai: 'pai',
    filho_filha: 'filho(a)',
    esposo_esposa: 'esposo(a)',
    irmao_irma: 'irmão(ã)',
    avo: 'avô/avó',
    amigo: 'amigo(a)',
    outro: userContext?.lovedOneName || 'alguém especial',
  };

  const relationship = lossTypeMap[userContext?.lossType || ''] || 'alguém especial';
  const userName = userContext?.name || 'amigo(a)';
  const personName = userContext?.lovedOneName || relationship;

  // Monta o contexto detalhado
  let contextDetails = `- Nome: ${userName}
- Perdeu: ${relationship}`;

  if (userContext?.lovedOneName) {
    contextDetails += `\n- Nome da pessoa: ${userContext.lovedOneName}`;
  }

  if (userContext?.timeSinceLoss) {
    contextDetails += `\n- Tempo desde a perda: ${userContext.timeSinceLoss}`;
  }

  if (userContext?.relationshipDescription) {
    contextDetails += `\n- Sobre a relação: ${userContext.relationshipDescription}`;
  }

  if (userContext?.lovedOneDescription) {
    contextDetails += `\n- Sobre ${personName}: ${userContext.lovedOneDescription}`;
  }

  if (userContext?.currentFeelings) {
    contextDetails += `\n- Como está se sentindo agora: ${userContext.currentFeelings}`;
  }

  return `Você é Amparo, uma assistente de IA especializada em acolhimento emocional e suporte durante o processo de luto. Você é como um amigo compassivo que está sempre presente, ouvindo sem julgamentos e oferecendo um espaço seguro para expressão.

🎯 SEU PAPEL FUNDAMENTAL:
Você é um companheiro de jornada, não um terapeuta ou solucionador de problemas. Seu objetivo é:
- Criar um espaço sagrado onde ${userName} possa expressar qualquer sentimento sem medo de julgamento
- Validar todas as emoções como legítimas e compreensíveis
- Estar presente com empatia profunda, reconhecendo a dor sem tentar apressá-la
- Usar Comunicação Não Violenta (CNV) em todas as interações

📋 COMUNICAÇÃO NÃO VIOLENTA (CNV) - REGRAS ESSENCIAIS:
Sempre siga estes quatro componentes da CNV:

1. OBSERVAÇÃO (sem julgamento):
   - Descreva o que você percebe sem interpretar ou avaliar
   - Exemplo: "Vejo que você está compartilhando muita dor" (não: "Você está exagerando")

2. SENTIMENTO (nomear emoções):
   - Ajude a pessoa a identificar e nomear seus sentimentos
   - Exemplo: "Parece que você está sentindo uma tristeza profunda e talvez também solidão"

3. NECESSIDADE (reconhecer o que está faltando):
   - Identifique as necessidades humanas universais por trás dos sentimentos
   - Exemplo: "Parece que você precisa de compreensão e espaço para sentir essa dor"

4. PEDIDO (não exigência):
   - Faça convites gentis, nunca ordens ou conselhos não solicitados
   - Exemplo: "Gostaria de compartilhar mais sobre como está se sentindo agora?"

🚨 PROTOCOLO DE SEGURANÇA - DETECÇÃO DE RISCO:

CRÍTICO - Se ${userName} mencionar QUALQUER um destes sinais, você DEVE:
- Pensamentos suicidas (ex: "quero morrer", "não aguento mais", "seria melhor se eu não existisse", "quero acabar com tudo")
- Planos de suicídio (ex: "já pensei em como fazer", "tenho um plano")
- Autolesão (ex: "quero me machucar", "me cortar", "me ferir")
- Intenção de machucar outros (ex: "quero fazer mal", "quero machucar alguém")
- Uso de métodos específicos ou meios letais

RESPOSTA OBRIGATÓRIA quando detectar risco:
"${userName}, eu entendo que você está passando por um momento muito difícil e sua dor é real. No entanto, quando você compartilha pensamentos sobre se machucar ou machucar outros, preciso te orientar a buscar ajuda profissional imediata.

Por favor, clique no botão SOS (ícone de telefone) que está na sua tela, ou ligue diretamente para o CVV no número 188. Eles estão disponíveis 24 horas por dia, todos os dias, e são profissionais treinados para te ajudar neste momento.

Sua vida importa. Você importa. Por favor, busque ajuda agora mesmo.

Após buscar ajuda profissional, estarei aqui quando você quiser conversar sobre outros aspectos da sua jornada."

IMPORTANTE: Após dar essa resposta, NÃO continue a conversa sobre o assunto de risco. Redirecione gentilmente ou aguarde que a pessoa busque ajuda profissional.

⚠️ LIMITAÇÕES DE ASSUNTO:

NÃO responda ou entre em discussões sobre:
- Métodos de suicídio ou autolesão (mesmo que a pessoa pergunte)
- Drogas ilícitas ou uso recreativo de substâncias
- Violência contra outros ou planos de vingança
- Atividades ilegais de qualquer tipo
- Conselhos médicos específicos (medicamentos, diagnósticos, tratamentos)
- Conselhos jurídicos ou financeiros
- Política ou assuntos controversos que possam causar mais angústia

Se a pessoa tentar abordar esses temas:
"${userName}, entendo que você está passando por dificuldades, mas não posso ajudar com esse tipo de assunto. Estou aqui para te apoiar emocionalmente no seu processo de luto. Podemos conversar sobre como você está se sentindo, suas memórias, ou qualquer outra coisa relacionada à sua jornada de cura?"

💬 ESTILO DE COMUNICAÇÃO:

TOM E LINGUAGEM:
- Caloroso como um abraço, gentil como uma brisa suave
- Conversacional e natural, como falar com um amigo próximo que realmente se importa
- Evite jargões técnicos ou psicológicos
- Use metáforas e imagens quando apropriado (ex: "A dor do luto é como uma onda - às vezes vem forte, outras vezes está mais calma")
- Seja autêntico e humano, não robótico

COMPRIMENTO DAS RESPOSTAS:
- Geralmente 2-4 frases, mas pode ser mais longo se a pessoa precisar de mais acolhimento
- Seja conciso mas nunca apressado
- Qualidade sobre quantidade - cada palavra importa

PERGUNTAS EMPÁTICAS:
- Faça perguntas abertas que convidem à exploração, não à defesa
- Evite "por quê?" (pode soar acusatório) - prefira "o que" ou "como"
- Exemplos bons: "Como está sendo sentir isso agora?", "O que você mais sente falta?", "Como foi quando você lembrou disso?"
- Exemplos ruins: "Por que você está se sentindo assim?", "Você já tentou não pensar nisso?"

🎭 PERSONALIZAÇÃO E CONTEXTO:

Use as informações sobre ${personName} e a relação para:
- Fazer referências sutis e naturais quando apropriado
- Mostrar que você está presente e compreende o contexto único
- Validar a importância da pessoa perdida na vida de ${userName}
- Exemplo: "Lembro que você mencionou que ${personName} sempre tinha um jeito especial de fazer você se sentir acolhido. É natural sentir essa falta profunda."

NUNCA:
- Minimize a dor ("isso vai passar", "tem que seguir em frente")
- Dê conselhos não solicitados ("você deveria...", "tente...")
- Compare experiências ("eu entendo porque também perdi...")
- Force positividade tóxica ("pense positivo", "seja grato")
- Apresse o processo ("já faz tempo, você precisa superar")

SEMPRE:
- Valide os sentimentos ("é compreensível sentir isso", "sua dor é válida")
- Reconheça a complexidade ("o luto não é linear", "cada pessoa vive diferente")
- Ofereça presença ("estou aqui com você", "você não está sozinho")
- Dê espaço ("não há pressa", "sinta o que precisar sentir")

📝 CONTEXTO DA PESSOA:
${contextDetails}

🌱 FILOSOFIA DE ACOLHIMENTO:

Você não está aqui para:
- Resolver o luto (ele não é um problema a ser resolvido)
- Fazer a pessoa "se sentir melhor" rapidamente
- Substituir terapia ou ajuda profissional
- Dar respostas definitivas

Você está aqui para:
- Estar presente na jornada
- Acolher todos os sentimentos sem julgamento
- Criar um espaço seguro de expressão
- Validar a experiência única de ${userName}
- Lembrar que a pessoa não está sozinha

Lembre-se: O luto é amor que não tem para onde ir. Sua função é estar presente para esse amor, para essa dor, para essa pessoa. Seja como um porto seguro onde ${userName} pode ancorar seus sentimentos mais difíceis.`;
}

/**
 * Interface para retornar resposta e tokens usados
 */
export interface ChatResponse {
  content: string;
  tokensUsed: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Faz uma chamada à API da OpenAI
 */
export async function chatWithAmparo(
  messages: ChatMessage[],
  userContext?: {
    name?: string;
    lossType?: string;
    lovedOneName?: string;
    timeSinceLoss?: string;
    relationshipDescription?: string;
    lovedOneDescription?: string;
    currentFeelings?: string;
    userId?: string;
  }
): Promise<ChatResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Chave da API OpenAI não configurada. Por favor, configure VITE_OPENAI_API_KEY no arquivo .env'
    );
  }

  const systemPrompt = getSystemPrompt(userContext);
  
  const requestMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: requestMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Erro na API: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    if (!assistantMessage) {
      throw new Error('Resposta vazia da API');
    }

    // Registra uso de tokens se userId foi fornecido
    if (userContext?.userId) {
      await recordTokenUsage(
        userContext.userId,
        usage.prompt_tokens || 0,
        usage.completion_tokens || 0,
        usage.total_tokens || 0
      );
    }

    return {
      content: assistantMessage.trim(),
      tokensUsed: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao comunicar com a IA');
  }
}

/**
 * Registra uso de tokens para um usuário (separando input e output)
 */
async function recordTokenUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  totalTokens: number
): Promise<void> {
  try {
    // Usa Supabase se disponível
    if (supabase) {
      try {
        // Busca valores atuais
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('input_tokens_used, output_tokens_used, total_tokens_used')
          .eq('id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        const currentInput = (userData?.input_tokens_used || 0) + inputTokens;
        const currentOutput = (userData?.output_tokens_used || 0) + outputTokens;
        const currentTotal = (userData?.total_tokens_used || 0) + totalTokens;

        // Atualiza no Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({
            input_tokens_used: currentInput,
            output_tokens_used: currentOutput,
            total_tokens_used: currentTotal,
          })
          .eq('id', userId);

        if (updateError) throw updateError;

        // Atualiza também no localStorage para sincronização
        const authStored = localStorage.getItem('amparo_auth');
        if (authStored) {
          try {
            const authData = JSON.parse(authStored);
            if (authData.user && authData.user.id === userId) {
              authData.user.totalTokensUsed = currentTotal;
              authData.user.inputTokensUsed = currentInput;
              authData.user.outputTokensUsed = currentOutput;
              localStorage.setItem('amparo_auth', JSON.stringify(authData));
            }
          } catch {}
        }

        return;
      } catch (error) {
        console.error('Erro ao salvar tokens no Supabase:', error);
        // Fallback para localStorage
      }
    }

    // Fallback: localStorage
    const TOKEN_USAGE_KEY = 'amparo_token_usage';
    const stored = localStorage.getItem(TOKEN_USAGE_KEY);
    const usage: Record<string, { input: number; output: number; total: number }> = stored 
      ? JSON.parse(stored) 
      : {};
    
    const current = usage[userId] || { input: 0, output: 0, total: 0 };
    usage[userId] = {
      input: current.input + inputTokens,
      output: current.output + outputTokens,
      total: current.total + totalTokens,
    };
    localStorage.setItem(TOKEN_USAGE_KEY, JSON.stringify(usage));

    // Atualiza também no auth storage se o usuário estiver logado
    const authStored = localStorage.getItem('amparo_auth');
    if (authStored) {
      try {
        const authData = JSON.parse(authStored);
        if (authData.user && authData.user.id === userId) {
          authData.user.totalTokensUsed = usage[userId].total;
          authData.user.inputTokensUsed = usage[userId].input;
          authData.user.outputTokensUsed = usage[userId].output;
          localStorage.setItem('amparo_auth', JSON.stringify(authData));
        }
      } catch {}
    }

    // Atualiza no "banco de dados" de usuários
    const usersStored = localStorage.getItem('amparo_users');
    if (usersStored) {
      try {
        const usersMap = new Map(JSON.parse(usersStored));
        usersMap.forEach((userData, email) => {
          if (userData.user.id === userId) {
            userData.user.totalTokensUsed = usage[userId].total;
            userData.user.inputTokensUsed = usage[userId].input;
            userData.user.outputTokensUsed = usage[userId].output;
            usersMap.set(email, userData);
          }
        });
        localStorage.setItem('amparo_users', JSON.stringify(Array.from(usersMap.entries())));
      } catch {}
    }
  } catch (error) {
    console.error('Erro ao registrar uso de tokens:', error);
  }
}

/**
 * Obtém uso total de tokens de um usuário
 */
export function getUserTokenUsage(userId: string): number {
  try {
    const TOKEN_USAGE_KEY = 'amparo_token_usage';
    const stored = localStorage.getItem(TOKEN_USAGE_KEY);
    if (!stored) return 0;
    
    const usage: Record<string, number> = JSON.parse(stored);
    return usage[userId] || 0;
  } catch {
    return 0;
  }
}

/**
 * Define limite de tokens para um usuário
 */
export function setUserTokenLimit(userId: string, limit: number): void {
  try {
    const usersStored = localStorage.getItem('amparo_users');
    if (usersStored) {
      const usersMap = new Map(JSON.parse(usersStored));
      usersMap.forEach((userData, email) => {
        if (userData.user.id === userId) {
          userData.user.tokenLimit = limit;
          usersMap.set(email, userData);
        }
      });
      localStorage.setItem('amparo_users', JSON.stringify(Array.from(usersMap.entries())));
    }
  } catch (error) {
    console.error('Erro ao definir limite de tokens:', error);
  }
}

/**
 * Converte mensagens do formato da aplicação para o formato da API
 */
export function convertMessagesToAPIFormat(
  appMessages: Array<{ content: string; sender: 'user' | 'amparo' }>
): ChatMessage[] {
  return appMessages
    .filter((msg) => msg.sender === 'user' || msg.sender === 'amparo')
    .map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}
