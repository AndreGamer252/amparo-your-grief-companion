/**
 * Serviço para gerenciar módulos da jornada e gerar conteúdo com IA
 */

import { chatWithAmparo } from './openai';
import type { UserProfile } from '@/types/amparo';
import { supabase } from './supabase';

export interface JourneyModuleContent {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'read' | 'exercise';
  completed: boolean;
  content?: string;
  exercises?: string[];
  reflectionQuestions?: string[];
}

/**
 * Gera conteúdo personalizado para um módulo da jornada
 */
export async function generateModuleContent(
  moduleId: string,
  moduleTitle: string,
  user: UserProfile,
  userId?: string
): Promise<string> {
  const prompts: Record<string, string> = {
    '1': `Crie um conteúdo empático e acolhedor (3-4 parágrafos) sobre "Entendendo a Dor" do luto, personalizado para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

O conteúdo deve:
- Explicar que o luto é natural e único para cada pessoa
- Validar todas as emoções
- Ser empático e acolhedor
- Não ser genérico, mas personalizado
- Usar linguagem calorosa e compreensiva

Responda APENAS com o conteúdo, sem formatação ou explicações.`,

    '2': `Crie um conteúdo empático (3-4 parágrafos) sobre "O Significado do Luto" e como a dor é proporcional ao amor, personalizado para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

O conteúdo deve:
- Explicar que a dor reflete o amor que existiu
- Honrar a importância da pessoa perdida
- Ser reconfortante mas realista
- Personalizado e não genérico

Responda APENAS com o conteúdo.`,

    '3': `Crie um conteúdo prático e empático (3-4 parágrafos) sobre "Lidando com Datas Especiais" (aniversários, feriados, datas marcantes), personalizado para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

O conteúdo deve:
- Oferecer estratégias práticas
- Validar a dificuldade dessas datas
- Ser acolhedor e não impositivo
- Personalizado

Responda APENAS com o conteúdo.`,

    '4': `Crie um conteúdo prático (3-4 parágrafos) sobre "Cuidando de Si Mesmo" durante o luto, com exercícios de autocuidado, personalizado para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

O conteúdo deve:
- Oferecer exercícios práticos de autocuidado
- Ser gentil e não impositivo
- Reconhecer que autocuidado pode ser difícil
- Personalizado

Responda APENAS com o conteúdo.`,

    '5': `Crie um conteúdo empático (3-4 parágrafos) sobre "Memórias e Lembranças" - como honrar e preservar memórias, personalizado para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

O conteúdo deve:
- Falar sobre a importância das memórias
- Oferecer formas de honrar a pessoa
- Ser reconfortante
- Personalizado

Responda APENAS com o conteúdo.`,

    '6': `Crie um conteúdo empático (3-4 parágrafos) sobre "Encontrando Significado" após a perda, personalizado para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

O conteúdo deve:
- Falar sobre encontrar propósito após a perda
- Não forçar positividade tóxica
- Ser realista mas esperançoso
- Personalizado

Responda APENAS com o conteúdo.`,
  };

  const prompt = prompts[moduleId] || prompts['1'];

  try {
    const response = await chatWithAmparo(
      [{ role: 'user', content: prompt }],
      {
        name: user.name,
        lossType: user.lossType,
        lovedOneName: user.lovedOneName,
        userId: userId,
      }
    );

    return response.content;
  } catch (error) {
    // Fallback content
    return 'O luto é uma jornada única e pessoal. Cada pessoa vive essa experiência de maneira diferente, e todas as emoções que você sente são válidas e compreensíveis. Permita-se sentir o que precisar sentir, no seu próprio tempo.';
  }
}

/**
 * Gera exercícios práticos para um módulo
 */
