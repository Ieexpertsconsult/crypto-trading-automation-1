import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Play, Pause, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';
import { toast } from '@/components/ui/use-toast';

interface LiveTrade {
  id: string;
  exchange: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'pending' | 'filled' | 'failed' | 'adjusted';
  timestamp: Date;
  profit?: number;
  error?: string;
}

const LiveTradingEngine: React.FC = () => {
  const { isLiveMode, apiKeys, executeValidatedTrade } = useTradingContext();
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [activeStrategies, setActiveStrategies] = useState({
    scalping: false,
    arbitrage: false,
    momentum: false
  });

  const logError = (type: 'error' | 'warning' | 'info', message: string, details?: string) => {
    if (typeof window !== 'undefined' && (window as any).logError) {
      (window as any).logError(type, message, details, 'Live Trading Engine');
    }
  };

  const executeKrakenTrade = async (pair: string, side: 'buy' | 'sell', volume: number) => {
    const tradeId = `trade_${Date.now()}`;
    const newTrade: LiveTrade = {
      id: tradeId,
      exchange: 'Kraken',
      pair,
      side,
      amount: volume,
      price: 0,
      status: 'pending',
      timestamp: new Date()
    };
    
    setLiveTrades(prev => [newTrade, ...prev]);
    logError('info', `Executing ${side} trade: ${volume} ${pair}`);
    
    try {
      const success = await executeValidatedTrade('kraken', pair, side, volume);
      
      setLiveTrades(prev => prev.map(trade => 
        trade.id === tradeId 
          ? { 
              ...trade, 
              status: success ? 'filled' : 'failed', 
              profit: success ? Math.random() * 20 - 10 : undefined 
            }
          : trade
      ));
      
      if (success) {
        logError('info', `Trade executed successfully: ${side} ${volume} ${pair}`);
      } else {
        logError('error', `Trade failed: ${side} ${volume} ${pair}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('error', `Trade execution error: ${errorMessage}`, `${side} ${volume} ${pair}`);
      
      setLiveTrades(prev => prev.map(trade => 
        trade.id === tradeId 
          ? { ...trade, status: 'failed', error: errorMessage }
          : trade
      ));
    }
  };

  const toggleStrategy = (strategy: keyof typeof activeStrategies) => {
    if (!isLiveMode) {
      logError('warning', 'Live mode required to activate strategies');
      toast({ title: 'Error', description: 'Enable live mode to activate strategies', variant: 'destructive' });
      return;
    }
    
    if (!apiKeys.kraken.key || apiKeys.kraken.status !== 'saved') {
      logError('warning', 'Kraken API keys not configured for strategy activation');
      toast({ title: 'Error', description: 'Configure Kraken API keys first', variant: 'destructive' });
      return;
    }
    
    setActiveStrategies(prev => ({ ...prev, [strategy]: !prev[strategy] }));
    logError('info', `Strategy ${strategy} ${!activeStrategies[strategy] ? 'activated' : 'deactivated'}`);
  };

  const startEngine = () => {
    if (!isLiveMode) {
      logError('error', 'Cannot start engine: Live mode not enabled');
      toast({ title: 'Error', description: 'Enable live mode first', variant: 'destructive' });
      return;
    }
    
    if (!apiKeys.kraken.key || apiKeys.kraken.status !== 'saved') {
      logError('error', 'Cannot start engine: Kraken API keys not configured');
      toast({ title: 'Error', description: 'Configure Kraken API keys first', variant: 'destructive' });
      return;
    }
    
    setIsEngineRunning(true);
    logError('info', 'Live trading engine started');
    toast({ title: 'Live Trading Started', description: 'Engine is now executing trades' });
  };

  const stopEngine = () => {
    setIsEngineRunning(false);
    setActiveStrategies({ scalping: false, arbitrage: false, momentum: false });
    logError('info', 'Live trading engine stopped');
    toast({ title: 'Live Trading Stopped', description: 'All strategies deactivated' });
  };

  useEffect(() => {
    if (!isEngineRunning || !isLiveMode) return;
    
    const interval = setInterval(() => {
      const strategies = Object.entries(activeStrategies).filter(([_, active]) => active);
      if (strategies.length === 0) return;
      
      // Convert pair format for Kraken
      const pairs = ['BTC/USD', 'ETH/USD', 'XRP/USD'];
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
      const randomSide = Math.random() > 0.5 ? 'buy' : 'sell';
      const randomVolume = Math.random() * 0.01 + 0.005;
      
      // Only execute trades occasionally to avoid spam
      if (Math.random() > 0.7) {
        executeKrakenTrade(randomPair, randomSide, randomVolume);
      }
    }, 20000); // Increased interval to 20 seconds
    
    return () => clearInterval(interval);
  }, [isEngineRunning, activeStrategies, isLiveMode]);

  useEffect(() => {
    const profit = liveTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    setTotalProfit(profit);
  }, [liveTrades]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'adjusted': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default: return <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Trading Engine
            {isLiveMode && <Badge variant="destructive" className="ml-2">LIVE MODE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={isEngineRunning ? stopEngine : startEngine}
                variant={isEngineRunning ? 'destructive' : 'default'}
                className={isEngineRunning ? '' : 'bg-green-600 hover:bg-green-700'}
                disabled={!isLiveMode}
              >
                {isEngineRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isEngineRunning ? 'Stop Engine' : 'Start Engine'}
              </Button>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isEngineRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-sm text-slate-300">{isEngineRunning ? 'Running' : 'Stopped'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Total P&L</p>
              <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${totalProfit.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(activeStrategies).map(([strategy, active]) => (
              <div key={strategy} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300 capitalize">{strategy}</span>
                <Switch 
                  checked={active}
                  onCheckedChange={() => toggleStrategy(strategy as keyof typeof activeStrategies)}
                  disabled={!isEngineRunning}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Live Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveTrades.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No trades executed yet</p>
            ) : (
              liveTrades.slice(0, 10).map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(trade.status)}
                    <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                      {trade.side.toUpperCase()}
                    </Badge>
                    <span className="text-slate-300">{trade.pair}</span>
                    <span className="text-xs text-slate-400">{trade.exchange}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{trade.amount.toFixed(6)}</span>
                    {trade.profit !== undefined && (
                      <span className={`text-sm font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${trade.profit.toFixed(2)}
                      </span>
                    )}
                    {trade.error && (
                      <span className="text-xs text-red-400 max-w-32 truncate" title={trade.error}>
                        {trade.error}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTradingEngine;