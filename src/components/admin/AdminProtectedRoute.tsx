import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminAuthenticated } from '@/lib/admin';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
