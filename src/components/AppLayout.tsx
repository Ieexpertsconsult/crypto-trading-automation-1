import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import TradingDashboard from './TradingDashboard';
import LiveModeIndicator from './LiveModeIndicator';
import { TradingProvider } from '@/contexts/TradingContext';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();

  return (
    <TradingProvider>
      <div className="min-h-screen">
        <LiveModeIndicator />
        <TradingDashboard />
      </div>
    </TradingProvider>
  );
};

export default AppLayout;