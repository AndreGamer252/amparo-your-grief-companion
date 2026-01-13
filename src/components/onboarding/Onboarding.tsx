import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAmparo } from '@/context/AmparoContext';
import type { LossType } from '@/types/amparo';

const lossOptions: { value: LossType; label: string }[] = [
  { value: 'mae', label: 'Mãe' },
  { value: 'pai', label: 'Pai' },
  { value: 'filho', label: 'Filho' },
  { value: 'filha', label: 'Filha' },
  { value: 'esposo', label: 'Esposo' },
  { value: 'esposa', label: 'Esposa' },
  { value: 'avo', label: 'Avô/Avó' },
  { value: 'amigo', label: 'Amigo(a)' },
  { value: 'outro', label: 'Outro' },
];

export function Onboarding() {
  const { setUser } = useAmparo();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [lossType, setLossType] = useState<LossType | null>(null);

  const handleComplete = () => {
    if (name && lossType) {
      setUser({
        name,
        lossType,
        onboardingComplete: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-warmth flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <Card variant="elevated" className="overflow-hidden">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Logo */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-serenity flex items-center justify-center animate-breathe">
                      <Heart className="w-8 h-8 text-serenity-600" />
                    </div>
                    <div>
                      <h1 className="font-display text-2xl font-semibold text-foreground">
                        Bem-vindo ao Amparo
                      </h1>
                      <p className="text-muted-foreground mt-2 leading-relaxed">
                        Olá, sinto muito que você esteja aqui, mas fico feliz em poder ajudar.
                      </p>
                    </div>
                  </div>

                  {/* Name input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Como posso te chamar?
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full px-4 py-4 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full"
                    disabled={!name.trim()}
                    onClick={() => setStep(2)}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Quem você perdeu, {name}?
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Isso me ajuda a personalizar nosso acolhimento para você.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {lossOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLossType(option.value)}
                        className={`px-3 py-3 rounded-2xl text-sm font-medium transition-gentle ${
                          lossType === option.value
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      disabled={!lossType}
                      onClick={handleComplete}
                    >
                      Começar minha jornada
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Suas informações são privadas e seguras.
        </p>
      </motion.div>
    </div>
  );
}
