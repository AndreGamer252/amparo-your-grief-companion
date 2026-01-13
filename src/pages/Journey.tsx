import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Activity, 
  ChevronRight, 
  Check, 
  Clock,
  Sparkles,
  Heart,
  Target,
  Lightbulb,
  ArrowRight,
  X,
  Loader2,
  PenTool,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAmparo } from '@/context/AmparoContext';
import type { JourneyModule } from '@/types/amparo';
import {
  generateModuleContent,
  generateExercises,
  generateReflectionQuestions,
  saveModuleProgress,
  getModuleProgress,
  getAllModulesProgress,
} from '@/lib/journey';
import { toast } from 'sonner';

interface JourneyModuleWithContent extends JourneyModule {
  content?: string;
  exercises?: string[];
  reflectionQuestions?: string[];
  isLoading?: boolean;
}

const baseModules: JourneyModule[] = [
  {
    id: '1',
    title: 'Entendendo a Dor',
    description: 'Compreender os estágios do luto pode ajudar você a se sentir menos perdido nessa jornada.',
    duration: '5 min',
    type: 'read',
    completed: false,
  },
  {
    id: '2',
    title: 'O Significado do Luto',
    description: 'A dor que você sente é proporcional ao amor que existiu. Descubra como honrar esse amor.',
    duration: '8 min',
    type: 'read',
    completed: false,
  },
  {
    id: '3',
    title: 'Lidando com Datas Especiais',
    description: 'Aniversários, feriados e datas marcantes podem ser especialmente difíceis. Aprenda a navegar esses momentos.',
    duration: '6 min',
    type: 'read',
    completed: false,
  },
  {
    id: '4',
    title: 'Cuidando de Si Mesmo',
    description: 'Exercícios práticos de autocuidado para os momentos mais difíceis da jornada.',
    duration: '10 min',
    type: 'exercise',
    completed: false,
  },
  {
    id: '5',
    title: 'Memórias e Lembranças',
    description: 'Como honrar e preservar as memórias da pessoa que você perdeu de forma significativa.',
    duration: '7 min',
    type: 'read',
    completed: false,
  },
  {
    id: '6',
    title: 'Encontrando Significado',
    description: 'Explorar como encontrar propósito e significado após a perda, no seu próprio tempo.',
    duration: '9 min',
    type: 'read',
    completed: false,
  },
];

const typeIcons = {
  read: BookOpen,
  exercise: Activity,
};

const typeLabels = {
  read: 'Leitura',
  exercise: 'Exercício',
};

