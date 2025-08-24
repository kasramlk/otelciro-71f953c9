import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  UserCheck,
  Database,
  Key,
  Clock,
  FileText,
  Download,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  old_values?: any;
  new_values?: any;
}

export const SecurityAuditCenter = () => {
  const { toast } = useToast();
  const [scanInProgress, setScanInProgress] = useState(false);
  const [lastScanDate, setLastScanDate] = useState<Date | null>(null);

  // Mock security issues - in production, these would come from security scans
  const { data: securityIssues = [] } = useQuery({
    queryKey: ['security-issues'],
    queryFn: async () => {
      const mockIssues: SecurityIssue[] = [
        {
          id: '1',
          severity: 'critical',
          category: 'Authentication',
          title: 'Weak Password Policy',
          description: 'Password policy does not enforce minimum complexity requirements',
          remediation: 'Implement stronger password requirements including length, complexity, and rotation policies',
          status: 'open',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          severity: 'high',
          category: 'Access Control',
          title: 'Missing RBAC on Sensitive Operations',
          description: 'Some administrative functions lack proper role-based access controls',
          remediation: 'Implement RBAC guards on all critical business operations',
          status: 'in_progress',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          severity: 'medium',
          category: 'Data Protection',
          title: 'Insufficient Session Timeout',
          description: 'User sessions do not timeout appropriately for security',
          remediation: 'Implement sliding session timeouts and force re-authentication for sensitive operations',
          status: 'open',
          created_at: new Date().toISOString(),
        }
      ];
      return mockIssues;
    }
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuditEntry[];
    }
  });

  const runSecurityScan = async () => {
    setScanInProgress(true);
    
    try {
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setLastScanDate(new Date());
      
      toast({
        title: "Security Scan Complete",
        description: `Found ${securityIssues.filter(i => i.status === 'open').length} active security issues`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Failed to complete security scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScanInProgress(false);
    }
  };

  const exportAuditLog = () => {
    const csvData = [
      ['Timestamp', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'IP Address'],
      ...auditLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_id || 'System',
        log.action,
        log.entity_type,
        log.entity_id,
        log.ip_address || 'N/A'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Audit Log Exported",
      description: "Audit log has been exported successfully",
    });
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Critical' },
      high: { variant: 'destructive' as const, icon: AlertTriangle, label: 'High' },
      medium: { variant: 'secondary' as const, icon: AlertTriangle, label: 'Medium' },
      low: { variant: 'outline' as const, icon: AlertTriangle, label: 'Low' }
    };
    
    return variants[severity as keyof typeof variants] || variants.low;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  // Security metrics
  const criticalIssues = securityIssues.filter(i => i.severity === 'critical' && i.status === 'open').length;
  const highIssues = securityIssues.filter(i => i.severity === 'high' && i.status === 'open').length;
  const resolvedIssues = securityIssues.filter(i => i.status === 'resolved').length;
  const totalIssues = securityIssues.length;
  const securityScore = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Center
              </CardTitle>
              <CardDescription>
                Monitor security posture and compliance status
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={runSecurityScan}
                disabled={scanInProgress}
              >
                {scanInProgress ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {scanInProgress ? 'Scanning...' : 'Run Scan'}
              </Button>
              <Button variant="outline" onClick={exportAuditLog}>
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Security Score */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Security Score</h4>
              <span className={`text-2xl font-bold ${
                securityScore >= 90 ? 'text-green-600' : 
                securityScore >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {securityScore}%
              </span>
            </div>
            <Progress value={securityScore} className="h-2" />
            {lastScanDate && (
              <p className="text-sm text-muted-foreground">
                Last scan: {format(lastScanDate, 'PPP p')}
              </p>
            )}
          </div>

          {/* Critical Alerts */}
          {(criticalIssues > 0 || highIssues > 0) && (
            <Alert className="mt-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Immediate Attention Required:</strong> {criticalIssues} critical and {highIssues} high severity security issues detected.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
            <p className="text-xs text-muted-foreground">Critical Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{highIssues}</div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Audit Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Details */}
      <Tabs defaultValue="issues" className="space-y-6">
        <TabsList>
          <TabsTrigger value="issues">Security Issues</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Security Issues</CardTitle>
              <CardDescription>
                Active security vulnerabilities and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityIssues.map((issue) => {
                  const severityBadge = getSeverityBadge(issue.severity);
                  const SeverityIcon = severityBadge.icon;
                  
                  return (
                    <div
                      key={issue.id}
                      className={`p-4 border rounded-lg ${
                        issue.severity === 'critical' 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
                          : issue.severity === 'high'
                          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(issue.status)}
                            <h4 className="font-medium">{issue.title}</h4>
                            <Badge variant={severityBadge.variant}>
                              <SeverityIcon className="h-3 w-3 mr-1" />
                              {severityBadge.label}
                            </Badge>
                            <Badge variant="outline">{issue.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {issue.description}
                          </p>
                          <div className="text-sm">
                            <strong>Remediation:</strong> {issue.remediation}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(issue.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {securityIssues.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>No security issues detected. Your system is secure!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Complete log of user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.entity_type} • {log.entity_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{log.user_id || 'System'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No audit entries found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                GDPR, PCI DSS, and other regulatory compliance checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>GDPR Compliance</span>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compliant
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Data Retention</span>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span>Encryption at Rest</span>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Access Logging</span>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                </div>
                
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Your system meets the basic requirements for data protection and privacy compliance.
                    Regular security reviews are recommended to maintain compliance.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};