import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  FileText, 
  Mail,
  Calendar,
  Settings,
  Clock,
  CheckCircle
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExportReportsProps {
  dateRange?: DateRange;
  selectedHotel: string;
}

export const ExportReports = ({ dateRange, selectedHotel }: ExportReportsProps) => {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [reportSections, setReportSections] = useState({
    daily: true,
    forecasting: true,
    channels: true,
    insights: false,
    detailed: false
  });
  const [scheduledEmail, setScheduledEmail] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [customNotes, setCustomNotes] = useState("");
  const { toast } = useToast();

  const reportTemplates = [
    {
      id: "executive",
      name: "Executive Summary",
      description: "High-level KPIs and key insights for management",
      sections: ["daily", "insights"],
      popularity: "Most Popular"
    },
    {
      id: "operational",
      name: "Operational Report", 
      description: "Detailed operational metrics and forecasts",
      sections: ["daily", "forecasting", "channels"],
      popularity: "Recommended"
    },
    {
      id: "revenue",
      name: "Revenue Analysis",
      description: "Comprehensive revenue and channel analysis",
      sections: ["channels", "forecasting", "detailed"],
      popularity: null
    },
    {
      id: "custom",
      name: "Custom Report",
      description: "Build your own report with selected sections",
      sections: Object.keys(reportSections),
      popularity: null
    }
  ];

  const scheduledReports = [
    {
      name: "Daily Operations Report",
      frequency: "Daily",
      nextRun: "Tomorrow at 8:00 AM",
      recipients: "manager@hotel.com, operations@hotel.com",
      status: "active"
    },
    {
      name: "Weekly Revenue Summary",
      frequency: "Weekly", 
      nextRun: "Monday at 9:00 AM",
      recipients: "revenue@hotel.com",
      status: "active"
    },
    {
      name: "Monthly Executive Report",
      frequency: "Monthly",
      nextRun: "1st of next month",
      recipients: "executive@hotel.com",
      status: "paused"
    }
  ];

  const handleExport = (template?: string) => {
    const sections = template ? reportTemplates.find(t => t.id === template)?.sections || [] : Object.keys(reportSections).filter(key => reportSections[key as keyof typeof reportSections]);
    
    toast({
      title: "Report Export Started",
      description: `Your ${exportFormat.toUpperCase()} report is being generated with ${sections.length} sections.`,
    });

    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: "Your report has been generated and is ready for download.",
      });
    }, 2000);
  };

  const handleScheduleReport = () => {
    if (!scheduledEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for scheduled reports.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Report Scheduled",
      description: `${scheduleFrequency.charAt(0).toUpperCase() + scheduleFrequency.slice(1)} reports will be sent to ${scheduledEmail}`,
    });
  };

  const toggleSection = (section: string) => {
    setReportSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Quick Export Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {reportTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-modern card-hover cursor-pointer relative">
              {template.popularity && (
                <Badge className="absolute -top-2 -right-2 bg-gradient-primary text-white">
                  {template.popularity}
                </Badge>
              )}
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.sections.map(section => (
                      <Badge key={section} variant="outline" className="text-xs">
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleExport(template.id)}
                    className="w-full gap-2"
                    variant={template.popularity ? "default" : "outline"}
                  >
                    <Download className="h-4 w-4" />
                    Export {template.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Custom Report Builder */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Sections */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Report Sections</h3>
              <div className="space-y-3">
                {[
                  { key: 'daily', label: 'Daily Performance Dashboard', desc: 'KPIs, today\'s metrics, and trends' },
                  { key: 'forecasting', label: 'Forecasting & Pickup', desc: 'Booking pace and occupancy forecasts' },
                  { key: 'channels', label: 'Channel Analysis', desc: 'Revenue distribution and performance' },
                  { key: 'insights', label: 'AI Insights', desc: 'Automated recommendations and opportunities' },
                  { key: 'detailed', label: 'Detailed Data Tables', desc: 'Raw data and detailed breakdowns' }
                ].map(section => (
                  <div key={section.key} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                      id={section.key}
                      checked={reportSections[section.key as keyof typeof reportSections]}
                      onCheckedChange={() => toggleSection(section.key)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={section.key} className="text-sm font-medium cursor-pointer">
                        {section.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{section.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Export Options</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="excel">Excel Workbook</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                      <SelectItem value="pptx">PowerPoint Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Custom Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add custom notes or comments for this report..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => handleExport()}
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Generate Custom Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule New Report */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Schedule Automated Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Recipients</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@hotel.com, team@hotel.com"
                value={scheduledEmail}
                onChange={(e) => setScheduledEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleScheduleReport}
              className="w-full gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule Reports
            </Button>
          </CardContent>
        </Card>

        {/* Current Scheduled Reports */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledReports.map((report, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{report.name}</h4>
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.status === 'active' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                      ) : (
                        'Paused'
                      )}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Frequency:</strong> {report.frequency}</p>
                    <p><strong>Next Run:</strong> {report.nextRun}</p>
                    <p><strong>Recipients:</strong> {report.recipients}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export History */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Executive Summary", date: "Today, 2:30 PM", format: "PDF", size: "2.1 MB" },
              { name: "Weekly Revenue Report", date: "Yesterday, 9:00 AM", format: "Excel", size: "1.8 MB" },
              { name: "Channel Analysis", date: "2 days ago", format: "PDF", size: "3.2 MB" },
              { name: "Operational Report", date: "3 days ago", format: "PowerPoint", size: "4.1 MB" }
            ].map((export_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{export_.name}</p>
                    <p className="text-sm text-muted-foreground">{export_.date} • {export_.format} • {export_.size}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};