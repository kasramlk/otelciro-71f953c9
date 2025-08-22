import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Users,
  Activity,
  FileText,
  Download,
  RefreshCw,
  Zap,
  Globe,
  Database,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  securityScore: number;
  activeThreats: number;
  blockedAttempts: number;
  lastScan: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  authentication: {
    mfaEnabled: number;
    totalUsers: number;
    lastLoginAttempts: number;
    failedLogins: number;
  };
  permissions: {
    activeRoles: number;
    excessivePermissions: number;
    unusedAccounts: number;
  };
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'permission_change' | 'data_access' | 'security_alert' | 'system_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  user?: string;
  timestamp: string;
  ipAddress?: string;
  resolved: boolean;
  actionRequired?: boolean;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'authentication' | 'data_protection' | 'access_control' | 'monitoring';
  lastUpdated: string;
  violations: number;
}

const mockSecurityMetrics: SecurityMetrics = {
  securityScore: 87,
  activeThreats: 2,
  blockedAttempts: 45,
  lastScan: '2024-01-16T10:30:00Z',
  vulnerabilities: {
    critical: 0,
    high: 1,
    medium: 3,
    low: 8
  },
  authentication: {
    mfaEnabled: 8,
    totalUsers: 12,
    lastLoginAttempts: 156,
    failedLogins: 5
  },
  permissions: {
    activeRoles: 4,
    excessivePermissions: 2,
    unusedAccounts: 1
  }
};

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login_attempt',
    severity: 'medium',
    title: 'Multiple Failed Login Attempts',
    description: 'User attempted to login 5 times with incorrect credentials',
    user: 'john.doe@hotel.com',
    timestamp: '2024-01-16T10:15:00Z',
    ipAddress: '192.168.1.100',
    resolved: false,
    actionRequired: true
  },
  {
    id: '2',
    type: 'permission_change',
    severity: 'high',
    title: 'Elevated Permissions Granted',
    description: 'Admin role assigned to user account',
    user: 'sarah.johnson@hotel.com',
    timestamp: '2024-01-16T09:45:00Z',
    resolved: true,
    actionRequired: false
  },
  {
    id: '3',
    type: 'data_access',
    severity: 'low',
    title: 'Bulk Data Export',
    description: 'User exported customer data for analytics',
    user: 'mike.chen@hotel.com',
    timestamp: '2024-01-16T09:30:00Z',
    resolved: true,
    actionRequired: false
  },
  {
    id: '4',
    type: 'security_alert',
    severity: 'critical',
    title: 'Suspicious API Activity',
    description: 'Unusual API request patterns detected from external source',
    timestamp: '2024-01-16T08:20:00Z',
    ipAddress: '203.45.67.89',
    resolved: false,
    actionRequired: true
  }
];

const mockSecurityPolicies: SecurityPolicy[] = [
  {
    id: '1',
    name: 'Multi-Factor Authentication',
    description: 'Require MFA for all user accounts',
    enabled: true,
    category: 'authentication',
    lastUpdated: '2024-01-15T00:00:00Z',
    violations: 0
  },
  {
    id: '2',
    name: 'Password Complexity',
    description: 'Enforce strong password requirements',
    enabled: true,
    category: 'authentication',
    lastUpdated: '2024-01-15T00:00:00Z',
    violations: 2
  },
  {
    id: '3',
    name: 'Data Encryption at Rest',
    description: 'Encrypt all sensitive data in database',
    enabled: true,
    category: 'data_protection',
    lastUpdated: '2024-01-15T00:00:00Z',
    violations: 0
  },
  {
    id: '4',
    name: 'Role-Based Access Control',
    description: 'Restrict access based on user roles',
    enabled: true,
    category: 'access_control',
    lastUpdated: '2024-01-15T00:00:00Z',
    violations: 1
  },
  {
    id: '5',
    name: 'Activity Monitoring',
    description: 'Log all user activities for audit',
    enabled: true,
    category: 'monitoring',
    lastUpdated: '2024-01-15T00:00:00Z',
    violations: 0
  },
  {
    id: '6',
    name: 'Session Timeout',
    description: 'Automatically logout inactive users',
    enabled: false,
    category: 'authentication',
    lastUpdated: '2024-01-10T00:00:00Z',
    violations: 0
  }
];

