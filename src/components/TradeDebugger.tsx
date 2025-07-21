import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Play, CheckCircle, XCircle } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';
import { createKrakenService } from '@/services/krakenService';
import { toast } from '@/components/ui/use-toast';

interface DebugStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: string;
}

const TradeDebugger: React.FC = () => {
  const { apiKeys, isLiveMode } = useTradingContext();
  const [pair, setPair] = useState('ETH/USD');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('0.01');
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);

  const initializeSteps = (): DebugStep[] => [
    { id: 'api-check', name: 'Check API Keys', status: 'pending' },
    { id: 'connection', name: 'Test Connection', status: 'pending' },
    { id: 'balance', name: 'Fetch Balance', status: 'pending' },
    { id: 'validation', name: 'Validate Trade', status: 'pending' },
    { id: 'order', name: 'Place Order', status: 'pending' }
  ];

  const updateStep = (id: string, status: DebugStep['status'], message?: string, details?: string) => {
    setDebugSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, message, details } : step
    ));
  };

  const debugTrade = async () => {
    setIsDebugging(true);
    setDebugSteps(initializeSteps());
    
    try {
      // Step 1: Check API Keys
      updateStep('api-check', 'running');
      const { key, secret, status } = apiKeys.kraken;
      
      if (!key || !secret) {
        updateStep('api-check', 'error', 'API keys not configured');
        return;
      }
      
      if (status !== 'saved') {
        updateStep('api-check', 'error', 'API keys not validated');
        return;
      }
      
      updateStep('api-check', 'success', 'API keys found and validated');
      
      // Step 2: Test Connection
      updateStep('connection', 'running');
      const krakenService = createKrakenService(key, secret);
      
      try {
        const connectionTest = await krakenService.testConnection();
        if (connectionTest) {
          updateStep('connection', 'success', 'Connection successful');
        } else {
          updateStep('connection', 'error', 'Connection failed');
          return;
        }
      } catch (error) {
        updateStep('connection', 'error', 'Connection failed', error instanceof Error ? error.message : 'Unknown error');
        return;
      }
      
      // Step 3: Fetch Balance
      updateStep('balance', 'running');
      try {
        const balance = await krakenService.getAccountBalance();
        const balanceKeys = Object.keys(balance);
        updateStep('balance', 'success', `Found ${balanceKeys.length} currencies`, JSON.stringify(balance, null, 2));
      } catch (error) {
        updateStep('balance', 'error', 'Failed to fetch balance', error instanceof Error ? error.message : 'Unknown error');
        return;
      }
      
      // Step 4: Validate Trade
      updateStep('validation', 'running');
      try {
        const validator = krakenService.getTradeValidator();
        if (!validator) {
          updateStep('validation', 'error', 'Could not create trade validator');
          return;
        }
        
        const validation = validator.validateTrade({
          pair,
          side,
          amount: parseFloat(amount),
          price: undefined
        });
        
        if (validation.isValid) {
          updateStep('validation', 'success', 'Trade validation passed');
        } else {
          updateStep('validation', 'error', 'Trade validation failed', validation.error);
          if (!isLiveMode) return; // Don't continue if validation fails and not in live mode
        }
      } catch (error) {
        updateStep('validation', 'error', 'Validation error', error instanceof Error ? error.message : 'Unknown error');
        return;
      }
      
      // Step 5: Place Order (only in live mode)
      updateStep('order', 'running');
      if (!isLiveMode) {
        updateStep('order', 'success', 'Skipped - Paper trading mode');
        return;
      }
      
      try {
        let krakenPair = pair.replace('/', '').toUpperCase();
        if (krakenPair === 'BTCUSD') krakenPair = 'XBTUSD';
        if (krakenPair === 'ETHUSD') krakenPair = 'ETHUSD';
        
        const result = await krakenService.placeValidatedOrder({
          pair: krakenPair,
          type: side,
          ordertype: 'market',
          volume: amount
        });
        
        if (result.error && result.error.length > 0) {
          updateStep('order', 'error', 'Order failed', result.error[0]);
        } else if (result.result) {
          updateStep('order', 'success', 'Order placed successfully', `TxID: ${result.result.txid?.[0] || 'N/A'}`);
        } else {
          updateStep('order', 'error', 'No result returned');
        }
      } catch (error) {
        updateStep('order', 'error', 'Order placement failed', error instanceof Error ? error.message : 'Unknown error');
      }
      
    } finally {
      setIsDebugging(false);
    }
  };

  const getStepIcon = (status: DebugStep['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running': return <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Trade Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Trading Pair</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                <SelectItem value="XRP/USD">XRP/USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300">Side</Label>
            <Select value={side} onValueChange={(value: 'buy' | 'sell') => setSide(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label className="text-slate-300">Amount</Label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            className="bg-slate-700 border-slate-600"
          />
        </div>
        
        <Button 
          onClick={debugTrade} 
          disabled={isDebugging}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {isDebugging ? 'Debugging...' : 'Debug Trade'}
        </Button>
        
        {debugSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Debug Steps:</h4>
            {debugSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                {getStepIcon(step.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{step.name}</span>
                    <Badge variant={step.status === 'success' ? 'default' : step.status === 'error' ? 'destructive' : 'secondary'}>
                      {step.status}
                    </Badge>
                  </div>
                  {step.message && (
                    <p className="text-xs text-slate-400 mt-1">{step.message}</p>
                  )}
                  {step.details && (
                    <pre className="text-xs text-slate-500 mt-1 bg-slate-800 p-2 rounded overflow-x-auto">
                      {step.details}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeDebugger;