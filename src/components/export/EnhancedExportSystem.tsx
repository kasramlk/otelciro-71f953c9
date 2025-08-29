import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, FileImage, Share, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExportJob {
  id: string;
  type: 'pdf' | 'excel' | 'csv' | 'png';
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  downloadUrl?: string;
  size?: string;
}

interface EnhancedExportSystemProps {
  dataType: string;
  title: string;
  onExport: (format: string) => Promise<void>;
  className?: string;
}

export const EnhancedExportSystem = ({
  dataType,
  title,
  onExport,
  className = ''
}: EnhancedExportSystemProps) => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'png') => {
    const jobId = `export-${Date.now()}`;
    
    const newJob: ExportJob = {
      id: jobId,
      type: format,
      title: `${title} - ${format.toUpperCase()}`,
      status: 'processing',
      progress: 0,
      createdAt: new Date()
    };

    setExportJobs(prev => [newJob, ...prev]);
    setIsExporting(true);

    try {
      // Simulate progressive export
      const progressSteps = [10, 25, 50, 75, 90, 100];
      
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setExportJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, progress: progressSteps[i] }
            : job
        ));
      }

      // Complete the job
      await onExport(format);
      
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'completed',
              progress: 100,
              downloadUrl: `#download-${jobId}`,
              size: `${Math.round(Math.random() * 5 + 1)}.${Math.round(Math.random() * 9)}MB`
            }
          : job
      ));

      toast({
        title: 'Export Completed',
        description: `${format.toUpperCase()} export is ready for download.`
      });

    } catch (error) {
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed', progress: 0 }
          : job
      ));

      toast({
        title: 'Export Failed',
        description: 'There was an error processing your export.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'png': return <FileImage className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'processing': return 'text-warning';
      case 'failed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'processing': return <Badge className="bg-warning/10 text-warning border-warning/20">Processing</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export {title}
            </span>
            <Badge variant="outline">{dataType}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { format: 'pdf', label: 'PDF Report', description: 'Formatted document' },
              { format: 'excel', label: 'Excel', description: 'Spreadsheet with formulas' },
              { format: 'csv', label: 'CSV Data', description: 'Raw data export' },
              { format: 'png', label: 'PNG Image', description: 'Chart visualization' }
            ].map(({ format, label, description }) => (
              <Button
                key={format}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => handleExport(format as any)}
                disabled={isExporting}
              >
                {getFormatIcon(format)}
                <div className="text-center">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Export History */}
          {exportJobs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h4 className="font-medium">Export History</h4>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {exportJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className={getStatusColor(job.status)}>
                      {getFormatIcon(job.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{job.title}</span>
                        {getStatusBadge(job.status)}
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="mt-1">
                          <Progress value={job.progress} className="h-1" />
                          <span className="text-xs text-muted-foreground">{job.progress}% complete</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(job.createdAt, 'HH:mm, MMM dd')}
                        </span>
                        {job.size && (
                          <span className="text-xs text-muted-foreground">• {job.size}</span>
                        )}
                      </div>
                    </div>

                    {job.status === 'completed' && job.downloadUrl && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Share className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {job.status === 'failed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExport(job.type)}
                      >
                        Retry
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};