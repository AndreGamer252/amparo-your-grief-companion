import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  CloudSun, 
  Sun, 
  Sparkles, 
  Heart, 
  MessageCircle, 
  ArrowRight,
  BookOpen,
  TrendingUp,
  Calendar,
  Quote,
  Lightbulb,
  Zap,
  Flower2,
  Clock,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAmparo } from '@/context/AmparoContext';
import type { MoodLevel } from '@/types/amparo';
import { 
  generateDailyInsight, 
  generatePersonalizedQuote, 
  generateActionSuggestion,
  calculateUserStats,
  type DailyInsight,
  type PersonalizedQuote,
} from '@/lib/dashboard';
import { toast } from 'sonner';

const moodIcons = [
  { level: 1 as MoodLevel, icon: Cloud, label: 'Muito difícil', color: 'text-muted-foreground' },
  { level: 2 as MoodLevel, icon: Cloud, label: 'Difícil', color: 'text-muted-foreground' },
  { level: 3 as MoodLevel, icon: CloudSun, label: 'Neutro', color: 'text-accent' },
  { level: 4 as MoodLevel, icon: Sun, label: 'Melhor', color: 'text-accent' },
  { level: 5 as MoodLevel, icon: Sparkles, label: 'Bom dia', color: 'text-primary' },
];

