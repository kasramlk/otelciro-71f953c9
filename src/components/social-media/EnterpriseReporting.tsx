import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Send, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Users,
  DollarSign,
  Target,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'engagement' | 'financial' | 'compliance' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  metrics: string[];
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel' | 'json';
  isActive: boolean;
  lastGenerated?: string;
  nextScheduled?: string;
  createdBy: string;
  createdAt: string;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  category: string;
  format: string;
  status: 'generating' | 'completed' | 'failed' | 'sent';
  generatedAt: string;
  fileSize?: string;
  downloadUrl?: string;
  recipients?: string[];
  error?: string;
}

interface ReportMetric {
  id: string;
  name: string;
  description: string;
  category: string;
  dataType: 'number' | 'percentage' | 'currency' | 'text';
  available: boolean;
}

const mockReportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Weekly Performance Summary',
    description: 'Comprehensive weekly performance report across all social media platforms',
    category: 'performance',
    frequency: 'weekly',
    metrics: ['engagement_rate', 'reach', 'impressions', 'clicks', 'followers_growth'],
    recipients: ['manager@hotel.com', 'marketing@hotel.com'],
    format: 'pdf',
    isActive: true,
    lastGenerated: '2024-01-15T09:00:00Z',
    nextScheduled: '2024-01-22T09:00:00Z',
    createdBy: 'Sarah Johnson',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Monthly ROI Analysis',
    description: 'Detailed analysis of social media return on investment',
    category: 'financial',
    frequency: 'monthly',
    metrics: ['revenue_generated', 'cost_per_acquisition', 'conversion_rate', 'ad_spend', 'organic_reach'],
    recipients: ['ceo@hotel.com', 'finance@hotel.com'],
    format: 'excel',
    isActive: true,
    lastGenerated: '2024-01-01T09:00:00Z',
    nextScheduled: '2024-02-01T09:00:00Z',
    createdBy: 'Mike Chen',
    createdAt: '2023-12-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Daily Engagement Metrics',
    description: 'Quick daily summary of engagement across platforms',
    category: 'engagement',
    frequency: 'daily',
    metrics: ['likes', 'comments', 'shares', 'mentions', 'sentiment_score'],
    recipients: ['social@hotel.com'],
    format: 'csv',
    isActive: true,
    lastGenerated: '2024-01-16T09:00:00Z',
    nextScheduled: '2024-01-17T09:00:00Z',
    createdBy: 'Emma Wilson',
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    id: '4',
    name: 'Compliance Audit Report',
    description: 'Monthly compliance and security audit report',
    category: 'compliance',
    frequency: 'monthly',
    metrics: ['security_score', 'policy_violations', 'data_breaches', 'access_reviews'],
    recipients: ['legal@hotel.com', 'security@hotel.com'],
    format: 'pdf',
    isActive: false,
    createdBy: 'David Park',
    createdAt: '2023-11-20T00:00:00Z'
  }
];

const mockGeneratedReports: GeneratedReport[] = [
  {
    id: '1',
    templateId: '1',
    name: 'Weekly Performance Summary - Jan 15, 2024',
    category: 'performance',
    format: 'pdf',
    status: 'completed',
    generatedAt: '2024-01-15T09:00:00Z',
    fileSize: '2.4 MB',
    downloadUrl: '/reports/weekly-performance-20240115.pdf',
    recipients: ['manager@hotel.com', 'marketing@hotel.com']
  },
  {
    id: '2',
    templateId: '3',
    name: 'Daily Engagement Metrics - Jan 16, 2024',
    category: 'engagement',
    format: 'csv',
    status: 'completed',
    generatedAt: '2024-01-16T09:00:00Z',
    fileSize: '0.8 MB',
    downloadUrl: '/reports/daily-engagement-20240116.csv',
    recipients: ['social@hotel.com']
  },
  {
    id: '3',
    templateId: '2',
    name: 'Monthly ROI Analysis - Jan 2024',
    category: 'financial',
    format: 'excel',
    status: 'generating',
    generatedAt: '2024-01-16T10:30:00Z'
  },
  {
    id: '4',
    templateId: '1',
    name: 'Weekly Performance Summary - Jan 8, 2024',
    category: 'performance',
    format: 'pdf',
    status: 'failed',
    generatedAt: '2024-01-08T09:00:00Z',
    error: 'Insufficient data for the selected time period'
  }
];

const availableMetrics: ReportMetric[] = [
  { id: 'engagement_rate', name: 'Engagement Rate', description: 'Overall engagement rate across platforms', category: 'engagement', dataType: 'percentage', available: true },
  { id: 'reach', name: 'Total Reach', description: 'Total unique users reached', category: 'reach', dataType: 'number', available: true },
  { id: 'impressions', name: 'Impressions', description: 'Total content impressions', category: 'reach', dataType: 'number', available: true },
  { id: 'followers_growth', name: 'Follower Growth', description: 'Net follower growth', category: 'growth', dataType: 'number', available: true },
  { id: 'revenue_generated', name: 'Revenue Generated', description: 'Revenue attributed to social media', category: 'financial', dataType: 'currency', available: true },
  { id: 'conversion_rate', name: 'Conversion Rate', description: 'Social media to booking conversion rate', category: 'financial', dataType: 'percentage', available: true },
  { id: 'cost_per_acquisition', name: 'Cost Per Acquisition', description: 'Average cost to acquire a customer', category: 'financial', dataType: 'currency', available: true },
  { id: 'sentiment_score', name: 'Sentiment Score', description: 'Overall brand sentiment analysis', category: 'engagement', dataType: 'number', available: true },
  { id: 'security_score', name: 'Security Score', description: 'Overall platform security rating', category: 'compliance', dataType: 'percentage', available: true },
  { id: 'policy_violations', name: 'Policy Violations', description: 'Number of policy violations detected', category: 'compliance', dataType: 'number', available: true }
];

export const EnterpriseReporting: React.FC = () => {
  const { toast } = useToast();
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>(mockReportTemplates);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>(mockGeneratedReports);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    category: 'performance' as const,
    frequency: 'weekly' as const,
    format: 'pdf' as const,
    metrics: [] as string[],
    recipients: [] as string[]
  });

  const handleGenerateReport = async (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (!template) return;

    const newGeneratedReport: GeneratedReport = {
      id: Date.now().toString(),
      templateId,
      name: `${template.name} - ${format(new Date(), 'MMM dd, yyyy')}`,
      category: template.category,
      format: template.format,
      status: 'generating',
      generatedAt: new Date().toISOString()
    };

    setGeneratedReports(prev => [newGeneratedReport, ...prev]);

    // Simulate report generation
    setTimeout(() => {
      setGeneratedReports(prev => prev.map(report =>
        report.id === newGeneratedReport.id
          ? {
              ...report,
              status: 'completed' as const,
              fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
              downloadUrl: `/reports/${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${template.format}`,
              recipients: template.recipients
            }
          : report
      ));

      toast({
        title: "Report Generated",
        description: `${template.name} has been generated successfully`,
      });
    }, 3000);
  };

  const handleToggleTemplate = (templateId: string) => {
    setReportTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, isActive: !template.isActive }
        : template
    ));

    const template = reportTemplates.find(t => t.id === templateId);
    toast({
      title: `Template ${template?.isActive ? 'Disabled' : 'Enabled'}`,
      description: `${template?.name} has been ${template?.isActive ? 'disabled' : 'enabled'}`,
    });
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    // Simulate download
    toast({
      title: "Download Started",
      description: `Downloading ${report.name}`,
    });
  };

  const handleSendReport = (report: GeneratedReport) => {
    setGeneratedReports(prev => prev.map(r =>
      r.id === report.id ? { ...r, status: 'sent' as const } : r
    ));

    toast({
      title: "Report Sent",
      description: `${report.name} has been sent to recipients`,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <BarChart3 className="h-4 w-4" />;
      case 'engagement':
        return <Users className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'compliance':
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'bg-blue-100 text-blue-800';
      case 'engagement':
        return 'bg-green-100 text-green-800';
      case 'financial':
        return 'bg-purple-100 text-purple-800';
      case 'compliance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'sent':
        return <Send className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'sent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeTemplates = reportTemplates.filter(t => t.isActive);
  const completedReports = generatedReports.filter(r => r.status === 'completed');
  const generatingReports = generatedReports.filter(r => r.status === 'generating');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Reporting</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage comprehensive business reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Report Settings
          </Button>
          <Button onClick={() => setIsCreatingReport(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Report Template
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Templates</p>
                <p className="text-2xl font-bold">{activeTemplates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reports Generated</p>
                <p className="text-2xl font-bold">{completedReports.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              This month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currently Generating</p>
                <p className="text-2xl font-bold">{generatingReports.length}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Automation Rate</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Automated reports
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          <TabsTrigger value="metrics">Available Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {reportTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p className="font-medium capitalize">{template.frequency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Format</p>
                          <p className="font-medium uppercase">{template.format}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Metrics ({template.metrics.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {template.metrics.slice(0, 3).map(metric => (
                            <Badge key={metric} variant="outline" className="text-xs">
                              {availableMetrics.find(m => m.id === metric)?.name || metric}
                            </Badge>
                          ))}
                          {template.metrics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.metrics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Recipients</p>
                        <p className="text-xs">{template.recipients.length} recipient(s)</p>
                      </div>

                      {template.nextScheduled && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Next Scheduled</p>
                          <p className="text-xs">{new Date(template.nextScheduled).toLocaleString()}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleGenerateReport(template.id)}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleTemplate(template.id)}
                        >
                          {template.isActive ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <div className="space-y-4">
            {generatedReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
                          {report.fileSize && <span>Size: {report.fileSize}</span>}
                          <Badge className={getCategoryColor(report.category)}>
                            {report.category}
                          </Badge>
                        </div>
                        {report.error && (
                          <p className="text-sm text-red-600 mt-1">{report.error}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {report.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          {report.recipients && report.status === 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendReport(report)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}
                        </>
                      )}
                      {report.status === 'generating' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Generating...
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{metric.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {metric.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {metric.dataType}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={metric.available ? "default" : "secondary"}>
                      {metric.available ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};