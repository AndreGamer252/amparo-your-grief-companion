import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Heart } from 'lucide-react';
import { useAmparo } from '@/context/AmparoContext';
import { Button } from '@/components/ui/button';

export function SosModal() {
  const { sosOpen, setSosOpen } = useAmparo();
  const [showBreathing, setShowBreathing] = useState(false);

  if (!sosOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setSosOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="bg-card rounded-3xl p-8 max-w-md w-full shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          {!showBreathing ? (
            <div className="text-center space-y-6">
              <button
                onClick={() => setSosOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-gentle"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-full bg-serenity-100 flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary animate-pulse-soft" />
              </div>

              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                  Você não está sozinho
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estamos aqui com você. Se precisar de ajuda profissional, não hesite em ligar.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:188"
                  className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-3xl bg-coral text-white font-semibold hover:bg-coral/90 transition-gentle shadow-soft"
                >
                  <Phone className="w-5 h-5" />
                  Ligar para o CVV (188)
                </a>

                <Button
                  variant="serenity"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowBreathing(true)}
                >
                  Exercício de Respiração Guiada
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                O CVV oferece apoio emocional gratuito 24 horas por dia.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <button
                onClick={() => setShowBreathing(false)}
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-gentle"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <h2 className="font-display text-xl font-semibold text-foreground">
                Respire comigo
              </h2>

              <p className="text-muted-foreground text-sm">
                Inspire quando o círculo crescer, expire quando diminuir.
              </p>

              <div className="flex items-center justify-center py-8">
                <motion.div
                  className="w-32 h-32 rounded-full bg-serenity flex items-center justify-center"
                  animate={{
                    scale: [1, 1.4, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <motion.span
                    className="text-serenity-600 font-display font-semibold"
                    animate={{
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <motion.span
                      animate={{
                        opacity: [1, 0, 0, 1],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        times: [0, 0.25, 0.75, 1],
                      }}
                    >
                      Expire
                    </motion.span>
                  </motion.span>
                </motion.div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setShowBreathing(false);
                  setSosOpen(false);
                }}
              >
                Estou me sentindo melhor
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
