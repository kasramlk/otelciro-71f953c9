import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Presentation,
  Loader2,
  Calendar,
  Clock
} from "lucide-react";

const exportSchema = z.object({
  format: z.enum(["pdf", "excel", "csv", "ppt"]),
  dateRange: z.enum(["today", "week", "month", "quarter", "year", "custom"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeSummary: z.boolean().default(true),
});

type ExportData = z.infer<typeof exportSchema>;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  dataType: string;
  onExportComplete?: () => void;
}

const formatIcons = {
  pdf: FileText,
  excel: FileSpreadsheet,
  csv: FileSpreadsheet,
  ppt: Presentation
};

const formatColors = {
  pdf: "bg-red-100 text-red-800 border-red-200",
  excel: "bg-green-100 text-green-800 border-green-200",
  csv: "bg-blue-100 text-blue-800 border-blue-200",
  ppt: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function ExportDialog({
  open,
  onOpenChange,
  title,
  dataType,
  onExportComplete
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ExportData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: "pdf",
      dateRange: "month",
      includeCharts: true,
      includeSummary: true,
    },
  });

  const onSubmit = async (data: ExportData) => {
    setIsExporting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('export-data', {
        body: {
          type: data.format,
          dataType,
          dateRange: data.dateRange,
          startDate: data.startDate,
          endDate: data.endDate,
          options: {
            includeCharts: data.includeCharts,
            includeSummary: data.includeSummary
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Export Successful",
        description: `${title} has been exported as ${data.format.toUpperCase()}. Download will start shortly.`,
      });

      onExportComplete?.();
      onOpenChange(false);
      form.reset();

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormat = form.watch("format");
  const selectedDateRange = form.watch("dateRange");
  const SelectedIcon = formatIcons[selectedFormat];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {title}
          </DialogTitle>
          <DialogDescription>
            Configure your export settings and download the data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF Document
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel Spreadsheet
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV File
                        </div>
                      </SelectItem>
                      <SelectItem value="ppt">
                        <div className="flex items-center gap-2">
                          <Presentation className="h-4 w-4" />
                          PowerPoint
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardContent className="p-4">
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${formatColors[selectedFormat]}`}>
                  <SelectedIcon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">
                      {selectedFormat.toUpperCase()} Export
                    </div>
                    <div className="text-sm opacity-80">
                      {selectedFormat === 'pdf' && 'Formatted document with charts and tables'}
                      {selectedFormat === 'excel' && 'Spreadsheet with multiple sheets and formulas'}
                      {selectedFormat === 'csv' && 'Raw data in comma-separated format'}
                      {selectedFormat === 'ppt' && 'Presentation with charts and summary slides'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDateRange === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="includeCharts"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-input"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Include charts and visualizations
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="includeSummary"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-input"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Include executive summary
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isExporting} className="flex-1">
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export {selectedFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}