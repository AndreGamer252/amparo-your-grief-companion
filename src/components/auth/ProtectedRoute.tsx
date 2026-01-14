import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAmparo } from '@/context/AmparoContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authUser, isLoading } = useAmparo();

  // Aguarda a restauração da sessão antes de redirecionar
  if (isLoading) {
    return (
      <div className="min-h-screen bg-warmth flex items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-serenity flex items-center justify-center animate-breathe">
          <span className="text-serenity-600 font-display font-semibold">A</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
