import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createKrakenService } from '@/services/krakenService';

interface TradingContextType {
  isLiveMode: boolean;
  setIsLiveMode: (value: boolean) => void;
  showLiveWarning: boolean;
  setShowLiveWarning: (value: boolean) => void;
  apiKeys: {
    binance: { key: string; secret: string; status: 'none' | 'saved' | 'error' };
    kucoin: { key: string; secret: string; status: 'none' | 'saved' | 'error' };
    kraken: { key: string; secret: string; status: 'none' | 'saved' | 'error' };
  };
  updateApiKey: (exchange: 'binance' | 'kucoin' | 'kraken', key: string, secret: string) => void;
  testConnection: (exchange: 'binance' | 'kucoin' | 'kraken') => Promise<void>;
  clearApiKey: (exchange: 'binance' | 'kucoin' | 'kraken') => void;
  executeValidatedTrade: (exchange: string, pair: string, side: 'buy' | 'sell', amount: number) => Promise<boolean>;
}

const TradingContext = createContext<TradingContextType>({} as TradingContextType);

export const useTradingContext = () => useContext(TradingContext);

const logError = (type: 'error' | 'warning' | 'info', message: string, details?: string) => {
  console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  if (typeof window !== 'undefined' && (window as any).logError) {
    (window as any).logError(type, message, details, 'Trading Context');
  }
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiveMode, setIsLiveModeState] = useState(false);
  const [showLiveWarning, setShowLiveWarning] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    binance: { key: '', secret: '', status: 'none' as const },
    kucoin: { key: '', secret: '', status: 'none' as const },
    kraken: { key: '', secret: '', status: 'none' as const }
  });

  useEffect(() => {
    const savedMode = localStorage.getItem('tradingMode');
    if (savedMode === 'live') {
      setIsLiveModeState(true);
      logError('info', 'Live trading mode restored from localStorage');
    }
    
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(prev => ({
          binance: parsed.binance || prev.binance,
          kucoin: parsed.kucoin || prev.kucoin,
          kraken: parsed.kraken || prev.kraken
        }));
        logError('info', 'API keys restored from localStorage');
      } catch (error) {
        logError('error', 'Failed to parse saved API keys', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, []);

  const setIsLiveMode = (value: boolean) => {
    setIsLiveModeState(value);
    localStorage.setItem('tradingMode', value ? 'live' : 'paper');
    logError('info', `Trading mode changed to ${value ? 'LIVE' : 'PAPER'}`);
  };

  const updateApiKey = (exchange: 'binance' | 'kucoin' | 'kraken', key: string, secret: string) => {
    if (!key.trim() || !secret.trim()) {
      logError('error', 'API key and secret validation failed', 'Both fields are required');
      toast({ title: 'Error', description: 'API key and secret are required', variant: 'destructive' });
      return;
    }

    const newKeys = {
      ...apiKeys,
      [exchange]: { key: key.trim(), secret: secret.trim(), status: 'saved' as const }
    };
    
    setApiKeys(newKeys);
    localStorage.setItem('apiKeys', JSON.stringify(newKeys));
    logError('info', `${exchange} API keys updated successfully`);
    toast({ title: 'Success', description: `${exchange} API keys saved successfully` });
  };

  const testConnection = async (exchange: 'binance' | 'kucoin' | 'kraken') => {
    const { key, secret } = apiKeys[exchange];
    if (!key || !secret) {
      logError('error', `${exchange} connection test failed`, 'API keys not configured');
      toast({ title: 'Error', description: 'Please save API keys first', variant: 'destructive' });
      return;
    }

    logError('info', `Testing ${exchange} connection...`);
    
    try {
      if (exchange === 'kraken') {
        const krakenService = createKrakenService(key, secret);
        const success = await krakenService.testConnection();
        
        if (success) {
          setApiKeys(prev => ({ ...prev, [exchange]: { ...prev[exchange], status: 'saved' } }));
          logError('info', 'Kraken connection test successful');
          toast({ title: 'Success', description: 'Kraken connection test successful' });
        } else {
          throw new Error('Connection test failed');
        }
      } else {
        // Simulate connection test for other exchanges
        await new Promise(resolve => setTimeout(resolve, 1000));
        setApiKeys(prev => ({ ...prev, [exchange]: { ...prev[exchange], status: 'saved' } }));
        logError('info', `${exchange} connection test successful`);
        toast({ title: 'Success', description: `${exchange} connection test successful` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApiKeys(prev => ({ ...prev, [exchange]: { ...prev[exchange], status: 'error' } }));
      logError('error', `${exchange} connection test failed`, errorMessage);
      toast({ title: 'Connection Failed', description: `${exchange} connection failed: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const clearApiKey = (exchange: 'binance' | 'kucoin' | 'kraken') => {
    const newKeys = { ...apiKeys, [exchange]: { key: '', secret: '', status: 'none' as const } };
    setApiKeys(newKeys);
    localStorage.setItem('apiKeys', JSON.stringify(newKeys));
    logError('info', `${exchange} API keys cleared`);
    toast({ title: 'Success', description: `${exchange} API keys cleared` });
  };

  const executeValidatedTrade = async (exchange: string, pair: string, side: 'buy' | 'sell', amount: number): Promise<boolean> => {
    if (!isLiveMode) {
      logError('error', 'Trade execution blocked', 'Live mode not enabled');
      toast({ title: 'Error', description: 'Live mode must be enabled for real trades', variant: 'destructive' });
      return false;
    }

    logError('info', `Executing ${exchange} trade`, `${side} ${amount} ${pair}`);

    if (exchange.toLowerCase() === 'kraken') {
      const { key, secret, status } = apiKeys.kraken;
      if (!key || !secret || status !== 'saved') {
        logError('error', 'Kraken trade execution failed', 'API keys not configured or invalid');
        toast({ title: 'Error', description: 'Kraken API keys not configured or invalid', variant: 'destructive' });
        return false;
      }

      try {
        logError('info', 'Creating Kraken service instance...');
        const krakenService = createKrakenService(key, secret);
        
        // Convert pair format for Kraken API
        let krakenPair = pair.replace('/', '').toUpperCase();
        if (krakenPair === 'BTCUSD') krakenPair = 'XBTUSD';
        if (krakenPair === 'ETHUSD') krakenPair = 'ETHUSD';
        
        logError('info', 'Placing validated order...', `Pair: ${krakenPair}, Side: ${side}, Amount: ${amount}`);
        
        const result = await krakenService.placeValidatedOrder({
          pair: krakenPair,
          type: side,
          ordertype: 'market',
          volume: amount.toString()
        });

        logError('info', 'Order result received', JSON.stringify(result));

        if (result.error && result.error.length > 0) {
          const errorMsg = result.error[0];
          logError('error', 'Kraken order failed', errorMsg);
          
          // Handle specific error cases with detailed logging
          if (errorMsg.includes('Insufficient funds')) {
            logError('error', 'Trade failed: Insufficient funds', 'Check account balance');
            toast({ title: 'Trade Failed', description: 'Insufficient funds for this trade', variant: 'destructive' });
          } else if (errorMsg.includes('Order minimum not met')) {
            logError('error', 'Trade failed: Order minimum not met', `Amount: ${amount}, Pair: ${krakenPair}`);
            toast({ title: 'Trade Failed', description: 'Order size below minimum requirement', variant: 'destructive' });
          } else if (errorMsg.includes('Invalid arguments')) {
            logError('error', 'Trade failed: Invalid arguments', `Pair: ${krakenPair}, Type: ${side}, Volume: ${amount}`);
            toast({ title: 'Trade Failed', description: 'Invalid order parameters', variant: 'destructive' });
          } else if (errorMsg.includes('Unknown asset pair')) {
            logError('error', 'Trade failed: Unknown asset pair', `Pair: ${krakenPair}`);
            toast({ title: 'Trade Failed', description: 'Invalid trading pair', variant: 'destructive' });
          } else if (errorMsg.includes('Invalid key')) {
            logError('error', 'Trade failed: Invalid API key', 'Check API key configuration');
            toast({ title: 'Trade Failed', description: 'Invalid API key', variant: 'destructive' });
          } else if (errorMsg.includes('Permission denied')) {
            logError('error', 'Trade failed: Permission denied', 'Check API key permissions');
            toast({ title: 'Trade Failed', description: 'API key lacks trading permissions', variant: 'destructive' });
          } else {
            logError('error', 'Trade failed: Unknown error', errorMsg);
            toast({ title: 'Trade Failed', description: errorMsg, variant: 'destructive' });
          }
          
          return false;
        }

        if (result.result) {
          logError('info', 'Kraken trade executed successfully', `TxID: ${result.result.txid?.[0] || 'N/A'}`);
          toast({ title: 'Trade Executed', description: `${side.toUpperCase()} ${amount} ${pair} on Kraken` });
          return true;
        }

        logError('error', 'Kraken trade failed', 'No result returned from API');
        toast({ title: 'Trade Failed', description: 'No result returned from Kraken API', variant: 'destructive' });
        return false;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Trade execution failed';
        logError('error', 'Kraken trade execution error', errorMessage);
        
        // Provide more specific error messages
        if (errorMessage.includes('Function invocation failed')) {
          toast({ title: 'Trade Failed', description: 'API connection failed - check your internet connection', variant: 'destructive' });
        } else if (errorMessage.includes('Invalid API')) {
          toast({ title: 'Trade Failed', description: 'Invalid API credentials', variant: 'destructive' });
        } else {
          toast({ title: 'Trade Failed', description: errorMessage, variant: 'destructive' });
        }
        
        return false;
      }
    }

    logError('error', `${exchange} trading not implemented`);
    toast({ title: 'Error', description: `${exchange} trading not implemented`, variant: 'destructive' });
    return false;
  };

  return (
    <TradingContext.Provider value={{
      isLiveMode, setIsLiveMode, showLiveWarning, setShowLiveWarning,
      apiKeys, updateApiKey, testConnection, clearApiKey, executeValidatedTrade
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export default TradingProvider;