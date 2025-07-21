import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';
import { createKrakenService } from '@/services/krakenService';

const AccountInfo: React.FC = () => {
  const { apiKeys, isLiveMode } = useTradingContext();
  const [balance, setBalance] = useState<any>({});
  const [totalUSD, setTotalUSD] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!apiKeys.kraken.key || !isLiveMode) {
      setBalance({ ZUSD: '1000.00', XXBT: '0.05' });
      setTotalUSD(3250);
      return;
    }
    
    setLoading(true);
    try {
      const krakenService = createKrakenService(apiKeys.kraken.key, apiKeys.kraken.secret);
      const bal = await krakenService.getAccountBalance();
      setBalance(bal);
      
      let total = 0;
      Object.entries(bal).forEach(([currency, amount]) => {
        const num = parseFloat(amount as string);
        if (currency === 'ZUSD') total += num;
        else if (currency === 'XXBT') total += num * 45000;
        else if (currency === 'XETH') total += num * 2500;
      });
      setTotalUSD(total);
    } catch (error) {
      console.error('Balance fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [apiKeys.kraken, isLiveMode]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          Account Balance
          <Button onClick={fetchBalance} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-slate-300">Total Value:</span>
            <Badge variant="secondary">
              ${totalUSD.toLocaleString()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {Object.entries(balance).map(([currency, amount]) => {
              const num = parseFloat(amount as string);
              if (num < 0.001) return null;
              const clean = currency.replace(/^[XZ]/, '');
              return (
                <div key={currency} className="flex justify-between text-sm">
                  <span className="text-slate-400">{clean}:</span>
                  <span className="text-white">{num.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfo;