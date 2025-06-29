import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  loadEventEnd: number;
  domContentLoaded: number;
  networkRequests: number;
  resourceLoadTimes: { [key: string]: number };
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const collectMetrics = async () => {
      // Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, largestContentfulPaint: lastEntry.startTime }));
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            setMetrics(prev => ({ ...prev, firstContentfulPaint: fcpEntry.startTime }));
          }
        }).observe({ entryTypes: ['paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          setMetrics(prev => ({ ...prev, cumulativeLayoutShift: clsValue }));
        }).observe({ entryTypes: ['layout-shift'] });
      }

      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadEventEnd: navigation.loadEventEnd - navigation.fetchStart
        }));
      }

      // Resource timing
      const resources = performance.getEntriesByType('resource');
      const resourceTimes: { [key: string]: number } = {};
      let totalRequests = 0;
      
      resources.forEach((resource: any) => {
        const url = new URL(resource.name);
        const type = resource.initiatorType || 'unknown';
        resourceTimes[`${type}-${url.pathname.split('/').pop()}`] = resource.duration;
        totalRequests++;
      });

      setMetrics(prev => ({
        ...prev,
        networkRequests: totalRequests,
        resourceLoadTimes: resourceTimes
      }));

      // Analyze performance issues
      const newIssues: string[] = [];
      
      if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
        newIssues.push('LCP is slow (>2.5s)');
      }
      
      if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
        newIssues.push('High layout shift detected');
      }
      
      if (metrics.loadEventEnd && metrics.loadEventEnd > 3000) {
        newIssues.push('Page load time is slow (>3s)');
      }
      
      if (totalRequests > 50) {
        newIssues.push(`Too many network requests (${totalRequests})`);
      }

      setIssues(newIssues);
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }
  }, []);

  const formatTime = (time: number | undefined) => {
    if (!time) return 'N/A';
    return `${time.toFixed(0)}ms`;
  };

  const getScoreColor = (metric: string, value: number | undefined) => {
    if (!value) return 'gray';
    
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'green' : value <= 4000 ? 'yellow' : 'red';
      case 'cls':
        return value <= 0.1 ? 'green' : value <= 0.25 ? 'yellow' : 'red';
      case 'load':
        return value <= 2000 ? 'green' : value <= 4000 ? 'yellow' : 'red';
      default:
        return 'gray';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm"
        >
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Performance Monitor</CardTitle>
            <Button onClick={() => setIsVisible(false)} variant="outline" size="sm">
              Hide
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Core Web Vitals */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Core Web Vitals</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">LCP</span>
                <Badge variant={getScoreColor('lcp', metrics.largestContentfulPaint) === 'green' ? 'default' : 'destructive'}>
                  {formatTime(metrics.largestContentfulPaint)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">CLS</span>
                <Badge variant={getScoreColor('cls', metrics.cumulativeLayoutShift) === 'green' ? 'default' : 'destructive'}>
                  {metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">FCP</span>
                <Badge variant="outline">
                  {formatTime(metrics.firstContentfulPaint)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Load Times */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Load Times</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">DOM Ready</span>
                <span className="text-xs font-mono">{formatTime(metrics.domContentLoaded)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Page Load</span>
                <span className="text-xs font-mono">{formatTime(metrics.loadEventEnd)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Requests</span>
                <span className="text-xs font-mono">{metrics.networkRequests || 0}</span>
              </div>
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Issues Found</h4>
              <div className="space-y-1">
                {issues.map((issue, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resource Timing (Top 5 slowest) */}
          {metrics.resourceLoadTimes && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Slowest Resources</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {Object.entries(metrics.resourceLoadTimes)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([name, time]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-xs truncate flex-1">{name}</span>
                      <span className="text-xs font-mono ml-2">{formatTime(time)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}