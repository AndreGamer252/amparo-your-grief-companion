import { useAmparo } from '@/context/AmparoContext';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { Dashboard } from './Dashboard';

const Index = () => {
  const { user } = useAmparo();

  if (!user || !user.onboardingComplete) {
    return <Onboarding />;
  }

  return <Dashboard />;
};

export default Index;
