import { Home, MessageCircle, BookOpen, Heart, Phone } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAmparo } from '@/context/AmparoContext';

const navigation = [
  { name: 'O Refúgio', href: '/', icon: Home },
  { name: 'Conversar', href: '/chat', icon: MessageCircle },
  { name: 'A Jornada', href: '/journey', icon: BookOpen },
  { name: 'Memórias', href: '/memories', icon: Heart },
];

export function Sidebar() {
  const location = useLocation();
  const { setSosOpen } = useAmparo();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="w-10 h-10 rounded-2xl bg-serenity flex items-center justify-center">
          <Heart className="w-5 h-5 text-serenity-600" />
        </div>
        <span className="font-display text-xl font-semibold text-foreground">Amparo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-gentle',
                isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* SOS Button */}
      <div className="p-4">
        <button
          onClick={() => setSosOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-3xl bg-coral/10 text-coral hover:bg-coral/20 transition-gentle font-medium"
        >
          <Phone className="w-5 h-5" />
          <span>SOS - Ajuda Imediata</span>
        </button>
      </div>
    </aside>
  );
}
