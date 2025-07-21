import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, XCircle, Info, Trash2, Download } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  source?: string;
}

const ErrorLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Set up global error logging function
    (window as any).logError = (type: 'error' | 'warning' | 'info', message: string, details?: string, source?: string) => {
      const newLog: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type,
        message,
        details,
        source
      };
      
      setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep only last 100 logs
    };

    // Log initial message
    (window as any).logError('info', 'Error logging system initialized', 'Ready to capture trading errors');

    return () => {
      delete (window as any).logError;
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => filter === 'all' || log.type === filter);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getLogBadgeVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const clearLogs = () => {
    setLogs([]);
    (window as any).logError('info', 'Error logs cleared');
  };

  const exportLogs = () => {
    const logData = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      type: log.type,
      message: log.message,
      details: log.details,
      source: log.source
    }));
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const errorCount = logs.filter(log => log.type === 'error').length;
  const warningCount = logs.filter(log => log.type === 'warning').length;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Logger
            {errorCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {errorCount} errors
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {warningCount} warnings
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(['all', 'error', 'warning', 'info'] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              className="capitalize"
            >
              {type}
              {type !== 'all' && (
                <Badge variant="secondary" className="ml-1">
                  {logs.filter(log => log.type === type).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll to latest
          </label>
        </div>
        
        <ScrollArea className="h-96" ref={scrollRef}>
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                {filter === 'all' ? 'No logs yet' : `No ${filter} logs`}
              </p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLogBadgeVariant(log.type)} className="text-xs">
                          {log.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.source && (
                          <Badge variant="outline" className="text-xs">
                            {log.source}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 break-words">{log.message}</p>
                      {log.details && (
                        <pre className="text-xs text-slate-400 mt-2 bg-slate-800 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {log.details}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {logs.length > 0 && (
          <div className="text-xs text-slate-400 text-center">
            Showing {filteredLogs.length} of {logs.length} total logs
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorLogger;