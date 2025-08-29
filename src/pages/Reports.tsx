import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  PieChart,
  Filter,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const reportTypes = [
  {
    id: 'revenue',
    name: 'Revenue Report',
    description: 'Detailed revenue analysis by period',
    icon: DollarSign,
    category: 'Financial'
  },
  {
    id: 'occupancy',
    name: 'Occupancy Report',
    description: 'Room occupancy rates and trends',
    icon: BarChart3,
    category: 'Operations'
  },
  {
    id: 'guest',
    name: 'Guest Report',
    description: 'Guest demographics and satisfaction',
    icon: Users,
    category: 'Guest Services'
  },
  {
    id: 'channel',
    name: 'Channel Performance',
    description: 'Booking channel analysis',
    icon: PieChart,
    category: 'Distribution'
  }
];

const mockReportHistory = [
  {
    id: '1',
    name: 'Revenue Report - December 2024',
    type: 'revenue',
    generatedAt: '2024-01-15T10:30:00Z',
    period: '2024-12-01 to 2024-12-31',
    format: 'PDF',
    size: '2.4 MB',
    status: 'completed'
  },
  {
    id: '2',
    name: 'Occupancy Analysis - Q4 2024',
    type: 'occupancy',
    generatedAt: '2024-01-10T14:22:00Z',
    period: '2024-10-01 to 2024-12-31',
    format: 'Excel',
    size: '1.8 MB',
    status: 'completed'
  }
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedReportType, setSelectedReportType] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: undefined, to: undefined });
  const [reportFormat, setReportFormat] = useState('pdf');
  const [emailReport, setEmailReport] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast({
        title: "Missing Information",
        description: "Please select a report type to generate.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const reportName = reportTypes.find(r => r.id === selectedReportType)?.name;
      
      toast({
        title: "Report Generated Successfully",
        description: `${reportName} has been generated and ${emailReport ? 'sent to your email' : 'is ready for download'}.`,
      });
      
      // Reset form
      setSelectedReportType('');
      setDateRange({ from: undefined, to: undefined });
      setReportFormat('pdf');
      setEmailReport(false);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = (reportId: string) => {
    const report = mockReportHistory.find(r => r.id === reportId);
    if (report) {
      toast({
        title: "Download Started",
        description: `Downloading ${report.name}...`,
      });
    }
  };

  const getReportTypeIcon = (typeId: string) => {
    const reportType = reportTypes.find(r => r.id === typeId);
    const Icon = reportType?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'bg-green-500/10 text-green-700 border-green-500/20',
      'processing': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'failed': 'bg-red-500/10 text-red-700 border-red-500/20',
    };
    return variants[status as keyof typeof variants] || variants.completed;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-muted-foreground">
            Generate comprehensive reports and analyze your hotel performance
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Reports</TabsTrigger>
            <TabsTrigger value="history">Report History</TabsTrigger>
          </TabsList>

          {/* Generate Reports Tab */}
          <TabsContent value="generate">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Report Selection */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {reportTypes.map((report) => (
                        <motion.div
                          key={report.id}
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer transition-all",
                            selectedReportType === report.id 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => setSelectedReportType(report.id)}
                        >
                          <div className="flex items-start gap-3">
                            <report.icon className="h-5 w-5 text-primary mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-medium">{report.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {report.description}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {report.category}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Report Configuration */}
                {selectedReportType && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Report Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Date Range</Label>
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "flex-1 justify-start text-left font-normal",
                                      !dateRange.from && "text-muted-foreground"
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={dateRange.from}
                                    onSelect={(date) => setDateRange({...dateRange, from: date})}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "flex-1 justify-start text-left font-normal",
                                      !dateRange.to && "text-muted-foreground"
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={dateRange.to}
                                    onSelect={(date) => setDateRange({...dateRange, to: date})}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <div>
                            <Label>Report Format</Label>
                            <Select value={reportFormat} onValueChange={setReportFormat}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf">PDF Report</SelectItem>
                                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                                <SelectItem value="csv">CSV Data</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="email-report"
                            checked={emailReport}
                            onChange={(e) => setEmailReport(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="email-report" className="text-sm">
                            Email report when ready
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Report Summary */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Generation Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedReportType ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          {getReportTypeIcon(selectedReportType)}
                          <span className="font-medium">
                            {reportTypes.find(r => r.id === selectedReportType)?.name}
                          </span>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Period:</span>
                            <span className="text-muted-foreground">
                              {dateRange.from && dateRange.to 
                                ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                                : "Not selected"
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Format:</span>
                            <span className="text-muted-foreground">
                              {reportFormat.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery:</span>
                            <span className="text-muted-foreground">
                              {emailReport ? "Email + Download" : "Download"}
                            </span>
                          </div>
                        </div>

                        <Button 
                          onClick={handleGenerateReport}
                          disabled={generating}
                          className="w-full"
                        >
                          {generating ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Generate Report
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Select a report type to begin
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Report History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReportHistory.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getReportTypeIcon(report.type)}
                        <div>
                          <h3 className="font-medium">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Generated on {format(new Date(report.generatedAt), "PPP 'at' p")}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{report.format}</Badge>
                            <span className="text-xs text-muted-foreground">{report.size}</span>
                            <Badge className={getStatusBadge(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}