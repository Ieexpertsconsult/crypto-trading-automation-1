import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, TestTube, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';

interface ApiKeyFormProps {
  exchange: 'binance' | 'kucoin' | 'kraken';
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ exchange }) => {
  const { apiKeys, updateApiKey, testConnection, clearApiKey } = useTradingContext();
  const [key, setKey] = useState(apiKeys[exchange].key || '');
  const [secret, setSecret] = useState(apiKeys[exchange].secret || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    if (key.trim() && secret.trim()) {
      updateApiKey(exchange, key.trim(), secret.trim());
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    try {
      await testConnection(exchange);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    clearApiKey(exchange);
    setKey('');
    setSecret('');
  };

  const getStatusBadge = () => {
    const status = apiKeys[exchange].status;
    switch (status) {
      case 'saved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Saved</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="capitalize">{exchange} API Keys</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${exchange}-key`}>API Key</Label>
          <Input
            id={`${exchange}-key`}
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your API key"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${exchange}-secret`}>API Secret</Label>
          <Input
            id={`${exchange}-secret`}
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter your API secret"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1" disabled={!key.trim() || !secret.trim()}>
            <Key className="w-4 h-4 mr-2" />
            Save Keys
          </Button>
          <Button 
            onClick={handleTest} 
            variant="outline" 
            disabled={!apiKeys[exchange].key || !apiKeys[exchange].secret || isLoading}
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isLoading ? 'Testing...' : 'Test'}
          </Button>
          <Button 
            onClick={handleClear} 
            variant="outline" 
            size="icon"
            disabled={!apiKeys[exchange].key && !apiKeys[exchange].secret}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ApiKeyManager: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Key className="w-4 h-4 mr-2" />
          API Keys
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Key Management</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="kraken" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kraken">Kraken</TabsTrigger>
            <TabsTrigger value="binance">Binance</TabsTrigger>
            <TabsTrigger value="kucoin">KuCoin</TabsTrigger>
          </TabsList>
          <TabsContent value="kraken" className="mt-4">
            <ApiKeyForm exchange="kraken" />
          </TabsContent>
          <TabsContent value="binance" className="mt-4">
            <ApiKeyForm exchange="binance" />
          </TabsContent>
          <TabsContent value="kucoin" className="mt-4">
            <ApiKeyForm exchange="kucoin" />
          </TabsContent>
        </Tabs>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Your API keys are stored locally in your browser. For security, ensure your keys have only trading permissions and no withdrawal access.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyManager;