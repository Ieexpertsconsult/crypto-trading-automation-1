import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';

interface ConnectionStatusProps {
  exchange: 'binance' | 'kucoin' | 'kraken';
  showLabel?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ exchange, showLabel = true }) => {
  const { apiKeys } = useTradingContext();
  const status = apiKeys[exchange].status;
  const hasKeys = apiKeys[exchange].key && apiKeys[exchange].secret;

  const getStatusDisplay = () => {
    if (!hasKeys) {
      return {
        icon: <Clock className="w-3 h-3" />,
        text: 'Not Connected',
        variant: 'secondary' as const,
        color: 'text-gray-500'
      };
    }

    switch (status) {
      case 'saved':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: 'Connected',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Connection Error',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      default:
        return {
          icon: <Clock className="w-3 h-3" />,
          text: 'Not Tested',
          variant: 'secondary' as const,
          color: 'text-yellow-600'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (!showLabel) {
    return (
      <div className={`flex items-center ${statusDisplay.color}`}>
        {statusDisplay.icon}
      </div>
    );
  }

  return (
    <Badge variant={statusDisplay.variant} className="flex items-center gap-1">
      {statusDisplay.icon}
      {statusDisplay.text}
    </Badge>
  );
};

export default ConnectionStatus;