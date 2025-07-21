import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MarketOverview: React.FC = () => {
  const marketData = [
    { symbol: 'BTC/USD', price: 43250.50, change: 2.45, volume: '1.2B' },
    { symbol: 'ETH/USD', price: 2680.75, change: -1.23, volume: '850M' },
    { symbol: 'XRP/USD', price: 0.6234, change: 0.89, volume: '420M' }
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Market Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {marketData.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">{item.symbol}</p>
              <p className="text-xs text-slate-400">Vol: {item.volume}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">${item.price.toLocaleString()}</p>
              <Badge variant={item.change >= 0 ? 'default' : 'destructive'} className="text-xs">
                {item.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {item.change >= 0 ? '+' : ''}{item.change}%
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MarketOverview;