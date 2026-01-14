import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/lib/auth';
import { useAmparo } from '@/context/AmparoContext';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { setAuthUser } = useAmparo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      
      if (response.success && response.user) {
        setAuthUser(response.user);
        toast.success('Bem-vindo de volta!');
        navigate('/');
      } else {
        toast.error(response.error || 'Erro ao fazer login');
      }
    } catch (error) {
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
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
            {/* Logo */}
            <div className="text-center space-y-4 mb-8">
              <div className="w-32 h-32 mx-auto flex items-center justify-center animate-breathe">
                <img 
                  src="/logo_ampara.png" 
                  alt="Ampara" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  Bem-vindo de volta
                </h1>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  Entre na sua conta para continuar sua jornada
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-gentle"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Suas informações são privadas e seguras.
        </p>
      </motion.div>
    </div>
  );
}
