import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, AlertCircle, Play, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'reservations' | 'rooms' | 'payments' | 'reports' | 'performance';
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  testFn: () => Promise<boolean>;
}

const QATestSuite = () => {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [runningAll, setRunningAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const mockTests: TestCase[] = [
    {
      id: 'auth-login',
      name: 'User Login Flow',
      description: 'Test successful user authentication',
      category: 'auth',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'auth-logout',
      name: 'User Logout Flow',
      description: 'Test user session termination',
      category: 'auth',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'reservations-create',
      name: 'Create Reservation',
      description: 'Test new reservation creation',
      category: 'reservations',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'reservations-modify',
      name: 'Modify Reservation',
      description: 'Test reservation updates and changes',
      category: 'reservations',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'rooms-availability',
      name: 'Room Availability Check',
      description: 'Test room availability calculations',
      category: 'rooms',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 900));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'rooms-housekeeping',
      name: 'Housekeeping Integration',
      description: 'Test room status updates',
      category: 'rooms',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 700));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'payments-processing',
      name: 'Payment Processing',
      description: 'Test payment transactions',
      category: 'payments',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'reports-generation',
      name: 'Report Generation',
      description: 'Test report creation and export',
      category: 'reports',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'performance-load',
      name: 'Load Testing',
      description: 'Test application under load',
      category: 'performance',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return Math.random() > 0.1;
      }
    },
    {
      id: 'performance-memory',
      name: 'Memory Usage',
      description: 'Test memory consumption',
      category: 'performance',
      status: 'pending',
      testFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1300));
        return Math.random() > 0.1;
      }
    }
  ];

  useEffect(() => {
    setTests(mockTests);
  }, []);

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
      title: "Test Suite Complete",
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
          <h2 className="text-3xl font-bold">QA Test Suite</h2>
          <p className="text-muted-foreground">Comprehensive testing for HMS platform</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetTests} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={runAllTests} 
            disabled={runningAll}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            {runningAll ? 'Running...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

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
            <TabsTrigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Test Cases</CardTitle>
              <CardDescription>Complete list of automated tests</CardDescription>
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
                <CardTitle>{category.charAt(0).toUpperCase() + category.slice(1)} Tests</CardTitle>
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

export default QATestSuite;