export function Journey() {
  const { user, authUser } = useAmparo();
  const [modules, setModules] = useState<JourneyModuleWithContent[]>(baseModules);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Carrega progresso salvo
    const savedProgress = getAllModulesProgress();
    setProgress(savedProgress);
    
    // Atualiza módulos com progresso
    setModules(prev => prev.map(m => ({
      ...m,
      completed: savedProgress[m.id] || false,
    })));
  }, []);

  const completedCount = modules.filter((m) => m.completed).length;
  const progressPercent = (completedCount / modules.length) * 100;

  const handleModuleClick = async (module: JourneyModuleWithContent) => {
    if (expandedModule === module.id) {
      setExpandedModule(null);
      return;
    }

    setExpandedModule(module.id);

    // Se o conteúdo já foi carregado, não carrega novamente
    if (module.content) return;

    if (!user) {
      toast.error('Erro ao carregar conteúdo');
      return;
    }

    // Marca como carregando
    setModules(prev => prev.map(m => 
      m.id === module.id ? { ...m, isLoading: true } : m
    ));

    try {
      // Carrega conteúdo, exercícios e perguntas em paralelo
      const [content, exercises, reflectionQuestions] = await Promise.all([
        generateModuleContent(module.id, module.title, user, authUser?.id),
        module.type === 'exercise' 
          ? generateExercises(module.id, module.title, user, authUser?.id)
          : Promise.resolve([]),
        generateReflectionQuestions(module.id, module.title, user, authUser?.id),
      ]);

      setModules(prev => prev.map(m => 
        m.id === module.id 
          ? { 
              ...m, 
              content, 
              exercises,
              reflectionQuestions,
              isLoading: false 
            } 
          : m
      ));
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
      toast.error('Erro ao carregar conteúdo. Tente novamente.');
      setModules(prev => prev.map(m => 
        m.id === module.id ? { ...m, isLoading: false } : m
      ));
    }
  };

  const handleCompleteModule = (moduleId: string) => {
    saveModuleProgress(moduleId, true);
    setProgress(prev => ({ ...prev, [moduleId]: true }));
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, completed: true } : m
    ));
    toast.success('Módulo concluído! Parabéns pelo seu progresso.');
  };

  const handleUncompleteModule = (moduleId: string) => {
    saveModuleProgress(moduleId, false);
    setProgress(prev => ({ ...prev, [moduleId]: false }));
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, completed: false } : m
    ));
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-4xl mx-auto space-y-6">
        {/* Header com Gradiente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-serenity-50 to-warmth-50 p-8 border border-primary/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-warmth-100/50 rounded-full -ml-24 -mb-24" />
          <div className="relative space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
                A Jornada
              </h1>
            </div>
            <p className="text-muted-foreground text-sm lg:text-base max-w-2xl">
              Passos gentis e personalizados para entender e processar o luto, criados especialmente para você.
            </p>
          </div>
        </motion.div>

        {/* Progress Card Melhorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Seu progresso</p>
                  <p className="text-2xl font-bold text-primary">
                    {completedCount} de {modules.length} módulos
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full relative"
                  >
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          '0 0 0px rgba(59, 130, 246, 0)',
                          '0 0 20px rgba(59, 130, 246, 0.5)',
                          '0 0 0px rgba(59, 130, 246, 0)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                    />
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {Math.round(progressPercent)}% completo
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modules List Melhorada */}
        <div className="space-y-4">
          {modules.map((module, index) => {
            const Icon = typeIcons[module.type];
            const isExpanded = expandedModule === module.id;
            const isLoading = module.isLoading;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Card
                  variant={module.completed ? 'warmth' : 'feature'}
                  className={`overflow-hidden transition-all ${
                    isExpanded ? 'shadow-elevated' : 'hover:shadow-soft cursor-pointer'
                  }`}
                  onClick={() => !isExpanded && handleModuleClick(module)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        module.completed
                          ? 'bg-primary/20 scale-110'
                          : 'bg-serenity-100'
                      }`}>
                        {module.completed ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                          >
                            <Check className="w-7 h-7 text-primary" />
                          </motion.div>
                        ) : (
                          <Icon className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className={`font-display text-lg font-semibold ${
                              module.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}>
                              {module.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                {typeLabels[module.type]}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {module.duration}
                              </span>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          </motion.div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {module.description}
                        </p>

                        {/* Conteúdo Expandido */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-6 pt-6 border-t border-border/50 space-y-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Loading State */}
                              {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                  <div className="text-center space-y-3">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                                    <p className="text-sm text-muted-foreground">
                                      Gerando conteúdo personalizado para você...
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Conteúdo Principal */}
                              {!isLoading && module.content && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-primary">
                                    <Lightbulb className="w-5 h-5" />
                                    <span className="text-sm font-medium">Conteúdo</span>
                                  </div>
                                  <div className="prose prose-sm max-w-none">
                                    {module.content.split('\n\n').map((paragraph, idx) => (
                                      <p key={idx} className="text-sm text-foreground leading-relaxed mb-4">
                                        {paragraph}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Exercícios */}
                              {!isLoading && module.exercises && module.exercises.length > 0 && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-accent">
                                    <Activity className="w-5 h-5" />
                                    <span className="text-sm font-medium">Exercícios Práticos</span>
                                  </div>
                                  <div className="space-y-3">
                                    {module.exercises.map((exercise, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border/50"
                                      >
                                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                                          <span className="text-xs font-semibold text-accent">{idx + 1}</span>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed flex-1">
                                          {exercise}
                                        </p>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Perguntas de Reflexão */}
                              {!isLoading && module.reflectionQuestions && module.reflectionQuestions.length > 0 && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-primary">
                                    <Brain className="w-5 h-5" />
                                    <span className="text-sm font-medium">Perguntas para Reflexão</span>
                                  </div>
                                  <div className="space-y-3">
                                    {module.reflectionQuestions.map((question, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-4 rounded-2xl bg-primary/5 border border-primary/10"
                                      >
                                        <div className="flex items-start gap-3">
                                          <PenTool className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                          <p className="text-sm text-foreground leading-relaxed italic">
                                            {question}
                                          </p>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Botões de Ação */}
                              {!isLoading && (
                                <div className="flex gap-3 pt-4 border-t border-border/50">
                                  <Button
                                    variant="outline"
                                    onClick={() => setExpandedModule(null)}
                                    className="flex-1"
                                  >
                                    <X className="w-4 h-4" />
                                    Fechar
                                  </Button>
                                  {module.completed ? (
                                    <Button
                                      variant="outline"
                                      onClick={() => handleUncompleteModule(module.id)}
                                      className="flex-1"
                                    >
                                      <Check className="w-4 h-4" />
                                      Marcar como não concluído
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="cta"
                                      onClick={() => handleCompleteModule(module.id)}
                                      className="flex-1"
                                    >
                                      <Check className="w-4 h-4" />
                                      Marcar como concluído
                                    </Button>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Card de Inspiração Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card variant="glass" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-serenity-50/50 to-warmth-50/50" />
            <CardContent className="p-6 relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Lembre-se: não há pressa
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Cada módulo foi criado especialmente para você. Vá no seu próprio ritmo, sem pressão. 
                    Esta jornada é sua, e você está fazendo o melhor que pode.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
