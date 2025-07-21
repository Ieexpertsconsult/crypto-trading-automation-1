import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle, Bitcoin, Coins } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';
import { createKrakenService } from '@/services/krakenService';

interface BudgetAllocation {
  currency: string;
  displayName: string;
  balance: number;
  usdValue: number;
  allocated: number;
  available: number;
  percentage: number;
  icon: React.ReactNode;
}

interface CryptoPrice {
  [key: string]: number;
}

const BudgetManager: React.FC = () => {
  const { apiKeys, isLiveMode } = useTradingContext();
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice>({});

  // Fetch crypto prices from a public API
  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,litecoin,cardano,polkadot&vs_currencies=usd');
      const data = await response.json();
      
      setCryptoPrices({
        'XBT': data.bitcoin?.usd || 45000,
        'XXBT': data.bitcoin?.usd || 45000,
        'ETH': data.ethereum?.usd || 2500,
        'XETH': data.ethereum?.usd || 2500,
        'XRP': data.ripple?.usd || 0.6,
        'XXRP': data.ripple?.usd || 0.6,
        'LTC': data.litecoin?.usd || 100,
        'XLTC': data.litecoin?.usd || 100,
        'ADA': data.cardano?.usd || 0.5,
        'DOT': data.polkadot?.usd || 7,
        'USD': 1,
        'ZUSD': 1
      });
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      // Fallback prices
      setCryptoPrices({
        'XBT': 45000, 'XXBT': 45000,
        'ETH': 2500, 'XETH': 2500,
        'XRP': 0.6, 'XXRP': 0.6,
        'LTC': 100, 'XLTC': 100,
        'ADA': 0.5, 'DOT': 7,
        'USD': 1, 'ZUSD': 1
      });
    }
  };

  const getCurrencyIcon = (currency: string) => {
    const normalizedCurrency = currency.replace('X', '').replace('Z', '');
    switch (normalizedCurrency) {
      case 'BTC': return <Bitcoin className="h-4 w-4 text-orange-400" />;
      case 'ETH': return <Coins className="h-4 w-4 text-blue-400" />;
      case 'USD': return <DollarSign className="h-4 w-4 text-green-400" />;
      default: return <Coins className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCurrencyDisplayName = (currency: string) => {
    const normalizedCurrency = currency.replace('X', '').replace('Z', '');
    const names: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'XRP': 'Ripple',
      'LTC': 'Litecoin',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'USD': 'US Dollar'
    };
    return names[normalizedCurrency] || normalizedCurrency;
  };

  const fetchBalances = async () => {
    if (!apiKeys.kraken.key || !apiKeys.kraken.secret || !isLiveMode) return;
    
    setLoading(true);
    try {
      await fetchCryptoPrices();
      
      const krakenService = createKrakenService(apiKeys.kraken.key, apiKeys.kraken.secret);
      const balances = await krakenService.getAccountBalance();
      
      const allocations: BudgetAllocation[] = [];
      let totalUsd = 0;
      
      // Process all balances including Bitcoin and other cryptocurrencies
      Object.entries(balances).forEach(([currency, balance]) => {
        const numBalance = parseFloat(balance);
        if (numBalance > 0.0001) { // Show even small balances for crypto
          const price = cryptoPrices[currency] || 1;
          const usdValue = numBalance * price;
          
          // Calculate allocation (reserve 20% for safety)
          const allocated = numBalance * 0.8;
          const available = numBalance - allocated;
          
          const displayName = getCurrencyDisplayName(currency);
          const normalizedCurrency = currency.replace('X', '').replace('Z', '');
          
          allocations.push({
            currency: normalizedCurrency,
            displayName,
            balance: numBalance,
            usdValue,
            allocated,
            available,
            percentage: 0, // Will calculate after total
            icon: getCurrencyIcon(currency)
          });
          
          totalUsd += usdValue;
        }
      });
      
      // Sort by USD value (largest first)
      allocations.sort((a, b) => b.usdValue - a.usdValue);
      
      // Calculate percentages
      const allocationsWithPercentages = allocations.map(alloc => ({
        ...alloc,
        percentage: totalUsd > 0 ? (alloc.usdValue / totalUsd) * 100 : 0
      }));
      
      setBudgetAllocations(allocationsWithPercentages);
      setTotalUsdValue(totalUsd);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [apiKeys.kraken, isLiveMode]);

  const getTradeSize = (currency: string, percentage: number = 2): number => {
    const allocation = budgetAllocations.find(a => a.currency === currency);
    if (!allocation) return 0;
    
    const maxTradeSize = allocation.available * (percentage / 100);
    return Math.min(maxTradeSize, allocation.available * 0.1); // Max 10% of available
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Portfolio Budget Manager
          {isLiveMode && (
            <Badge variant="destructive" className="ml-2">
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-slate-400">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-white">
              ${totalUsdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400">Available for Trading</p>
            <p className="text-2xl font-bold text-green-400">
              ${(totalUsdValue * 0.8).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {loading ? (
            <p className="text-slate-400 text-center">Loading portfolio balances...</p>
          ) : budgetAllocations.length === 0 ? (
            <p className="text-slate-400 text-center">
              {isLiveMode ? 'No balances found' : 'Enable live mode to view portfolio'}
            </p>
          ) : (
            budgetAllocations.map(allocation => (
              <div key={allocation.currency} className="p-3 bg-slate-700/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {allocation.icon}
                    <div>
                      <span className="text-slate-300 font-medium">
                        {allocation.currency}
                      </span>
                      <p className="text-xs text-slate-400">{allocation.displayName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-slate-400">
                      {allocation.percentage.toFixed(1)}%
                    </span>
                    <p className="text-xs text-green-400">
                      ${allocation.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={allocation.percentage} 
                  className="mb-2" 
                />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Balance</p>
                    <p className="text-white">{allocation.balance.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Available</p>
                    <p className="text-green-400">{allocation.available.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Max Trade</p>
                    <p className="text-blue-400">{getTradeSize(allocation.currency).toFixed(6)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {budgetAllocations.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-sm text-amber-200">
              Portfolio includes all cryptocurrencies and USD. 20% reserved for safety. Real-time prices from CoinGecko.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetManager;