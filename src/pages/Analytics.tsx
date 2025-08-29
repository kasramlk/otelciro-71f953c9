import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Download,
  Brain,
  RefreshCw,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker as DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

// Import analytics components
import { DailyPerformanceDashboard } from "@/components/analytics/DailyPerformanceDashboard";
import { ForecastingReports } from "@/components/analytics/ForecastingReports";
import { ChannelAnalysis } from "@/components/analytics/ChannelAnalysis";
import { AIInsights } from "@/components/analytics/AIInsights";
import { ExportReports } from "@/components/analytics/ExportReports";

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedHotel, setSelectedHotel] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Fetch hotels for multi-hotel filtering
  const { data: hotels } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name, code")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "Analytics data has been updated with the latest information.",
      });
    }, 1500);
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report is being prepared for download.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-display text-foreground">Analytics & Reporting</h1>
                <p className="text-muted-foreground">
                  Real-time insights, forecasts, and AI-powered recommendations
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live Data
            </Badge>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 card-modern">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="w-[300px]"
              />
            </div>

            {hotels && hotels.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Hotel</label>
                <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hotels</SelectItem>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Advanced Filters
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            <TabsTrigger value="daily" className="gap-2">
              <Calendar className="h-4 w-4" />
              Daily Performance
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Channel Analysis
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Download className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            <DailyPerformanceDashboard 
              dateRange={dateRange}
              selectedHotel={selectedHotel}
            />
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <ForecastingReports 
              dateRange={dateRange}
              selectedHotel={selectedHotel}
            />
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <ChannelAnalysis 
              dateRange={dateRange}
              selectedHotel={selectedHotel}
            />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <AIInsights 
              dateRange={dateRange}
              selectedHotel={selectedHotel}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ExportReports 
              dateRange={dateRange}
              selectedHotel={selectedHotel}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Analytics;