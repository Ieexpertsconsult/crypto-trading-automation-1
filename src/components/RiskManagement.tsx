import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingDown, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RiskSettings {
  maxDailyLoss: number;
  maxPositionSize: number;
  stopLossEnabled: boolean;
  takeProfitEnabled: boolean;
  maxDrawdown: number;
  riskPerTrade: number;
  emergencyStop: boolean;
}

const RiskManagement: React.FC = () => {
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    maxDailyLoss: 500,
    maxPositionSize: 25,
    stopLossEnabled: true,
    takeProfitEnabled: true,
    maxDrawdown: 10,
    riskPerTrade: 2,
    emergencyStop: false,
  });

  const [currentDrawdown] = useState(3.2);
  const [dailyLoss] = useState(125.50);
  const [riskScore] = useState(6.8);

  const updateSetting = (key: keyof RiskSettings, value: number | boolean) => {
    setRiskSettings(prev => ({ ...prev, [key]: value }));
  };

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { level: 'Low', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score <= 7) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'High', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const risk = getRiskLevel(riskScore);

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-slate-300 text-sm">Risk Level</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${risk.bg} ${risk.color}`}>
                {risk.level}
              </Badge>
              <span className="text-white font-bold">{riskScore}/10</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-orange-400" />
              <span className="text-slate-300 text-sm">Current Drawdown</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{currentDrawdown}%</span>
              <div className={`w-2 h-2 rounded-full ${
                currentDrawdown < 5 ? 'bg-green-400' : 
                currentDrawdown < 8 ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-slate-300 text-sm">Daily Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-400">${dailyLoss}</span>
              <span className="text-xs text-slate-400">/ ${riskSettings.maxDailyLoss}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Risk Management Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emergency Stop */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div>
              <Label className="text-white font-semibold">Emergency Stop</Label>
              <p className="text-sm text-slate-400">Immediately halt all trading activities</p>
            </div>
            <Switch 
              checked={riskSettings.emergencyStop}
              onCheckedChange={(value) => updateSetting('emergencyStop', value)}
            />
          </div>

          {/* Max Daily Loss */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger>
                  <Label className="text-white cursor-help">Max Daily Loss ($)</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum amount you're willing to lose in a single day</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-white font-semibold">${riskSettings.maxDailyLoss}</span>
            </div>
            <Slider
              value={[riskSettings.maxDailyLoss]}
              onValueChange={(value) => updateSetting('maxDailyLoss', value[0])}
              max={2000}
              min={100}
              step={50}
              className="w-full"
            />
          </div>

          {/* Max Position Size */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger>
                  <Label className="text-white cursor-help">Max Position Size (%)</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum percentage of portfolio to risk in a single position</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-white font-semibold">{riskSettings.maxPositionSize}%</span>
            </div>
            <Slider
              value={[riskSettings.maxPositionSize]}
              onValueChange={(value) => updateSetting('maxPositionSize', value[0])}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          {/* Risk Per Trade */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger>
                  <Label className="text-white cursor-help">Risk Per Trade (%)</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of account balance to risk per individual trade</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-white font-semibold">{riskSettings.riskPerTrade}%</span>
            </div>
            <Slider
              value={[riskSettings.riskPerTrade]}
              onValueChange={(value) => updateSetting('riskPerTrade', value[0])}
              max={10}
              min={0.5}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Max Drawdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger>
                  <Label className="text-white cursor-help">Max Drawdown (%)</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum acceptable drawdown before auto-pause</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-white font-semibold">{riskSettings.maxDrawdown}%</span>
            </div>
            <Slider
              value={[riskSettings.maxDrawdown]}
              onValueChange={(value) => updateSetting('maxDrawdown', value[0])}
              max={25}
              min={5}
              step={1}
              className="w-full"
            />
          </div>

          {/* Stop Loss & Take Profit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <Label className="text-white">Auto Stop-Loss</Label>
                <p className="text-xs text-slate-400">Automatic stop-loss orders</p>
              </div>
              <Switch 
                checked={riskSettings.stopLossEnabled}
                onCheckedChange={(value) => updateSetting('stopLossEnabled', value)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <Label className="text-white">Auto Take-Profit</Label>
                <p className="text-xs text-slate-400">Automatic profit-taking</p>
              </div>
              <Switch 
                checked={riskSettings.takeProfitEnabled}
                onCheckedChange={(value) => updateSetting('takeProfitEnabled', value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              Save Settings
            </Button>
            <Button variant="outline" className="flex-1">
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskManagement;