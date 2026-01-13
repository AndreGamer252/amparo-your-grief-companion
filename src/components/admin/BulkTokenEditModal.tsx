import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setBulkTokenLimits } from '@/lib/admin';
import { toast } from 'sonner';

interface BulkTokenEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  selectedCount: number;
  onUpdate: () => void;
}

export function BulkTokenEditModal({ 
  isOpen, 
  onClose, 
  selectedUserIds, 
  selectedCount, 
  onUpdate 
}: BulkTokenEditModalProps) {
  const [tokenLimit, setTokenLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Nenhum usuário selecionado');
      return;
    }

    setIsSaving(true);
    try {
      const limit = tokenLimit && tokenLimit.trim() ? parseInt(tokenLimit) : 0;
      const result = await setBulkTokenLimits(selectedUserIds, limit);
      
      if (result.success > 0) {
        toast.success(`${result.success} usuário(s) atualizado(s) com sucesso!`);
        if (result.failed > 0) {
          toast.warning(`${result.failed} usuário(s) falharam ao atualizar`);
        }
        setTokenLimit('');
        onUpdate();
        onClose();
      } else {
        toast.error('Erro ao atualizar limites');
      }
    } catch (error) {
      toast.error('Erro ao atualizar limites');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edição em Massa de Tokens</CardTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-gentle"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-900">
                    <strong>{selectedCount}</strong> usuário(s) selecionado(s)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Limite de Tokens
                </label>
                <input
                  type="number"
                  value={tokenLimit}
                  onChange={(e) => setTokenLimit(e.target.value)}
                  placeholder="Ex: 100000 (deixe vazio para ilimitado)"
                  min="0"
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Defina um limite máximo de tokens para todos os usuários selecionados. Deixe vazio para tornar ilimitado.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="cta"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Aplicar a Todos'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
