import { Home, MessageCircle, BookOpen, Heart, Phone } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAmparo } from '@/context/AmparoContext';

const navigation = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Jornada', href: '/journey', icon: BookOpen },
  { name: 'Memórias', href: '/memories', icon: Heart },
];

export function BottomNav() {
  const location = useLocation();
  const { setSosOpen } = useAmparo();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 px-2 pb-safe z-50">
      <div className="flex items-center justify-around py-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-gentle min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'animate-pulse-soft')} />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          );
        })}
        
        {/* SOS Button */}
        <button
          onClick={() => setSosOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-2 text-coral"
        >
          <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
        </button>
      </div>
    </nav>
  );
}
