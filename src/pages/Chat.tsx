import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAmparo } from '@/context/AmparoContext';
import type { ChatMessage } from '@/types/amparo';
import { chatWithAmparo, convertMessagesToAPIFormat } from '@/lib/openai';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Detecta sinais de risco na mensagem do usuário
 * Retorna true se detectar risco crítico
 */
function detectRiskSignals(message: string): boolean {
  const riskKeywords = [
    // Suicídio
    'quero morrer', 'querer morrer', 'vou me matar', 'me matar', 'suicidar', 'suicídio',
    'acabar com tudo', 'acabar com a vida', 'não aguento mais viver', 'não vale a pena viver',
    'seria melhor se eu não existisse', 'não quero mais viver', 'prefiro estar morto',
    'vou me enforcar', 'vou me jogar', 'pular da ponte', 'tomar remédio demais',
    // Autolesão
    'quero me machucar', 'me machucar', 'me cortar', 'me ferir', 'me fazer mal',
    'autolesão', 'auto-lesão', 'me cortar', 'me queimar', 'me bater',
    // Violência contra outros
    'quero machucar', 'vou fazer mal', 'vou matar alguém', 'quero vingança',
    'vou me vingar', 'quero fazer sofrer',
  ];

  const lowerMessage = message.toLowerCase();
  return riskKeywords.some(keyword => lowerMessage.includes(keyword));
}

const conversationStarters = [
  'Estou me sentindo culpado',
  'Não consigo dormir',
  'Só queria conversar',
];

