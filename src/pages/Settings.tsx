import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  LogOut,
  ArrowLeft,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAmparo } from '@/context/AmparoContext';
import { 
  updateProfile, 
  changePassword, 
  logout, 
  getAccountSettings, 
  saveAccountSettings 
} from '@/lib/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { AccountSettings } from '@/types/auth';

export function Settings() {
  const navigate = useNavigate();
  const { authUser, setAuthUser, setUser } = useAmparo();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'privacy'>('profile');
  
  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AccountSettings>({
    name: '',
    email: '',
    notifications: {
      dailyCheckIn: true,
      memoryReminders: true,
      weeklySummary: false,
    },
    privacy: {
      shareAnalytics: false,
    },
  });

  useEffect(() => {
    if (authUser) {
      setName(authUser.name);
      setEmail(authUser.email);
      
      const savedSettings = getAccountSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      } else {
        setSettings({
          name: authUser.name,
          email: authUser.email,
          notifications: {
            dailyCheckIn: true,
            memoryReminders: true,
            weeklySummary: false,
          },
          privacy: {
            shareAnalytics: false,
          },
        });
      }
    }
  }, [authUser]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await updateProfile({ name, email });
      if (response.success && response.user) {
        setAuthUser(response.user);
        setSettings(prev => ({ ...prev, name, email }));
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error(response.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      
      if (response.success) {
        toast.success('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(response.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveSettings = () => {
    saveAccountSettings(settings);
    toast.success('Configurações salvas!');
  };

  const handleLogout = () => {
    logout();
    setAuthUser(null);
    setUser(null);
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  if (!authUser) {
    return null;
  }

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'account' as const, label: 'Conta', icon: Lock },
    { id: 'notifications' as const, label: 'Notificações', icon: Bell },
    { id: 'privacy' as const, label: 'Privacidade', icon: Shield },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Configurações
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie sua conta e preferências
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-gentle whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
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

                <Button
                  variant="cta"
                  onClick={handleUpdateProfile}
                  disabled={isSavingProfile}
                >
                  <Save className="w-4 h-4" />
                  {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Senha atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nova senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showNewPassword ? (
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

                <Button
                  variant="cta"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  <Save className="w-4 h-4" />
                  {isChangingPassword ? 'Alterando...' : 'Alterar senha'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Check-in diário</p>
                    <p className="text-sm text-muted-foreground">
                      Lembretes para fazer seu check-in emocional
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyCheckIn}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          dailyCheckIn: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 rounded border-border"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Lembretes de memórias</p>
                    <p className="text-sm text-muted-foreground">
                      Notificações para adicionar novas memórias
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.memoryReminders}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          memoryReminders: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 rounded border-border"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Resumo semanal</p>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo da sua jornada semanalmente
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.weeklySummary}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          weeklySummary: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 rounded border-border"
                  />
                </div>

                <Button variant="cta" onClick={handleSaveSettings}>
                  <Save className="w-4 h-4" />
                  Salvar preferências
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Privacidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Compartilhar análises</p>
                    <p className="text-sm text-muted-foreground">
                      Permite que usemos dados anônimos para melhorar o serviço
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareAnalytics}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          shareAnalytics: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 rounded border-border"
                  />
                </div>

                <Button variant="cta" onClick={handleSaveSettings}>
                  <Save className="w-4 h-4" />
                  Salvar preferências
                </Button>

                <div className="pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full text-coral border-coral/20 hover:bg-coral/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
