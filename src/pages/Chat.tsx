import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAmparo } from '@/context/AmparoContext';
import type { ChatMessage } from '@/types/amparo';

const conversationStarters = [
  'Estou me sentindo culpado',
  'Não consigo dormir',
  'Só queria conversar',
];

const amparoResponses = [
  'Entendo como você está se sentindo. O luto não é linear, e cada dia pode ser diferente. O que você sentiu hoje que te trouxe aqui?',
  'Obrigado por compartilhar isso comigo. É corajoso da sua parte falar sobre o que está sentindo. Você não precisa passar por isso sozinho.',
  'Estou aqui para te ouvir, sem julgamentos. Às vezes, só precisamos de alguém que escute. Me conte mais sobre o que está no seu coração.',
  'O que você está sentindo é completamente válido. A perda de alguém que amamos deixa marcas profundas. Como posso te ajudar neste momento?',
];

export function Chat() {
  const { messages, addMessage, user } = useAmparo();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = amparoResponses[Math.floor(Math.random() * amparoResponses.length)];
      const amparoMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: 'amparo',
        timestamp: new Date(),
      };
      addMessage(amparoMessage);
      setIsTyping(false);
    }, 2000);
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-serenity flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-serenity-600" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">IA Acolhedora</h2>
              <p className="text-xs text-muted-foreground">Sempre disponível para você</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
          {messages.length === 0 ? (
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
                {messages.map((message, index) => (
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
