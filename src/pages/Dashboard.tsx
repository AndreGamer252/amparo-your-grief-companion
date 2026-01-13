import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudSun, Sun, Sparkles, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAmparo } from '@/context/AmparoContext';
import type { MoodLevel } from '@/types/amparo';

const moodIcons = [
  { level: 1 as MoodLevel, icon: Cloud, label: 'Muito difícil', color: 'text-muted-foreground' },
  { level: 2 as MoodLevel, icon: Cloud, label: 'Difícil', color: 'text-muted-foreground' },
  { level: 3 as MoodLevel, icon: CloudSun, label: 'Neutro', color: 'text-accent' },
  { level: 4 as MoodLevel, icon: Sun, label: 'Melhor', color: 'text-accent' },
  { level: 5 as MoodLevel, icon: Sparkles, label: 'Bom dia', color: 'text-primary' },
];

const dailyContent = {
  title: 'Para hoje',
  subtitle: 'Lidar com a saudade',
  content: 'A saudade é uma das expressões mais puras do amor. Quando sentimos falta de alguém, estamos honrando a importância que essa pessoa teve em nossa vida. Permita-se sentir.',
};

export function Dashboard() {
  const { user, todayMood, setTodayMood } = useAmparo();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(todayMood);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleMoodSelect = (level: MoodLevel) => {
    setSelectedMood(level);
    setTodayMood(level);
  };

  return (
    <AppLayout showTopBar={false}>
      <div className="px-4 lg:px-8 py-6 lg:py-10 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-1"
        >
          <p className="text-muted-foreground">{getGreeting()}</p>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
            {user?.name}, um passo de cada vez.
          </h1>
        </motion.div>

        {/* Mood Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="serenity">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-primary" />
                Como está seu coração hoje?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between gap-2">
                {moodIcons.map(({ level, icon: Icon, label, color }) => (
                  <button
                    key={level}
                    onClick={() => handleMoodSelect(level)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-gentle flex-1 ${
                      selectedMood === level
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'hover:bg-serenity-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${selectedMood === level ? 'text-primary-foreground' : color}`} />
                    <span className="text-xs font-medium hidden sm:block">{label}</span>
                  </button>
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

        {/* Daily Pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="feature">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">
                    {dailyContent.title}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {dailyContent.subtitle}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {dailyContent.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/chat">
            <Button variant="cta" size="xl" className="w-full group">
              <MessageCircle className="w-5 h-5" />
              Quero desabafar agora
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          <Link to="/memories">
            <Card variant="warmth" className="hover:shadow-soft transition-gentle cursor-pointer">
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 text-coral mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">2</p>
                <p className="text-xs text-muted-foreground">Memórias guardadas</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/journey">
            <Card variant="warmth" className="hover:shadow-soft transition-gentle cursor-pointer">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">3</p>
                <p className="text-xs text-muted-foreground">Lições disponíveis</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
}
