import { useAmparo } from '@/context/AmparoContext';
import { useNavigate } from 'react-router-dom';

export function TopBar() {
  const { user } = useAmparo();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          {user && (
            <h1 className="font-display text-lg font-semibold text-foreground">
              {user.name}
            </h1>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Abrir configurações da conta"
          className="w-10 h-10 rounded-2xl bg-serenity flex items-center justify-center"
        >
          <span className="font-display text-serenity-600 font-semibold">
            {user?.name?.[0] || 'A'}
          </span>
        </button>
      </div>
    </header>
  );
}
