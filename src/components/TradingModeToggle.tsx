import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';

const TradingModeToggle: React.FC = () => {
  const { isLiveMode, setIsLiveMode, showLiveWarning, setShowLiveWarning } = useTradingContext();

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setShowLiveWarning(true);
    } else {
      setIsLiveMode(false);
      localStorage.setItem('tradingMode', 'paper');
    }
  };

  const confirmLiveMode = () => {
    setIsLiveMode(true);
    setShowLiveWarning(false);
    localStorage.setItem('tradingMode', 'live');
  };

  const cancelLiveMode = () => {
    setShowLiveWarning(false);
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="trading-mode"
            checked={isLiveMode}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="trading-mode" className="text-sm font-medium text-white">
            Trading Mode
          </Label>
        </div>
        <Badge 
          variant={isLiveMode ? "destructive" : "secondary"}
          className={isLiveMode ? "bg-red-500 text-white" : ""}
        >
          {isLiveMode ? 'LIVE' : 'PAPER'}
        </Badge>
      </div>

      <AlertDialog open={showLiveWarning} onOpenChange={setShowLiveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Live Trading Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">You are about to enable LIVE trading mode.</p>
              <p>This means:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Real money will be used for trades</li>
                <li>All orders will be executed on actual exchanges</li>
                <li>You can lose money if strategies perform poorly</li>
                <li>Market volatility can cause significant losses</li>
              </ul>
              <p className="text-sm font-medium text-red-600 mt-4">
                Only enable live trading if you understand the risks and have tested your strategies thoroughly in paper mode.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLiveMode}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLiveMode}
              className="bg-red-600 hover:bg-red-700"
            >
              I Understand - Enable Live Trading
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TradingModeToggle;