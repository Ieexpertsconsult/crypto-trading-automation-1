import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, BarChart3, AlertTriangle, Bug } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';
import TradingModeToggle from './TradingModeToggle';
import ApiKeyManager from './ApiKeyManager';
import BudgetManager from './BudgetManager';
import LiveTradingEngine from './LiveTradingEngine';
import MarketOverview from './MarketOverview';
import ErrorLogger from './ErrorLogger';
import TradeDebugger from './TradeDebugger';
import { useState } from 'react';

const TradingDashboard: React.FC = () => {
  const { isLiveMode, apiKeys } = useTradingContext();
  const [showApiManager, setShowApiManager] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const getConnectionStatus = () => {
    const connected = Object.values(apiKeys).filter(key => key.status === 'saved').length;
    const total = Object.keys(apiKeys).length;
    return { connected, total };
  };

  const { connected, total } = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
            <div className="flex items-center gap-4">
              <Badge variant={isLiveMode ? 'destructive' : 'secondary'}>
                {isLiveMode ? 'LIVE MODE' : 'PAPER TRADING'}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className={`w-2 h-2 rounded-full ${connected > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                {connected}/{total} Exchanges Connected
              </div>
              {errorCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errorCount} Errors
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TradingModeToggle />
            <Button 
              onClick={() => setShowDebugger(!showDebugger)}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug
            </Button>
            <Button 
              onClick={() => setShowApiManager(!showApiManager)}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </Button>
          </div>
        </div>

        {/* API Key Manager */}
        {showApiManager && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API Key Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApiKeyManager />
            </CardContent>
          </Card>
        )}

        {/* Trade Debugger */}
        {showDebugger && (
          <TradeDebugger />
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <MarketOverview />
            <LiveTradingEngine />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <BudgetManager />
            <ErrorLogger />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;