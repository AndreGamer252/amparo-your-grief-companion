import { useAmparo } from '@/context/AmparoContext';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { Dashboard } from './Dashboard';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { authUser, user } = useAmparo();

  // Se não estiver autenticado, o ProtectedRoute já redireciona
  // Mas aqui verificamos o onboarding
  if (!user || !user.onboardingComplete) {
    return <Onboarding />;
  }

  return <Dashboard />;
};

export default Index;