export const SecurityCenter: React.FC = () => {
  const { toast } = useToast();
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>(mockSecurityMetrics);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>(mockSecurityPolicies);
  const [isScanning, setIsScanning] = useState(false);

  const handleRunSecurityScan = async () => {
    setIsScanning(true);
    // Simulate security scan
    setTimeout(() => {
      setSecurityMetrics(prev => ({
        ...prev,
        lastScan: new Date().toISOString(),
        securityScore: Math.min(100, prev.securityScore + Math.floor(Math.random() * 5))
      }));
      setIsScanning(false);
      toast({
        title: "Security Scan Complete",
        description: "No new vulnerabilities detected",
      });
    }, 3000);
  };

  const handleTogglePolicy = (policyId: string) => {
    setSecurityPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, enabled: !policy.enabled, lastUpdated: new Date().toISOString() }
        : policy
    ));
    
    const policy = securityPolicies.find(p => p.id === policyId);
    toast({
      title: `Policy ${policy?.enabled ? 'Disabled' : 'Enabled'}`,
      description: `${policy?.name} has been ${policy?.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const handleResolveEvent = (eventId: string) => {
    setSecurityEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, resolved: true, actionRequired: false } : event
    ));
    
    toast({
      title: "Security Event Resolved",
      description: "The security event has been marked as resolved",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_attempt':
        return <Key className="h-4 w-4" />;
      case 'permission_change':
        return <UserCheck className="h-4 w-4" />;
      case 'data_access':
        return <Database className="h-4 w-4" />;
      case 'security_alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'system_change':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <Key className="h-4 w-4" />;
      case 'data_protection':
        return <Shield className="h-4 w-4" />;
      case 'access_control':
        return <Lock className="h-4 w-4" />;
      case 'monitoring':
        return <Eye className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const activeEvents = securityEvents.filter(event => !event.resolved);
  const criticalEvents = activeEvents.filter(event => event.severity === 'critical');
  const enabledPolicies = securityPolicies.filter(policy => policy.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor security threats, manage policies, and protect your social media platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRunSecurityScan}
            disabled={isScanning}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Run Security Scan'}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Security Report
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">{securityMetrics.securityScore}%</p>
              </div>
              <div className={`p-2 rounded-full ${securityMetrics.securityScore >= 80 ? 'bg-green-100' : securityMetrics.securityScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <Shield className={`h-6 w-6 ${securityMetrics.securityScore >= 80 ? 'text-green-600' : securityMetrics.securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={securityMetrics.securityScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold">{criticalEvents.length}</p>
              </div>
              <AlertTriangle className={`h-6 w-6 ${criticalEvents.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {securityMetrics.blockedAttempts} blocked today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MFA Coverage</p>
                <p className="text-2xl font-bold">
                  {Math.round((securityMetrics.authentication.mfaEnabled / securityMetrics.authentication.totalUsers) * 100)}%
                </p>
              </div>
              <Key className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {securityMetrics.authentication.mfaEnabled}/{securityMetrics.authentication.totalUsers} users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold">{enabledPolicies}</p>
              </div>
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of {securityPolicies.length} total policies
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalEvents.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Alert:</strong> {criticalEvents.length} critical security event(s) require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Events */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Security Events
              </CardTitle>
              <CardDescription>
                Latest security activities and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeEvents.slice(0, 5).map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-1 rounded ${getSeverityColor(event.severity)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {event.user && <span>User: {event.user}</span>}
                            {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      {event.actionRequired && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveEvent(event.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Policies & Vulnerabilities */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Security Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(policy.category)}
                      <div>
                        <p className="text-sm font-medium">{policy.name}</p>
                        <p className="text-xs text-muted-foreground">{policy.description}</p>
                        {policy.violations > 0 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            {policy.violations} violations
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={() => handleTogglePolicy(policy.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Vulnerabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critical</span>
                  <Badge variant={securityMetrics.vulnerabilities.critical > 0 ? "destructive" : "secondary"}>
                    {securityMetrics.vulnerabilities.critical}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">High</span>
                  <Badge variant={securityMetrics.vulnerabilities.high > 0 ? "destructive" : "secondary"}>
                    {securityMetrics.vulnerabilities.high}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium</span>
                  <Badge variant={securityMetrics.vulnerabilities.medium > 0 ? "outline" : "secondary"}>
                    {securityMetrics.vulnerabilities.medium}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low</span>
                  <Badge variant="secondary">
                    {securityMetrics.vulnerabilities.low}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground">
                  Last scan: {new Date(securityMetrics.lastScan).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};