export function Chat() {
  const { messages, addMessage, user, setSosOpen, authUser, activeConversationId, setActiveConversationId, startNewConversation } = useAmparo();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = useMemo(() => {
    const byId = new Map<string, { id: string; firstAt: Date; lastAt: Date; preview: string }>();
    for (const m of messages) {
      const id = m.conversationId || 'legacy';
      const existing = byId.get(id);
      if (!existing) {
        byId.set(id, { id, firstAt: m.timestamp, lastAt: m.timestamp, preview: m.content });
      } else {
        if (m.timestamp < existing.firstAt) existing.firstAt = m.timestamp;
        if (m.timestamp > existing.lastAt) {
          existing.lastAt = m.timestamp;
          existing.preview = m.content;
        }
      }
    }
    return Array.from(byId.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  }, [messages]);

  const currentMessages = useMemo(() => {
    const currentId = activeConversationId || 'legacy';
    return messages.filter((m) => (m.conversationId || 'legacy') === currentId);
  }, [messages, activeConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Validação de tamanho da mensagem
    if (content.length > 2000) {
      toast.error('Mensagem muito longa', {
        description: 'Por favor, limite sua mensagem a 2000 caracteres.',
      });
      return;
    }

    // Detecção de risco antes de enviar
    if (detectRiskSignals(content)) {
      toast.warning('Precisamos conversar sobre isso', {
        description: 'Por favor, clique no botão SOS para buscar ajuda profissional.',
        duration: 5000,
      });
      
      // Abre o modal SOS
      setSosOpen(true);
      
      // Adiciona mensagem do usuário
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };
      await addMessage(userMessage);
      
      // Adiciona resposta de segurança
      const safetyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `${user?.name || 'Amigo(a)'}, eu entendo que você está passando por um momento muito difícil e sua dor é real. No entanto, quando você compartilha pensamentos sobre se machucar ou machucar outros, preciso te orientar a buscar ajuda profissional imediata.\n\nPor favor, clique no botão SOS (ícone de telefone) que está na sua tela, ou ligue diretamente para o CVV no número 188. Eles estão disponíveis 24 horas por dia, todos os dias, e são profissionais treinados para te ajudar neste momento.\n\nSua vida importa. Você importa. Por favor, busque ajuda agora mesmo.`,
        sender: 'amparo',
        timestamp: new Date(),
      };
      await addMessage(safetyMessage);
      setInput('');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
      await addMessage(userMessage);
      setInput('');
      setIsTyping(true);
    setError(null);

    try {
      // Converte mensagens para o formato da API
      const apiMessages = convertMessagesToAPIFormat(currentMessages);

      // Adiciona a nova mensagem do usuário
      apiMessages.push({
        role: 'user',
        content,
      });

      // Chama a API da OpenAI
      const response = await chatWithAmparo(apiMessages, {
        name: user?.name,
        lossType: user?.lossType,
        lovedOneName: user?.lovedOneName,
        timeSinceLoss: user?.timeSinceLoss,
        relationshipDescription: user?.relationshipDescription,
        lovedOneDescription: user?.lovedOneDescription,
        currentFeelings: user?.currentFeelings,
        userId: authUser?.id,
      });

      const amparoMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'amparo',
        timestamp: new Date(),
      };
      // Salva mensagem com tokens
      await addMessage(amparoMessage, {
        prompt_tokens: response.tokensUsed?.prompt_tokens || 0,
        completion_tokens: response.tokensUsed?.completion_tokens || 0,
        total_tokens: response.tokensUsed?.total_tokens || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao comunicar com a IA';
      
      // Mensagem mais amigável para erro de API key não configurada
      if (errorMessage.includes('VITE_OPENAI_API_KEY')) {
        setError('A chave da API não está configurada. Entre em contato com o suporte.');
        toast.error('Serviço temporariamente indisponível', {
          description: 'O serviço de IA está sendo configurado. Tente novamente em alguns instantes.',
          duration: 5000,
        });
      } else {
        setError(errorMessage);
        toast.error('Erro ao enviar mensagem', {
          description: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        });
      }

      // Adiciona uma mensagem de erro amigável
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, estou tendo dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.',
        sender: 'amparo',
        timestamp: new Date(),
      };
      await addMessage(errorResponse);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-180px)] lg:h-[calc(100vh-80px)] max-w-2xl mx-auto">
        {/* Chat Header */}
        <div className="px-4 lg:px-6 py-4 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-serenity flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-serenity-600" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-foreground">IA Acolhedora</h2>
                <p className="text-xs text-muted-foreground">Sempre disponível para você</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {conversations.length > 0 && (
                <div className="hidden sm:block">
                  <Select
                    value={activeConversationId || 'legacy'}
                    onValueChange={(v) => setActiveConversationId(v)}
                  >
                    <SelectTrigger className="h-9 w-[220px] rounded-2xl">
                      <SelectValue placeholder="Escolher conversa" />
                    </SelectTrigger>
                    <SelectContent>
                      {conversations.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.id === 'legacy'
                            ? 'Histórico anterior'
                            : `Conversa • ${c.lastAt.toLocaleDateString()}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startNewConversation()}
                className="rounded-2xl"
              >
                <Plus className="w-4 h-4" />
                Nova conversa
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Erro de conexão</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {currentMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 rounded-3xl bg-serenity flex items-center justify-center animate-float">
                <Sparkles className="w-10 h-10 text-serenity-600" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Olá, {user?.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Estou aqui para te ouvir. Você pode me contar qualquer coisa, no seu tempo.
                </p>
              </div>

              {/* Conversation Starters */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {conversationStarters.map((starter) => (
                  <Button
                    key={starter}
                    variant="chip"
                    onClick={() => sendMessage(starter)}
                    className="text-sm"
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence>
                {currentMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-3xl ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-lg'
                          : 'bg-serenity-100 text-foreground rounded-bl-lg'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-serenity-100 px-4 py-3 rounded-3xl rounded-bl-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 lg:px-6 py-4 border-t border-border/50 bg-card/50">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva o que está sentindo..."
                className="w-full px-5 py-4 rounded-3xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground pr-12"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-gentle"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <Button
              type="submit"
              variant="cta"
              size="icon-lg"
              disabled={!input.trim()}
              className="shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
