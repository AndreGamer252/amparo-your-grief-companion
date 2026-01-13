import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Headphones, Activity, ChevronRight, Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import type { JourneyModule } from '@/types/amparo';

const modules: JourneyModule[] = [
  {
    id: '1',
    title: 'Entendendo a Dor',
    description: 'Compreender os estágios do luto pode ajudar você a se sentir menos perdido nessa jornada.',
    duration: '5 min de leitura',
    type: 'read',
    completed: true,
    content: 'O luto é uma resposta natural à perda. Não existe uma forma "certa" de sentir, e cada pessoa vive essa experiência de maneira única...',
  },
  {
    id: '2',
    title: 'O Significado do Luto',
    description: 'A dor que você sente é proporcional ao amor que existiu. Descubra como honrar esse amor.',
    duration: '8 min de áudio',
    type: 'listen',
    completed: false,
  },
  {
    id: '3',
    title: 'Lidando com Datas Especiais',
    description: 'Aniversários, feriados e datas marcantes podem ser especialmente difíceis. Aprenda a navegar esses momentos.',
    duration: '6 min de leitura',
    type: 'read',
    completed: false,
  },
  {
    id: '4',
    title: 'Cuidando de Si Mesmo',
    description: 'Exercícios práticos de autocuidado para os momentos mais difíceis da jornada.',
    duration: '10 min de exercício',
    type: 'exercise',
    completed: false,
  },
];

const typeIcons = {
  read: BookOpen,
  listen: Headphones,
  exercise: Activity,
};

const typeLabels = {
  read: 'Leitura',
  listen: 'Áudio',
  exercise: 'Exercício',
};

export function Journey() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const completedCount = modules.filter((m) => m.completed).length;
  const progress = (completedCount / modules.length) * 100;

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
            A Jornada
          </h1>
          <p className="text-muted-foreground mt-1">
            Passos gentis para entender e processar o luto
          </p>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="serenity">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Seu progresso</span>
                <span className="text-sm text-primary font-semibold">
                  {completedCount} de {modules.length}
                </span>
              </div>
              <div className="h-2 bg-serenity-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((module, index) => {
            const Icon = typeIcons[module.type];
            const isExpanded = expandedModule === module.id;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Card
                  variant={module.completed ? 'warmth' : 'feature'}
                  className="overflow-hidden cursor-pointer"
                  onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        module.completed
                          ? 'bg-primary/20'
                          : 'bg-serenity-100'
                      }`}>
                        {module.completed ? (
                          <Check className="w-6 h-6 text-primary" />
                        ) : (
                          <Icon className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-display font-semibold ${
                            module.completed ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {module.title}
                          </h3>
                          <ChevronRight className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {typeLabels[module.type]}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {module.duration}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                          {module.description}
                        </p>

                        {isExpanded && module.content && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-border/50"
                          >
                            <p className="text-sm text-foreground leading-relaxed">
                              {module.content}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
