import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Lock, CreditCard, Eye, EyeOff, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateUserProfile, changeUserPassword, updateUserSubscription, setUserTokenLimit, resetUserTokens, formatTokens, formatCost } from '@/lib/admin';
import type { AdminUser } from '@/lib/admin';
import { toast } from 'sonner';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription' | 'tokens'>('profile');
  
  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Subscription fields
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState('');
  
  // Token fields
  const [tokenLimit, setTokenLimit] = useState('');
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [inputTokensUsed, setInputTokensUsed] = useState(0);
  const [outputTokensUsed, setOutputTokensUsed] = useState(0);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setSubscriptionActive(user.subscriptionStatus === 'active');
      
      if (user.subscriptionExpiresAt) {
        const date = new Date(user.subscriptionExpiresAt);
        setSubscriptionExpiresAt(date.toISOString().split('T')[0]);
      } else {
        setSubscriptionExpiresAt('');
      }
      
      setTotalTokensUsed(user.totalTokensUsed || 0);
      setInputTokensUsed(user.inputTokensUsed || 0);
      setOutputTokensUsed(user.outputTokensUsed || 0);
      setTokenLimit(user.tokenLimit?.toString() || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const response = updateUserProfile(user.id, { name, email });
      if (response.success) {
        toast.success('Perfil atualizado com sucesso!');
        onUpdate();
        onClose();
      } else {
        toast.error(response.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsSaving(true);
    try {
      const response = changeUserPassword(user.id, newPassword);
      if (response.success) {
        toast.success('Senha alterada com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
        onUpdate();
      } else {
        toast.error(response.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubscription = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const expiresAt = subscriptionExpiresAt 
        ? new Date(subscriptionExpiresAt).toISOString()
        : undefined;
      
      if (updateUserSubscription(user.id, subscriptionActive, expiresAt)) {
        toast.success(`Assinatura ${subscriptionActive ? 'ativada' : 'desativada'} com sucesso!`);
        onUpdate();
        onClose();
      } else {
        toast.error('Erro ao atualizar assinatura');
      }
    } catch (error) {
      toast.error('Erro ao atualizar assinatura');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'password' as const, label: 'Senha', icon: Lock },
    { id: 'subscription' as const, label: 'Assinatura', icon: CreditCard },
    { id: 'tokens' as const, label: 'Tokens', icon: Zap },
  ];

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
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Editar Usuário: {user.name}</CardTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-gentle"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-border pb-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-gentle ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="cta"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="w-full"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Atenção:</strong> Ao alterar a senha, o usuário precisará usar a nova senha no próximo login.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite a senha novamente"
                        className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="cta"
                      onClick={handleChangePassword}
                      disabled={isSaving || !newPassword || !confirmPassword}
                      className="w-full"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Alterando...' : 'Alterar senha'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                      <div>
                        <p className="font-medium text-foreground">Assinatura ativa</p>
                        <p className="text-sm text-muted-foreground">
                          Ative ou desative a assinatura do usuário
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={subscriptionActive}
                        onChange={(e) => setSubscriptionActive(e.target.checked)}
                        className="w-5 h-5 rounded border-border"
                      />
                    </div>
                  </div>

                  {subscriptionActive && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Data de expiração (opcional)
                      </label>
                      <input
                        type="date"
                        value={subscriptionExpiresAt}
                        onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe em branco para assinatura sem expiração
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      variant="cta"
                      onClick={handleSaveSubscription}
                      disabled={isSaving}
                      className="w-full"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Salvando...' : 'Salvar assinatura'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Tokens Tab */}
              {activeTab === 'tokens' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Total de Tokens</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">
                          {formatTokens(totalTokensUsed)}
                        </p>
                      </div>
                      <Zap className="w-8 h-8 text-blue-600 opacity-50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                      <div>
                        <p className="text-xs text-blue-800 mb-1">Input Tokens</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {formatTokens(inputTokensUsed)}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          {formatCost((inputTokensUsed / 1_000_000) * 0.15)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-800 mb-1">Output Tokens</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {formatTokens(outputTokensUsed)}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          {formatCost((outputTokensUsed / 1_000_000) * 0.60)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-800 mb-1">Custo Total Estimado</p>
                      <p className="text-lg font-semibold text-blue-700">
                        {formatCost((inputTokensUsed / 1_000_000) * 0.15 + (outputTokensUsed / 1_000_000) * 0.60)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Limite de Tokens (opcional)
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
                      Defina um limite máximo de tokens que este usuário pode usar. Deixe vazio para ilimitado.
                    </p>
                  </div>

                  {user.tokenLimit && user.tokenLimit > 0 && (
                    <div className="bg-muted/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Uso atual</span>
                        <span className="text-sm font-medium text-foreground">
                          {Math.round(((totalTokensUsed || 0) / user.tokenLimit) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(((totalTokensUsed || 0) / user.tokenLimit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja resetar o contador de tokens? Esta ação não pode ser desfeita.')) {
                          setIsSaving(true);
                          try {
                            if (resetUserTokens(user.id)) {
                              toast.success('Contador de tokens resetado!');
                              setTotalTokensUsed(0);
                              onUpdate();
                            } else {
                              toast.error('Erro ao resetar tokens');
                            }
                          } catch (error) {
                            toast.error('Erro ao resetar tokens');
                          } finally {
                            setIsSaving(false);
                          }
                        }
                      }}
                      className="flex-1"
                      disabled={isSaving}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Resetar Contador
                    </Button>
                    <Button
                      variant="cta"
                      onClick={async () => {
                        setIsSaving(true);
                        try {
                          const limit = tokenLimit && tokenLimit.trim() ? parseInt(tokenLimit) : 0;
                          if (setUserTokenLimit(user.id, limit)) {
                            toast.success('Limite de tokens atualizado!');
                            onUpdate();
                            onClose();
                          } else {
                            toast.error('Erro ao atualizar limite');
                          }
                        } catch (error) {
                          toast.error('Erro ao atualizar limite');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Salvando...' : 'Salvar Limite'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
