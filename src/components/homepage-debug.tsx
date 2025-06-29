import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info } from "@/lib/icons";

interface DebugInfo {
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

export default function HomepageDebug() {
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    componentCount: 0,
  });

  const addLog = (type: DebugInfo['type'], message: string, details?: any) => {
    setDebugLogs(prev => [...prev, {
      timestamp: Date.now(),
      type,
      message,
      details
    }]);
  };

  useEffect(() => {
    // Performance monitoring
    const startTime = performance.now();
    
    // Monitor page load
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({ ...prev, loadTime }));
      addLog('success', `Page loaded in ${loadTime.toFixed(2)}ms`);
    };

    // Monitor React rendering
    const renderStart = performance.now();
    setTimeout(() => {
      const renderTime = performance.now() - renderStart;
      setPerformanceMetrics(prev => ({ ...prev, renderTime }));
      addLog('info', `React render completed in ${renderTime.toFixed(2)}ms`);
    }, 0);

    // Check for errors in console
    const originalError = console.error;
    console.error = (...args) => {
      addLog('error', 'Console error detected', args);
      originalError.apply(console, args);
    };

    // Check API endpoints
    const testEndpoints = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          addLog('success', 'API endpoints accessible');
        } else {
          addLog('warning', `API returned ${response.status}`);
        }
      } catch (error) {
        addLog('error', 'API endpoint test failed', error);
      }
    };

    // Initialize checks
    addLog('info', 'Homepage debug system initialized');
    handleLoad();
    testEndpoints();

    return () => {
      console.error = originalError;
    };
  }, []);

  // Check DOM structure
  useEffect(() => {
    const checkDOM = () => {
      const componentCount = document.querySelectorAll('[data-testid], [class*="component"]').length;
      setPerformanceMetrics(prev => ({ ...prev, componentCount }));
      
      // Check for broken images
      const images = document.querySelectorAll('img');
      let brokenImages = 0;
      images.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
          brokenImages++;
        }
      });
      
      if (brokenImages > 0) {
        addLog('warning', `Found ${brokenImages} broken images`);
      } else {
        addLog('success', 'All images loaded successfully');
      }
      
      // Check for accessibility issues
      const missingAlt = document.querySelectorAll('img:not([alt])').length;
      if (missingAlt > 0) {
        addLog('warning', `${missingAlt} images missing alt text`);
      }
      
      addLog('info', `DOM check complete: ${componentCount} components found`);
    };

    const timer = setTimeout(checkDOM, 1000);
    return () => clearTimeout(timer);
  }, []);

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const getIcon = (type: DebugInfo['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBadgeVariant = (type: DebugInfo['type']) => {
    switch (type) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm"
        >
          Debug Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Homepage Debug</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={clearLogs} variant="outline" size="sm">
                Clear
              </Button>
              <Button onClick={() => setIsVisible(false)} variant="outline" size="sm">
                Hide
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Performance</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-mono">{performanceMetrics.loadTime.toFixed(0)}ms</div>
                <div className="text-gray-500">Load</div>
              </div>
              <div className="text-center">
                <div className="font-mono">{performanceMetrics.renderTime.toFixed(0)}ms</div>
                <div className="text-gray-500">Render</div>
              </div>
              <div className="text-center">
                <div className="font-mono">{performanceMetrics.componentCount}</div>
                <div className="text-gray-500">Components</div>
              </div>
            </div>
          </div>

          {/* Debug Logs */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Debug Logs</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {debugLogs.slice(-10).map((log, index) => (
                <div key={index} className="flex items-start space-x-2 text-xs">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getBadgeVariant(log.type)} className="text-xs">
                        {log.type}
                      </Badge>
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1 text-gray-700">{log.message}</div>
                    {log.details && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-500">Details</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}