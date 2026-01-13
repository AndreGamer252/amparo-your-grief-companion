import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAmparo } from '@/context/AmparoContext';
import type { LossType } from '@/types/amparo';
import { Textarea } from '@/components/ui/textarea';

const lossOptions: { value: LossType; label: string }[] = [
  { value: 'mae', label: 'Mãe' },
  { value: 'pai', label: 'Pai' },
  { value: 'filho_filha', label: 'Filho(a)' },
  { value: 'esposo_esposa', label: 'Esposo(a)' },
  { value: 'irmao_irma', label: 'Irmão(ã)' },
  { value: 'avo', label: 'Avô/Avó' },
  { value: 'amigo', label: 'Amigo(a)' },
  { value: 'outro', label: 'Outro' },
];

const timeOptions = [
  'Menos de 1 mês',
  '1 a 3 meses',
  '3 a 6 meses',
  '6 meses a 1 ano',
  '1 a 2 anos',
  'Mais de 2 anos',
];

export function Onboarding() {
  const { setUser } = useAmparo();
  const [step, setStep] = useState(1);
  
  // Step 1: Nome
  const [name, setName] = useState('');
  
  // Step 2: Quem perdeu
  const [lossType, setLossType] = useState<LossType | null>(null);
  const [customLossType, setCustomLossType] = useState('');
  
  // Step 3: Nome da pessoa
  const [lovedOneName, setLovedOneName] = useState('');
  
  // Step 4: Tempo desde a perda
  const [timeSinceLoss, setTimeSinceLoss] = useState('');
  
  // Step 5: Como era a relação
  const [relationshipDescription, setRelationshipDescription] = useState('');
  
  // Step 6: Sobre a pessoa
  const [lovedOneDescription, setLovedOneDescription] = useState('');
  
  // Step 7: Como está se sentindo
  const [currentFeelings, setCurrentFeelings] = useState('');

  const totalSteps = 7;

  const handleComplete = () => {
    if (name && lossType) {
      setUser({
        name,
        lossType,
        lovedOneName: lovedOneName.trim() || undefined,
        timeSinceLoss: timeSinceLoss || undefined,
        relationshipDescription: relationshipDescription.trim() || undefined,
        lovedOneDescription: lovedOneDescription.trim() || undefined,
        currentFeelings: currentFeelings.trim() || undefined,
        onboardingComplete: true,
      });
    }
  };

  const handleLossTypeChange = (value: LossType) => {
    setLossType(value);
    if (value !== 'outro') {
      setCustomLossType('');
    }
  };

  const canGoToNextStep = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0;
      case 2:
        return lossType !== null && (lossType !== 'outro' || customLossType.trim().length > 0);
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        return true; // Opcionais
      default:
        return false;
    }
  };

  const getRelationshipLabel = () => {
    const option = lossOptions.find(opt => opt.value === lossType);
    if (lossType === 'outro') return customLossType || 'essa pessoa';
    return option?.label.toLowerCase() || 'essa pessoa';
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
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Passo {step} de {totalSteps}</span>
                <span>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Nome */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
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
                      autoFocus
                    />
                  </div>

                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full"
                    disabled={!canGoToNextStep()}
                    onClick={() => setStep(2)}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Quem perdeu */}
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
                        onClick={() => handleLossTypeChange(option.value)}
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

                  <AnimatePresence>
                    {lossType === 'outro' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-medium text-foreground">
                          Quem você perdeu?
                        </label>
                        <input
                          type="text"
                          value={customLossType}
                          onChange={(e) => setCustomLossType(e.target.value)}
                          placeholder="Ex: primo, tia, namorado..."
                          className="w-full px-4 py-4 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      disabled={!canGoToNextStep()}
                      onClick={() => setStep(3)}
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Nome da pessoa */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Qual era o nome {getRelationshipLabel()}?
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Se preferir não compartilhar, pode pular esta pergunta.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={lovedOneName}
                      onChange={(e) => setLovedOneName(e.target.value)}
                      placeholder="Nome da pessoa"
                      className="w-full px-4 py-4 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(2)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      onClick={() => setStep(4)}
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Tempo desde a perda */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Há quanto tempo você perdeu {getRelationshipLabel()}?
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Isso me ajuda a entender melhor onde você está na sua jornada.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {timeOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setTimeSinceLoss(option)}
                        className={`w-full px-4 py-3 rounded-2xl text-sm font-medium transition-gentle text-left ${
                          timeSinceLoss === option
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(3)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      onClick={() => setStep(5)}
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Como era a relação */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Como era a relação entre vocês?
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Conte o que quiser sobre como era o relacionamento de vocês. Pode ser breve ou detalhado.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      value={relationshipDescription}
                      onChange={(e) => setRelationshipDescription(e.target.value)}
                      placeholder="Ex: Éramos muito próximos, sempre conversávamos sobre tudo. Ela era minha melhor amiga além de ser minha mãe..."
                      className="min-h-[120px] resize-none rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(4)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      onClick={() => setStep(6)}
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Sobre a pessoa */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Conte-me sobre {lovedOneName || getRelationshipLabel()}
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      O que você gostaria que eu soubesse sobre essa pessoa? Características, memórias especiais, o que você mais admirava...
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      value={lovedOneDescription}
                      onChange={(e) => setLovedOneDescription(e.target.value)}
                      placeholder="Ex: Ela era uma pessoa muito carinhosa, sempre sorrindo. Adorava cozinhar e fazer bolos para a família. Tinha um jeito especial de fazer todos se sentirem acolhidos..."
                      className="min-h-[140px] resize-none rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(5)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      onClick={() => setStep(7)}
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 7: Como está se sentindo */}
              {step === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Como você está se sentindo agora?
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Não precisa ser detalhado. Apenas o que você gostaria de compartilhar neste momento.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      value={currentFeelings}
                      onChange={(e) => setCurrentFeelings(e.target.value)}
                      placeholder="Ex: Estou me sentindo muito triste e confuso. Às vezes sinto raiva, outras vezes só quero chorar..."
                      className="min-h-[120px] resize-none rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(6)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      onClick={handleComplete}
                    >
                      Começar minha jornada
                      <ArrowRight className="w-4 h-4" />
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
