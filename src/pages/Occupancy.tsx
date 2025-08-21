import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  TrendingUp,
  Download,
  Eye,
  Printer,
  RefreshCw,
  PieChart
} from "lucide-react";
import { OccupancyFilters } from "@/components/occupancy/OccupancyFilters";
import { OccupancyKPIs } from "@/components/occupancy/OccupancyKPIs";
import { OccupancyTable } from "@/components/occupancy/OccupancyTable";
import { OccupancyCharts } from "@/components/occupancy/OccupancyCharts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Occupancy() {
  const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      toast({
        title: "Export Started",
        description: `Occupancy report is being exported as ${format.toUpperCase()}. Download will start shortly.`,
      });

      // Call the export edge function
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: {
          type: 'occupancy',
          format: format,
          hotelId: '550e8400-e29b-41d4-a716-446655440001', // Default hotel ID
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      // Create and trigger download
      const blob = new Blob([data], { 
        type: format === 'pdf' ? 'application/pdf' : 
              format === 'excel' ? 'application/vnd.ms-excel' : 
              'text/csv' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `occupancy_${new Date().toISOString().split('T')[0]}.${
        format === 'excel' ? 'xls' : format
      }`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Occupancy report has been downloaded as ${format.toUpperCase()}.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export occupancy report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Occupancy data has been updated with the latest information.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 space-y-6 p-4 md:p-8 pt-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center text-foreground">
            <Calendar className="mr-3 h-8 w-8 text-primary" />
            Occupancy & Forecast
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time occupancy analysis with revenue insights and forecasting
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-border hover:bg-accent"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePrint}
            className="border-border hover:bg-accent print:hidden"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport('excel')}
            className="border-border hover:bg-accent"
          >
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport('pdf')}
            className="border-border hover:bg-accent"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <OccupancyFilters />
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <OccupancyKPIs />
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <Button
            variant={viewType === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('daily')}
            className={viewType === 'daily' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Eye className="mr-2 h-4 w-4" />
            Daily View
          </Button>
          <Button
            variant={viewType === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('monthly')}
            className={viewType === 'monthly' ? 'bg-primary text-primary-foreground' : ''}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Monthly Aggregated
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="table" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Data Table
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <PieChart className="mr-2 h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <OccupancyTable viewType={viewType} />
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <OccupancyCharts />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}