export function Dashboard() {
  const { user, todayMood, setTodayMood, memories, messages, checkIns, addCheckIn, updateCheckIn, authUser } = useAmparo();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(todayMood);
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [quote, setQuote] = useState<PersonalizedQuote | null>(null);
  const [actionSuggestion, setActionSuggestion] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [stats, setStats] = useState({ totalMemories: 0, recentMemories: 0, totalMessages: 0, recentMessages: 0, checkInsThisMonth: 0, streak: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const calculatedStats = await calculateUserStats(memories, messages, checkIns, authUser?.id);
      setStats(calculatedStats);
    };
    loadStats();
  }, [memories, messages, checkIns, authUser?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getTimeSinceLoss = () => {
    if (!user?.timeSinceLoss) return null;
    return user.timeSinceLoss;
  };

  const handleMoodSelect = (level: MoodLevel) => {
    setSelectedMood(level);
    setTodayMood(level);
    
    // Cria um check-in para hoje se ainda não existir
    const today = new Date().toISOString().split('T')[0];
    const todayCheckIn = checkIns.find(c => c.date === today);
    
    if (!todayCheckIn) {
      addCheckIn({
        date: today,
        mood: level,
      });
    } else {
      // Atualiza o check-in existente de hoje
      updateCheckIn(today, level);
    }
    
    // Recarrega insights quando o humor muda
    if (user) {
      loadPersonalizedContent(level);
    }
  };

  const loadPersonalizedContent = async (mood?: MoodLevel | null) => {
    if (!user) return;

    // Carrega insight diário
    setIsLoadingInsight(true);
    try {
      const insight = await generateDailyInsight(user, mood || selectedMood);
      setDailyInsight(insight);
    } catch (error) {
      console.error('Erro ao carregar insight:', error);
    } finally {
      setIsLoadingInsight(false);
    }

    // Carrega citação personalizada
    setIsLoadingQuote(true);
    try {
      const personalizedQuote = await generatePersonalizedQuote(user, mood || selectedMood);
      setQuote(personalizedQuote);
    } catch (error) {
      console.error('Erro ao carregar citação:', error);
    } finally {
      setIsLoadingQuote(false);
    }

    // Carrega sugestão de ação
    setIsLoadingSuggestion(true);
    try {
      const suggestion = await generateActionSuggestion(
        user,
        mood || selectedMood,
        stats.recentMessages > 0,
        stats.recentMemories > 0
      );
      setActionSuggestion(suggestion);
    } catch (error) {
      console.error('Erro ao carregar sugestão:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPersonalizedContent();
    }
  }, [user]);

  if (!user) return null;

  return (
    <AppLayout showTopBar={false}>
      <div className="px-4 lg:px-8 py-6 lg:py-10 space-y-6 max-w-4xl mx-auto">
        {/* Header Personalizado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-3"
        >
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
              {user.name}, um passo de cada vez.
            </h1>
            {user.lovedOneName && (
              <p className="text-muted-foreground mt-2 text-sm">
                Lembrando de <span className="font-medium text-foreground">{user.lovedOneName}</span>
                {getTimeSinceLoss() && ` • ${getTimeSinceLoss()}`}
              </p>
            )}
          </div>
        </motion.div>

        {/* Mood Tracker Melhorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="serenity" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-serenity-50/50 to-transparent" />
            <CardHeader className="pb-4 relative">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-primary animate-pulse-soft" />
                Como está seu coração hoje?
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex justify-between gap-2">
                {moodIcons.map(({ level, icon: Icon, label, color }) => (
                  <motion.button
                    key={level}
                    onClick={() => handleMoodSelect(level)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-gentle flex-1 ${
                      selectedMood === level
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'hover:bg-serenity-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${selectedMood === level ? 'text-primary-foreground' : color}`} />
                    <span className="text-xs font-medium hidden sm:block">{label}</span>
                  </motion.button>
                ))}
              </div>
              {selectedMood && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-muted-foreground mt-4 text-center"
                >
                  Obrigado por compartilhar. Estou aqui com você.
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Grid de Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Conteúdo Personalizado */}
          <div className="lg:col-span-2 space-y-6">
            {/* Insight Diário com IA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card variant="feature" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      {isLoadingInsight ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="w-6 h-6 text-primary" />
                        </motion.div>
                      ) : (
                        <Lightbulb className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-xs font-medium text-primary uppercase tracking-wide">
                        {dailyInsight?.title || 'Para hoje'}
                      </p>
                      {isLoadingInsight ? (
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed">
                          {dailyInsight?.content || 'Carregando...'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Citação Personalizada */}
            {quote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card variant="warmth" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-warmth-50/50 to-transparent" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <Quote className="w-8 h-8 text-coral shrink-0" />
                      <div className="space-y-2 flex-1">
                        <p className="text-sm italic text-foreground leading-relaxed">
                          "{quote.quote}"
                        </p>
                        {quote.author && (
                          <p className="text-xs text-muted-foreground">— {quote.author}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Sugestão de Ação */}
            {actionSuggestion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card variant="elevated" className="border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6 text-accent" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <p className="text-xs font-medium text-primary uppercase tracking-wide">
                          Sugestão para você
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {actionSuggestion}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* CTA Principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link to="/chat">
                <Button variant="cta" size="xl" className="w-full group">
                  <MessageCircle className="w-5 h-5" />
                  Quero desabafar agora
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Sidebar - Estatísticas e Ações Rápidas */}
          <div className="space-y-6">
            {/* Estatísticas Pessoais */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Sua Jornada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-coral" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {stats.totalMemories} memórias
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stats.recentMemories} esta semana
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {stats.totalMessages} conversas
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stats.recentMessages} esta semana
                        </p>
                      </div>
                    </div>
                  </div>

                  {stats.streak > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <Flower2 className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {stats.streak} dias seguidos
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sequência de check-ins
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Ações Rápidas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-3"
            >
              <Link to="/memories">
                <Card variant="warmth" className="hover:shadow-soft transition-gentle cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-coral/10 flex items-center justify-center group-hover:bg-coral/20 transition-gentle">
                        <Heart className="w-5 h-5 text-coral" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Memórias</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.totalMemories} guardadas
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/journey">
                <Card variant="serenity" className="hover:shadow-soft transition-gentle cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-gentle">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">A Jornada</p>
                        <p className="text-xs text-muted-foreground">
                          Continue aprendendo
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Card de Inspiração */}
            {user.lovedOneDescription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card variant="glass" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <CardContent className="p-6 relative">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          Sobre {user.lovedOneName || 'ela'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {user.lovedOneDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Cards de Ação Rápida Inferiores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Link to="/memories">
            <Card variant="warmth" className="hover:shadow-soft transition-gentle cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <Heart className="w-10 h-10 text-coral mx-auto mb-3" />
                <p className="font-display font-semibold text-foreground text-xl mb-1">
                  {stats.totalMemories}
                </p>
                <p className="text-xs text-muted-foreground">Memórias guardadas</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/journey">
            <Card variant="serenity" className="hover:shadow-soft transition-gentle cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="font-display font-semibold text-foreground text-xl mb-1">
                  {stats.checkInsThisMonth}
                </p>
                <p className="text-xs text-muted-foreground">Atividades concluídas este mês</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/chat">
            <Card variant="feature" className="hover:shadow-elevated transition-gentle cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                <p className="font-display font-semibold text-foreground text-xl mb-1">
                  {stats.totalMessages}
                </p>
                <p className="text-xs text-muted-foreground">Conversas com Amparo</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
}
