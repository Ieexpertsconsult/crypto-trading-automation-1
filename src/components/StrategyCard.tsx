import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertTriangle } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';

interface Strategy {
  id: string;
  name: string;
  type: 'scalping' | 'arbitrage' | 'momentum';
  active: boolean;
  budget: number;
  profit: number;
  winRate: number;
  trades: number;
}

interface StrategyCardProps {
  strategy: Strategy;
  onToggle: (id: string) => void;
  onBudgetChange: (id: string, budget: number) => void;
  disabled?: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ 
  strategy, 
  onToggle, 
  onBudgetChange, 
  disabled = false 
}) => {
  const { isLiveMode } = useTradingContext();
  const [budgetInput, setBudgetInput] = useState(strategy.budget.toString());

  const handleBudgetSubmit = () => {
    const newBudget = parseFloat(budgetInput);
    if (!isNaN(newBudget) && newBudget > 0) {
      onBudgetChange(strategy.id, newBudget);
    }
  };

  const getStrategyIcon = () => {
    switch (strategy.type) {
      case 'scalping':
        return <Activity className="h-5 w-5" />;
      case 'arbitrage':
        return <TrendingUp className="h-5 w-5" />;
      case 'momentum':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStrategyColor = () => {
    switch (strategy.type) {
      case 'scalping':
        return 'text-blue-400';
      case 'arbitrage':
        return 'text-green-400';
      case 'momentum':
        return 'text-purple-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${strategy.active ? 'ring-2 ring-green-500/50' : ''} ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={getStrategyColor()}>
              {getStrategyIcon()}
            </div>
            <div>
              <CardTitle className="text-white text-lg">{strategy.name}</CardTitle>
              <Badge variant="outline" className="mt-1 capitalize">
                {strategy.type}
              </Badge>
            </div>
          </div>
          <Switch
            checked={strategy.active}
            onCheckedChange={() => onToggle(strategy.id)}
            disabled={disabled}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLiveMode && disabled && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-400 text-xs flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              Managed by Live Trading Engine
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-400 text-sm">Budget</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
                disabled={disabled}
              />
              <Button 
                size="sm" 
                onClick={handleBudgetSubmit}
                disabled={disabled}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Set
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-slate-400 text-sm">Win Rate</Label>
            <p className="text-white font-semibold mt-1">{strategy.winRate}%</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-400 text-sm">Profit/Loss</Label>
            <p className={`font-semibold mt-1 ${strategy.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${strategy.profit.toFixed(2)}
            </p>
          </div>
          
          <div>
            <Label className="text-slate-400 text-sm">Trades</Label>
            <p className="text-white font-semibold mt-1">{strategy.trades}</p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-slate-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Status</span>
            <Badge 
              variant={strategy.active ? 'default' : 'secondary'}
              className={strategy.active ? 'bg-green-600' : ''}
            >
              {strategy.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyCard;