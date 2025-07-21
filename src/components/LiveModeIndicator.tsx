import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';

const LiveModeIndicator: React.FC = () => {
  const { isLiveMode } = useTradingContext();

  if (!isLiveMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">LIVE TRADING MODE ACTIVE</span>
        <Badge variant="secondary" className="bg-red-800 text-white">
          REAL MONEY
        </Badge>
      </div>
    </div>
  );
};

export default LiveModeIndicator;