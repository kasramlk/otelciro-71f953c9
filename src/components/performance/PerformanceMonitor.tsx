// Performance Monitoring Dashboard
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceMonitor } from '@/hooks/use-performance';
import { Activity, Zap, AlertTriangle, Clock, HardDrive, Wifi } from 'lucide-react';

interface PerformanceData {
  fps: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  network: {
    requests: number;
    errors: number;
    averageTime: number;
  };
  renderTimes: number[];
  componentMetrics: Record<string, {
    renderCount: number;
    totalTime: number;
    averageTime: number;
  }>;
}

export function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 0,
    memory: { used: 0, total: 0, limit: 0 },
    network: { requests: 0, errors: 0, averageTime: 0 },
    renderTimes: [],
    componentMetrics: {}
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const { metrics, getMemoryUsage } = usePerformanceMonitor('PerformanceMonitor');

  // FPS tracking
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const updateFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setPerformanceData(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime))
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(updateFPS);
    };

    if (isRecording) {
      animationId = requestAnimationFrame(updateFPS);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isRecording]);

  // Memory usage tracking
  useEffect(() => {
    const updateMemory = () => {
      const memory = getMemoryUsage();
      if (memory) {
        setPerformanceData(prev => ({
          ...prev,
          memory
        }));
      }
    };

    if (isRecording) {
      updateMemory();
      const interval = setInterval(updateMemory, 2000);
      return () => clearInterval(interval);
    }
  }, [isRecording, getMemoryUsage]);

  // Network performance tracking
  useEffect(() => {
    setPerformanceData(prev => ({
      ...prev,
      network: {
        requests: metrics.networkRequests,
        errors: metrics.errorCount,
        averageTime: prev.network.averageTime // Keep existing average
      }
    }));
  }, [metrics]);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
    if (!isRecording) {
      // Reset data when starting recording
      setPerformanceData(prev => ({
        ...prev,
        renderTimes: [],
        componentMetrics: {}
      }));
    }
  }, [isRecording]);

  const getPerformanceScore = useCallback(() => {
    const { fps, memory } = performanceData;
    let score = 100;
    
    // FPS scoring (60 FPS = perfect)
    if (fps < 30) score -= 30;
    else if (fps < 50) score -= 15;
    
    // Memory scoring
    const memoryUsage = memory.total > 0 ? (memory.used / memory.total) * 100 : 0;
    if (memoryUsage > 80) score -= 25;
    else if (memoryUsage > 60) score -= 10;
    
    // Network scoring
    if (performanceData.network.errors > 0) score -= 20;
    
    return Math.max(0, score);
  }, [performanceData]);

  const score = getPerformanceScore();
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <Badge variant={isRecording ? 'destructive' : 'secondary'}>
            {isRecording ? 'Recording' : 'Stopped'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Performance Score</div>
            <div className={`text-2xl font-bold ${scoreColor}`}>{score}</div>
          </div>
          <Button 
            onClick={toggleRecording}
            variant={isRecording ? 'destructive' : 'default'}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FPS</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.fps}</div>
            <p className="text-xs text-muted-foreground">
              {performanceData.fps >= 60 ? 'Excellent' : 
               performanceData.fps >= 30 ? 'Good' : 'Poor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.memory.used.toFixed(1)}MB
            </div>
            {performanceData.memory.total > 0 && (
              <Progress 
                value={(performanceData.memory.used / performanceData.memory.total) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.network.requests}</div>
            <p className="text-xs text-muted-foreground">
              {performanceData.network.errors} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Render Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.renderTime.toFixed(1)}ms</div>
            <p className="text-xs text-muted-foreground">
              {metrics.renderTime < 16 ? 'Fast' : 
               metrics.renderTime < 33 ? 'Normal' : 'Slow'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Performance</span>
                  <span>{score}/100</span>
                </div>
                <Progress value={score} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Frame Rate:</strong> {performanceData.fps} FPS
                </div>
                <div>
                  <strong>Memory:</strong> {performanceData.memory.used.toFixed(1)}MB
                </div>
                <div>
                  <strong>Network Requests:</strong> {performanceData.network.requests}
                </div>
                <div>
                  <strong>Errors:</strong> {performanceData.network.errors}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Details</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.memory.total > 0 ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Heap Used</span>
                      <span>{performanceData.memory.used.toFixed(1)}MB</span>
                    </div>
                    <Progress 
                      value={(performanceData.memory.used / performanceData.memory.total) * 100} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Used</div>
                      <div>{performanceData.memory.used.toFixed(1)}MB</div>
                    </div>
                    <div>
                      <div className="font-medium">Total</div>
                      <div>{performanceData.memory.total.toFixed(1)}MB</div>
                    </div>
                    <div>
                      <div className="font-medium">Limit</div>
                      <div>{performanceData.memory.limit.toFixed(1)}MB</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Memory API not available in this browser</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Total Requests</div>
                    <div className="text-2xl font-bold">{performanceData.network.requests}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Errors</div>
                    <div className="text-2xl font-bold text-red-600">
                      {performanceData.network.errors}
                    </div>
                  </div>
                </div>
                
                {performanceData.network.averageTime > 0 && (
                  <div>
                    <div className="text-sm font-medium">Average Response Time</div>
                    <div className="text-lg">{performanceData.network.averageTime}ms</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData.fps < 30 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">Low Frame Rate</div>
                      <div className="text-sm text-red-700">
                        Consider reducing complex animations or using virtualization for large lists.
                      </div>
                    </div>
                  </div>
                )}
                
                {performanceData.memory.total > 0 && 
                 (performanceData.memory.used / performanceData.memory.total) > 0.8 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900">High Memory Usage</div>
                      <div className="text-sm text-yellow-700">
                        Memory usage is high. Consider implementing lazy loading or clearing unused data.
                      </div>
                    </div>
                  </div>
                )}
                
                {performanceData.network.errors > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">Network Errors</div>
                      <div className="text-sm text-red-700">
                        Network requests are failing. Check your API endpoints and error handling.
                      </div>
                    </div>
                  </div>
                )}
                
                {score >= 80 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                    <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900">Excellent Performance</div>
                      <div className="text-sm text-green-700">
                        Your application is performing well! Keep up the good work.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}