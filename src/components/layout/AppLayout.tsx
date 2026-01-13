import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { SosModal } from '@/components/sos/SosModal';

interface AppLayoutProps {
  children: ReactNode;
  showTopBar?: boolean;
}

export function AppLayout({ children, showTopBar = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="lg:pl-64">
        {showTopBar && <TopBar />}
        
        <main className="pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
      <SosModal />
    </div>
  );
}
