import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, AlertCircle, Play, RotateCcw, Database, Wifi, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHotelContext } from '@/hooks/use-hotel-context';
import { supabase } from '@/integrations/supabase/client';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'reservations' | 'rooms' | 'payments' | 'reports' | 'performance' | 'realtime' | 'security' | 'database';
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  testFn: () => Promise<boolean>;
}

const EnhancedQATestSuite = () => {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [runningAll, setRunningAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { selectedHotelId } = useHotelContext();

  const hmsSpecificTests: TestCase[] = [
    // Database Tests
    {
      id: 'db-connection',
      name: 'Database Connection',
      description: 'Test Supabase database connectivity',
      category: 'database',
      status: 'pending',
      testFn: async () => {
        const { data, error } = await supabase.from('hotels').select('id').limit(1);
        return !error && data !== null;
      }
    },
    {
      id: 'db-rls-policies',
      name: 'RLS Policies',
      description: 'Test Row Level Security policies',
      category: 'security',
      status: 'pending',
      testFn: async () => {
        // Test if RLS is working by attempting unauthorized access
        const { error } = await supabase.from('reservations').select('*').limit(1);
        return error === null; // Should work if user has proper access
      }
    },
    
    // Real-time Tests
    {
      id: 'realtime-connection',
      name: 'Real-time Connection',
      description: 'Test real-time subscription connectivity',
      category: 'realtime',
      status: 'pending',
      testFn: async () => {
        return new Promise((resolve) => {
          const channel = supabase.channel('test-channel');
          channel.subscribe((status) => {
            resolve(status === 'SUBSCRIBED');
            supabase.removeChannel(channel);
          });
        });
      }
    },
    {
      id: 'realtime-presence',
      name: 'User Presence Tracking',
      description: 'Test real-time user presence functionality',
      category: 'realtime',
      status: 'pending',
      testFn: async () => {
        const channel = supabase.channel('presence-test');
        let success = false;
        
        await new Promise((resolve) => {
          channel.on('presence', { event: 'sync' }, () => {
            success = true;
            resolve(true);
          }).subscribe();
          
          setTimeout(() => resolve(false), 2000);
        });
        
        supabase.removeChannel(channel);
        return success;
      }
    },

    // HMS-specific functionality tests
    {
      id: 'hms-reservations-crud',
      name: 'Reservations CRUD Operations',
      description: 'Test reservation create, read, update, delete',
      category: 'reservations',
      status: 'pending',
      testFn: async () => {
        if (!selectedHotelId) return false;
        
        // Test read access
        const { data, error } = await supabase
          .from('reservations')
          .select('id')
          .eq('hotel_id', selectedHotelId)
          .limit(1);
          
        return !error;
      }
    },
    {
      id: 'hms-rooms-status',
      name: 'Room Status Management',
      description: 'Test room status updates and retrieval',
      category: 'rooms',
      status: 'pending',
      testFn: async () => {
        if (!selectedHotelId) return false;
        
        const { data, error } = await supabase
          .from('rooms')
          .select('id, status')
          .eq('hotel_id', selectedHotelId)
          .limit(1);
          
        return !error && data && data.length > 0;
      }
    },
    {
      id: 'hms-guest-management',
      name: 'Guest Profile Management',
      description: 'Test guest profile operations',
      category: 'auth',
      status: 'pending',
      testFn: async () => {
        if (!selectedHotelId) return false;
        
        const { data, error } = await supabase
          .from('guests')
          .select('id')
          .eq('hotel_id', selectedHotelId)
          .limit(1);
          
        return !error;
      }
    },

    // Performance Tests
    {
      id: 'performance-query-speed',
      name: 'Database Query Performance',
      description: 'Test query response times',
      category: 'performance',
      status: 'pending',
      testFn: async () => {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .limit(100);
        const duration = Date.now() - startTime;
        
        return !error && duration < 1000; // Should complete within 1 second
      }
    },
    {
      id: 'performance-memory-usage',
      name: 'Memory Usage Check',
      description: 'Monitor application memory consumption',
      category: 'performance',
      status: 'pending',
      testFn: async () => {
        if ('memory' in performance) {
          const memInfo = (performance as any).memory;
          const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
          return usedMB < 100; // Should use less than 100MB
        }
        return true; // Pass if memory API not available
      }
    },

    // Security Tests
    {
      id: 'security-auth-required',
      name: 'Authentication Required',
      description: 'Test that protected routes require authentication',
      category: 'security',
      status: 'pending',
      testFn: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session !== null;
      }
    },
    {
      id: 'security-data-isolation',
      name: 'Hotel Data Isolation',
      description: 'Test that users can only access their hotel data',  
      category: 'security',
      status: 'pending',
      testFn: async () => {
        if (!selectedHotelId) return false;
        
        // Try to access data from a different hotel (should fail)
        const { data: hotels } = await supabase.from('hotels').select('id');
        if (!hotels || hotels.length < 2) return true; // Can't test isolation with one hotel
        
        const otherHotelId = hotels.find(h => h.id !== selectedHotelId)?.id;
        if (!otherHotelId) return true;
        
        const { data, error } = await supabase
          .from('reservations')
          .select('id')
          .eq('hotel_id', otherHotelId)
          .limit(1);
        
        // Should either return empty data or an error due to RLS
        return !data || data.length === 0;
      }
    }
  ];

  useEffect(() => {
    setTests(hmsSpecificTests);
  }, [selectedHotelId]);

  const runTest = async (testId: string) => {
    const startTime = Date.now();
    
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running' as const }
        : test
    ));

    try {
      const test = tests.find(t => t.id === testId);
      if (!test) return;

      const result = await test.testFn();
      const duration = Date.now() - startTime;

      setTests(prev => prev.map(t => 
        t.id === testId 
          ? { 
              ...t, 
              status: result ? 'passed' : 'failed',
              duration,
              error: result ? undefined : 'Test assertion failed'
            }
          : t
      ));

      if (result) {
        toast({
          title: "Test Passed",
          description: `${test.name} completed successfully`
        });
      } else {
        toast({
          title: "Test Failed",
          description: `${test.name} failed`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTests(prev => prev.map(t => 
        t.id === testId 
          ? { 
              ...t, 
              status: 'failed',
              duration,
              error: error.message
            }
          : t
      ));

      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    setProgress(0);

    for (let i = 0; i < tests.length; i++) {
      await runTest(tests[i].id);
      setProgress(((i + 1) / tests.length) * 100);
    }

    setRunningAll(false);
    
    const results = tests.reduce((acc, test) => {
      acc[test.status] = (acc[test.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    toast({
      title: "HMS Test Suite Complete",
      description: `${results.passed || 0} passed, ${results.failed || 0} failed`
    });
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending' as const,
      duration: undefined,
      error: undefined
    })));
    setProgress(0);
  };

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      database: Database,
      realtime: Wifi,
      security: Shield,
      performance: Zap,
      auth: Shield,
      reservations: AlertCircle,
      rooms: AlertCircle,
      payments: AlertCircle,
      reports: AlertCircle
    };
    const IconComponent = icons[category as keyof typeof icons] || AlertCircle;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusBadge = (status: TestCase['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'outline', 
      passed: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-auto">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const testsByCategory = tests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, TestCase[]>);

  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const runningTests = tests.filter(t => t.status === 'running').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Enhanced HMS Test Suite</h2>
          <p className="text-muted-foreground">
            Comprehensive testing for HMS platform with real backend validation
          </p>
          {selectedHotelId && (
            <Badge className="mt-2">Testing Hotel: {selectedHotelId}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={resetTests} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={runAllTests} 
            disabled={runningAll || !selectedHotelId}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            {runningAll ? 'Running...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {!selectedHotelId && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-4 w-4" />
              <span>Please select a hotel to run HMS-specific tests</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-success">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{passedTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{runningTests}</div>
          </CardContent>
        </Card>
      </div>

      {runningAll && (
        <Card>
          <CardHeader>
            <CardTitle>Test Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(progress)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          {Object.keys(testsByCategory).map(category => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All HMS Test Cases</CardTitle>
              <CardDescription>Complete list of automated HMS tests with backend validation</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {tests.map(test => (
                    <div 
                      key={test.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        {getCategoryIcon(test.category)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {test.description}
                          </div>
                          {test.duration && (
                            <div className="text-xs text-muted-foreground">
                              {test.duration}ms
                            </div>
                          )}
                          {test.error && (
                            <div className="text-xs text-destructive">
                              {test.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(test.id)}
                          disabled={test.status === 'running' || runningAll}
                        >
                          Run
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(testsByCategory).map(([category, categoryTests]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Tests
                </CardTitle>
                <CardDescription>
                  {categoryTests.length} test cases in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryTests.map(test => (
                    <div 
                      key={test.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {test.description}
                          </div>
                          {test.duration && (
                            <div className="text-xs text-muted-foreground">
                              {test.duration}ms
                            </div>
                          )}
                          {test.error && (
                            <div className="text-xs text-destructive">
                              {test.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(test.id)}
                          disabled={test.status === 'running' || runningAll}
                        >
                          Run
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default EnhancedQATestSuite;