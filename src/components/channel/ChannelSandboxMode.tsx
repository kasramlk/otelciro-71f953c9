import { useState } from "react";
import { motion } from "framer-motion";
import { useChannelStore } from "@/stores/channel-store";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  TestTube,
  Shield,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Zap,
  Clock
} from "lucide-react";

interface ChannelSandboxModeProps {
  channelId?: string;
}

export const ChannelSandboxMode = ({ channelId }: ChannelSandboxModeProps) => {
  const { toast } = useToast();
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [lastTestRun, setLastTestRun] = useState<Date | null>(null);

  const { 
    channelMappings, 
    addAuditEntry
  } = useChannelStore();

  const currentChannel = null; // Mock for demo

  const handleToggleSandbox = (enabled: boolean) => {
    setSandboxEnabled(enabled);
    
    addAuditEntry({
      actor: 'User',
      action: enabled ? 'Enable Sandbox Mode' : 'Disable Sandbox Mode',
      entityType: 'Channel',
      entityId: channelId || 'all',
      summary: `${enabled ? 'Enabled' : 'Disabled'} sandbox mode for channel management`,
      payload: { sandboxEnabled: enabled, channelId }
    });

    toast({
      title: enabled ? "Sandbox Mode Enabled" : "Sandbox Mode Disabled",
      description: enabled 
        ? "All channel operations are now simulated. No real data will be pushed."
        : "Channel operations will now affect live systems.",
      variant: enabled ? "default" : "destructive"
    });
  };

  const runSandboxTest = async () => {
    setTestRunning(true);
    const startTime = Date.now();
    
    try {
      const testCases = [
        {
          name: "Rate Push Test",
          description: "Test rate and inventory push to channel",
          type: "rate_push"
        },
        {
          name: "Reservation Fetch Test", 
          description: "Test reservation import from channel",
          type: "reservation_fetch"
        },
        {
          name: "Mapping Validation Test",
          description: "Validate all product mappings",
          type: "mapping_validation"
        },
        {
          name: "Authentication Test",
          description: "Test channel API authentication",
          type: "auth_test"
        }
      ];

      const results = [];
      
      for (const testCase of testCases) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API calls
        
        const success = Math.random() > 0.2; // 80% success rate for demo
        const latency = Math.floor(Math.random() * 500) + 100;
        
        results.push({
          ...testCase,
          success,
          latency,
          timestamp: new Date(),
          details: success 
            ? `Test completed successfully in ${latency}ms`
            : `Test failed - ${['Authentication error', 'Mapping not found', 'Rate validation failed', 'Connection timeout'][Math.floor(Math.random() * 4)]}`
        });
      }
      
      setTestResults(results);
      setLastTestRun(new Date());
      
      const successCount = results.filter(r => r.success).length;
      const totalTests = results.length;
      
      toast({
        title: "Sandbox Test Complete",
        description: `${successCount}/${totalTests} tests passed in ${Date.now() - startTime}ms`,
        variant: successCount === totalTests ? "default" : "destructive"
      });

      addAuditEntry({
        actor: 'System',
        action: 'Sandbox Test Completed',
        entityType: 'Channel',
        entityId: channelId || 'all',
        summary: `Completed sandbox test suite - ${successCount}/${totalTests} tests passed`,
        payload: { results, duration: Date.now() - startTime }
      });
      
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to run sandbox tests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTestRunning(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
    setLastTestRun(null);
    toast({
      title: "Test Results Cleared",
      description: "All sandbox test results have been cleared."
    });
  };

  const getTestStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  const mappingCompleteness = channelMappings.length > 0 
    ? Math.round((channelMappings.filter(m => m.gdsProductCode).length / channelMappings.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Sandbox Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Channel Sandbox Mode
            {sandboxEnabled && (
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                SANDBOX
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Test channel operations safely without affecting live systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sandbox-mode"
                  checked={sandboxEnabled}
                  onCheckedChange={handleToggleSandbox}
                />
                <Label htmlFor="sandbox-mode" className="font-medium">
                  Enable Sandbox Mode
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, all channel operations will be simulated
              </p>
            </div>
            {sandboxEnabled ? (
              <Shield className="h-8 w-8 text-green-600" />
            ) : (
              <Zap className="h-8 w-8 text-amber-600" />
            )}
          </div>

          {sandboxEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sandbox mode is active. All channel pushes and data operations are simulated. 
                No real data will be sent to external systems.
              </AlertDescription>
            </Alert>
          )}

          {!sandboxEnabled && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10">
              <Zap className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Live mode is active. All operations will affect real channel data.
              </AlertDescription>
            </Alert>
          )}

          {/* Channel Status Overview */}
          <div className="space-y-4">
            <h4 className="font-medium">Channel Status</h4>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {channelMappings.filter(m => m.gdsProductCode).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Connected Channels</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {mappingCompleteness}%
                  </div>
                  <p className="text-xs text-muted-foreground">Mapping Complete</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResults.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Tests Run</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Test Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Sandbox Testing</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runSandboxTest}
                  disabled={testRunning || !sandboxEnabled}
                >
                  {testRunning ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Tests
                    </>
                  )}
                </Button>
                {testResults.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearTestResults}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {!sandboxEnabled && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Enable sandbox mode to run safe channel tests
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Test Results
              </span>
              {lastTestRun && (
                <span className="text-sm text-muted-foreground">
                  Last run: {lastTestRun.toLocaleTimeString()}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getTestStatusIcon(result.success)}
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{result.latency}ms</p>
                    <p className="text-xs text-muted-foreground">{result.details}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Test Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {testResults.filter(r => r.success).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {testResults.filter(r => !r.success).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(testResults.reduce((sum, r) => sum + r.latency, 0) / testResults.length)}ms
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Latency</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};