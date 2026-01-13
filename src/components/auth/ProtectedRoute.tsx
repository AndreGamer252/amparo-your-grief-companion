import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAmparo } from '@/context/AmparoContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authUser } = useAmparo();

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
