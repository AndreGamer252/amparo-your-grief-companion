/**
 * Serviço para gerar conteúdo personalizado do Dashboard usando IA
 */

import { chatWithAmparo } from './openai';
import type { UserProfile, MoodLevel } from '@/types/amparo';

export interface DailyInsight {
  title: string;
  content: string;
  type: 'reflection' | 'exercise' | 'reminder' | 'encouragement';
}

export interface PersonalizedQuote {
  quote: string;
  author?: string;
}

/**
 * Gera um insight diário personalizado usando IA
 */
export async function generateDailyInsight(
  user: UserProfile,
  mood?: MoodLevel | null
): Promise<DailyInsight> {
  const moodDescriptions: Record<MoodLevel, string> = {
    1: 'muito difícil',
    2: 'difícil',
    3: 'neutro',
    4: 'melhor',
    5: 'bom dia',
  };

  const moodContext = mood ? `O usuário está se sentindo ${moodDescriptions[mood]} hoje.` : '';

  const prompt = `Gere um insight diário breve e empático (máximo 2 frases) para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}. ${moodContext}

O insight deve ser:
- Breve (máximo 2 frases)
- Empático e acolhedor
- Relevante para o momento atual
- Não genérico, mas personalizado

Responda APENAS com o texto do insight, sem formatação ou explicações.`;

  try {
    const response = await chatWithAmparo(
      [{ role: 'user', content: prompt }],
      {
        name: user.name,
        lossType: user.lossType,
        lovedOneName: user.lovedOneName,
      }
    );

    return {
      title: 'Para hoje',
      content: response.content,
      type: 'reflection',
    };
  } catch (error) {
    // Fallback se a IA falhar
    return {
      title: 'Para hoje',
      content: 'Permita-se sentir o que precisar sentir. Cada emoção é válida e parte do seu processo de cura.',
      type: 'reflection',
    };
  }
}

/**
 * Gera uma citação personalizada usando IA
 */
export async function generatePersonalizedQuote(
  user: UserProfile,
  mood?: MoodLevel | null
): Promise<PersonalizedQuote> {
  const prompt = `Gere uma citação breve e inspiradora (1 frase) sobre luto e amor, personalizada para alguém que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

A citação deve ser:
- Breve (1 frase)
- Inspiradora mas realista
- Sobre amor, memória ou luto
- Não genérica

Responda APENAS com a citação, sem aspas ou formatação.`;

  try {
    const response = await chatWithAmparo(
      [{ role: 'user', content: prompt }],
      {
        name: user.name,
        lossType: user.lossType,
        lovedOneName: user.lovedOneName,
      }
    );

    return {
      quote: response.content,
    };
  } catch (error) {
    return {
      quote: 'O amor não termina com a morte; ele apenas encontra novas formas de existir.',
    };
  }
}

/**
 * Gera uma sugestão de ação baseada no contexto
 */
export async function generateActionSuggestion(
  user: UserProfile,
  mood?: MoodLevel | null,
  hasRecentMessages?: boolean,
  hasRecentMemories?: boolean
): Promise<string> {
  const context = [];
  if (mood && mood <= 2) {
    context.push('O usuário está se sentindo muito difícil hoje');
  }
  if (!hasRecentMessages) {
    context.push('O usuário não conversou recentemente');
  }
  if (!hasRecentMemories) {
    context.push('O usuário não registrou memórias recentemente');
  }

  const prompt = `Gere uma sugestão breve e gentil (1 frase) de ação para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

Contexto: ${context.join('. ') || 'Dia normal'}

A sugestão deve ser:
- Breve (1 frase)
- Gentil e não impositiva
- Uma sugestão de ação concreta (ex: "Que tal escrever uma carta?", "Gostaria de conversar sobre como está se sentindo?")
- Não genérica

Responda APENAS com a sugestão, sem formatação.`;

  try {
    const response = await chatWithAmparo(
      [{ role: 'user', content: prompt }],
      {
        name: user.name,
        lossType: user.lossType,
        lovedOneName: user.lovedOneName,
      }
    );

    return response.content;
  } catch (error) {
    return 'Que tal conversarmos sobre como você está se sentindo hoje?';
  }
}

function getLossTypeLabel(lossType: string): string {
  const labels: Record<string, string> = {
    mae: 'a mãe',
    pai: 'o pai',
    filho_filha: 'o(a) filho(a)',
    esposo_esposa: 'o(a) esposo(a)',
    irmao_irma: 'o(a) irmão(ã)',
    avo: 'o(a) avô/avó',
    amigo: 'o(a) amigo(a)',
    outro: 'alguém especial',
  };
  return labels[lossType] || 'alguém especial';
}

/**
 * Obtém módulos concluídos da jornada no mês atual
 */
function getJourneyModulesCompletedThisMonth(): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  let count = 0;
  
  // Itera sobre todas as chaves do localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('journey_module_')) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.completed && data.completedAt) {
            const completedDate = new Date(data.completedAt);
            completedDate.setHours(0, 0, 0, 0);
            if (completedDate >= startOfMonth) {
              count++;
            }
          }
        }
      } catch {
        // Ignora erros de parsing
      }
    }
  }
  
  return count;
}

/**
 * Calcula estatísticas do usuário
 */
export function calculateUserStats(
  memories: Array<{ createdAt: Date }>,
  messages: Array<{ timestamp: Date }>,
  checkIns: Array<{ date: string }>
) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Calcula o início do mês atual
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const recentMemories = memories.filter(
    (m) => new Date(m.createdAt) >= weekAgo
  ).length;

  const recentMessages = messages.filter(
    (m) => new Date(m.timestamp) >= weekAgo
  ).length;

  // Conta check-ins de humor do mês
  const moodCheckInsThisMonth = checkIns.filter((c) => {
    const checkInDate = new Date(c.date);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate >= startOfMonth;
  }).length;

  // Conta módulos concluídos da jornada no mês
  const journeyModulesThisMonth = getJourneyModulesCompletedThisMonth();

  // Check-ins totais = check-ins de humor + módulos concluídos
  const checkInsThisMonth = moodCheckInsThisMonth + journeyModulesThisMonth;

  const streak = calculateStreak(checkIns);

  return {
    totalMemories: memories.length,
    recentMemories,
    totalMessages: messages.length,
    recentMessages,
    checkInsThisMonth,
    streak,
  };
}

/**
 * Calcula a sequência de check-ins consecutivos
 */
function calculateStreak(checkIns: Array<{ date: string }>): number {
  if (checkIns.length === 0) return 0;

  const sorted = [...checkIns]
    .map((c) => new Date(c.date))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const checkInDate = new Date(sorted[i]);
    checkInDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (
      checkInDate.getTime() === expectedDate.getTime() ||
      (i === 0 && checkInDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000)
    ) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