export async function generateExercises(
  moduleId: string,
  moduleTitle: string,
  user: UserProfile,
  userId?: string
): Promise<string[]> {
  const prompt = `Gere 3 exercícios práticos e gentis (cada um em 1 frase) sobre "${moduleTitle}" para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

Os exercícios devem ser:
- Práticos e acionáveis
- Gentis e não impositivos
- Apropriados para o contexto de luto
- Personalizados

Responda APENAS com os 3 exercícios, um por linha, sem numeração ou formatação.`;

  try {
    const response = await chatWithAmparo(
      [{ role: 'user', content: prompt }],
      {
        name: user.name,
        lossType: user.lossType,
        lovedOneName: user.lovedOneName,
        userId: userId,
      }
    );

    // Divide o conteúdo em linhas e filtra vazias
    return response.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/))
      .slice(0, 3);
  } catch (error) {
    return [
      'Reserve alguns minutos para respirar profundamente e estar presente com seus sentimentos.',
      'Escreva uma carta para a pessoa que você perdeu, expressando o que sente.',
      'Lembre-se de uma memória especial e permita-se sentir a emoção que ela traz.',
    ];
  }
}

/**
 * Gera perguntas de reflexão
 */
export async function generateReflectionQuestions(
  moduleId: string,
  moduleTitle: string,
  user: UserProfile,
  userId?: string
): Promise<string[]> {
  const prompt = `Gere 2 perguntas de reflexão empáticas e abertas (cada uma em 1 frase) sobre "${moduleTitle}" para ${user.name} que perdeu ${getLossTypeLabel(user.lossType)}${user.lovedOneName ? ` chamado(a) ${user.lovedOneName}` : ''}.

As perguntas devem ser:
- Abertas (não sim/não)
- Empáticas e acolhedoras
- Que convidem à reflexão profunda
- Personalizadas

Responda APENAS com as 2 perguntas, uma por linha, sem numeração ou formatação.`;

  try {
    const response = await chatWithAmparo(
      [{ role: 'user', content: prompt }],
      {
        name: user.name,
        lossType: user.lossType,
        lovedOneName: user.lovedOneName,
        userId: userId,
      }
    );

    return response.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/))
      .slice(0, 2);
  } catch (error) {
    return [
      'Como você está se sentindo sobre essa experiência?',
      'O que você gostaria de explorar mais sobre isso?',
    ];
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
 * Salva progresso de um módulo
 */
export async function saveModuleProgress(
  moduleId: string,
  completed: boolean,
  userId?: string
): Promise<void> {
  if (!userId || !supabase) {
    throw new Error('Usuário não autenticado ou Supabase não configurado');
  }

  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    let completedAt: string | null = null;
    if (completed) {
      if (existing?.completed_at) {
        // Mantém a data original se já existe
        completedAt = existing.completed_at;
      } else {
        // Cria nova data se está marcando como concluído pela primeira vez
        completedAt = new Date().toISOString();
      }
    }

    if (existing) {
      // Atualiza
      const { error } = await supabase
        .from('journey_progress')
        .update({
          completed,
          completed_at: completedAt,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insere novo
      const { error } = await supabase
        .from('journey_progress')
        .insert({
          user_id: userId,
          module_id: moduleId,
          completed,
          completed_at: completedAt,
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error('Erro ao salvar progresso da jornada:', error);
    throw error;
  }
}

/**
 * Obtém progresso de um módulo
 */
export async function getModuleProgress(moduleId: string, userId?: string): Promise<boolean> {
  if (!userId || !supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('journey_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data?.completed || false;
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return false;
  }
}

/**
 * Obtém todos os módulos com progresso
 */
export async function getAllModulesProgress(userId?: string): Promise<Record<string, boolean>> {
  const progress: Record<string, boolean> = {};

  if (!userId || !supabase) {
    return progress;
  }

  try {
    const { data, error } = await supabase
      .from('journey_progress')
      .select('module_id, completed')
      .eq('user_id', userId);

    if (!error && data) {
      data.forEach((item) => {
        progress[item.module_id] = item.completed;
      });
    }
    return progress;
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return progress;
  }
}
