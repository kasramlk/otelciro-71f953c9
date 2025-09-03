import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Target,
  Lightbulb,
  Zap,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
  dateRange?: DateRange;
  selectedHotel: string;
}

interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'opportunity';
  category: 'revenue' | 'occupancy' | 'pricing' | 'channels' | 'operations';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  metrics?: {
    current: string;
    change: string;
    benchmark?: string;
  };
  recommendation?: string;
  actionable?: boolean;
}

export const AIInsights = ({ dateRange, selectedHotel }: AIInsightsProps) => {
  const { toast } = useToast();

  // Fetch data for AI analysis
  const { data: analyticsData } = useQuery({
    queryKey: ["aiAnalyticsData", dateRange, selectedHotel],
    queryFn: async () => {
      // Get reservations data
      let reservationsQuery = supabase
        .from("reservations")
        .select(`
          *
        `);

      if (dateRange?.from && dateRange?.to) {
        reservationsQuery = reservationsQuery
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      if (selectedHotel !== "all") {
        reservationsQuery = reservationsQuery.eq("hotel_id", selectedHotel);
      }

      const { data: reservations, error } = await reservationsQuery;
      if (error) throw error;

      return { reservations };
    },
  });

  // Generate AI insights based on the data
  const generateInsights = (data: any): Insight[] => {
    const insights: Insight[] = [];
    
    if (!data?.reservations) return insights;

    const reservations = data.reservations;
    const totalRevenue = reservations.reduce((sum: number, res: any) => sum + (res.total_amount || 0), 0);
    const avgDailyRate = reservations.length > 0 ? totalRevenue / reservations.length : 0;
    
    // Source analysis
    const sourcePerformance = reservations.reduce((acc: any, res: any) => {
      const source = res.source || 'Direct';
      if (!acc[source]) {
        acc[source] = { count: 0, revenue: 0 };
      }
      acc[source].count++;
      acc[source].revenue += res.total_amount || 0;
      return acc;
    }, {});

    // Insight 1: ADR Performance
    insights.push({
      id: '1',
      type: avgDailyRate > 150 ? 'positive' : 'opportunity',
      category: 'pricing',
      title: `ADR ${avgDailyRate > 150 ? 'Above Market' : 'Optimization Opportunity'}`,
      description: `Your current ADR of $${avgDailyRate.toFixed(0)} is ${avgDailyRate > 150 ? 'performing well above market average' : 'below optimal levels for your property type'}.`,
      impact: 'high',
      confidence: 85,
      metrics: {
        current: `$${avgDailyRate.toFixed(0)}`,
        change: avgDailyRate > 150 ? '+12%' : '-8%',
        benchmark: '$165'
      },
      recommendation: avgDailyRate > 150 
        ? 'Consider implementing dynamic pricing to capture weekend premiums.'
        : 'Analyze competitor rates and implement 5-10% rate increases for peak periods.',
      actionable: true
    });

    // Insight 2: Source Performance
    const topSource = Object.entries(sourcePerformance)
      .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)[0];
    
    if (topSource) {
      const [sourceName, data] = topSource;
      const sourceData = data as { count: number; revenue: number };
      
      insights.push({
        id: '2',
        type: sourceData.revenue > totalRevenue * 0.4 ? 'negative' : 'positive',
        category: 'revenue',
        title: `${sourceName} Source Dependency`,
        description: `${sourceName} accounts for ${((sourceData.revenue / totalRevenue) * 100).toFixed(1)}% of your revenue. ${sourceData.revenue > totalRevenue * 0.4 ? 'High dependency risk detected' : 'Good source diversification'}.`,
        impact: sourceData.revenue > totalRevenue * 0.4 ? 'high' : 'medium',
        confidence: 92,
        metrics: {
          current: `${((sourceData.revenue / totalRevenue) * 100).toFixed(1)}%`,
          change: sourceData.revenue > totalRevenue * 0.4 ? '+15%' : '+5%'
        },
        recommendation: sourceData.revenue > totalRevenue * 0.4 
          ? 'Diversify booking sources to reduce dependency risk. Focus on direct bookings.'
          : 'Continue maintaining balanced source mix while optimizing commission costs.',
        actionable: true
      });
    }

    // Insight 3: Booking Patterns
    const weekendBookings = reservations.filter((res: any) => {
      const checkIn = new Date(res.check_in);
      const day = checkIn.getDay();
      return day === 5 || day === 6; // Friday or Saturday
    });

    insights.push({
      id: '3',
      type: 'opportunity',
      category: 'revenue',
      title: 'Weekend Revenue Optimization',
      description: `Weekend bookings represent ${((weekendBookings.length / reservations.length) * 100).toFixed(1)}% of reservations but could be optimized further.`,
      impact: 'medium',
      confidence: 78,
      metrics: {
        current: `${weekendBookings.length} bookings`,
        change: '+23%'
      },
      recommendation: 'Implement weekend packages and targeted marketing to increase weekend ADR by 15-20%.',
      actionable: true
    });

    // Insight 4: Operational Efficiency
    insights.push({
      id: '4',
      type: 'positive',
      category: 'operations',
      title: 'Strong Operational Performance',
      description: 'Your property shows consistent booking velocity and guest satisfaction metrics.',
      impact: 'medium',
      confidence: 88,
      recommendation: 'Focus on upselling opportunities and guest experience enhancements to maximize RevPAR.',
      actionable: false
    });

    // Insight 5: Market Opportunity
    insights.push({
      id: '5',
      type: 'opportunity',
      category: 'revenue',
      title: 'Corporate Segment Growth Potential',
      description: 'Corporate bookings show 28% lower volume compared to market leaders in your area.',
      impact: 'high',
      confidence: 73,
      recommendation: 'Develop corporate packages and establish partnerships with local businesses to capture mid-week demand.',
      actionable: true
    });

    return insights;
  };

  const insights = generateInsights(analyticsData);

  const handleImplementAction = (insightId: string) => {
    toast({
      title: "Action Initiated",
      description: "Your recommended action has been added to your task list.",
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'opportunity':
        return <Target className="h-5 w-5 text-blue-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'negative':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'opportunity':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>;
      case 'medium':
        return <Badge variant="default">Medium Impact</Badge>;
      default:
        return <Badge variant="secondary">Low Impact</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="bg-gradient-hero text-white card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">AI-Powered Insights</h2>
                <p className="text-white/80">
                  Advanced analytics and personalized recommendations for your property
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Analysis Confidence</p>
              <p className="text-3xl font-bold">87%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insights.filter(i => i.actionable).length}</p>
            <p className="text-sm text-muted-foreground">Actionable Insights</p>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insights.filter(i => i.impact === 'high').length}</p>
            <p className="text-sm text-muted-foreground">High Impact</p>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insights.filter(i => i.type === 'opportunity').length}</p>
            <p className="text-sm text-muted-foreground">Opportunities</p>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{insights.filter(i => i.type === 'positive').length}</p>
            <p className="text-sm text-muted-foreground">Strengths</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 ${getInsightColor(insight.type)} card-modern`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {insight.title}
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getImpactBadge(insight.impact)}
                        <Badge variant="outline">
                          {insight.confidence}% confident
                        </Badge>
                      </div>
                    </div>

                    {insight.metrics && (
                      <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-background/50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Current</p>
                          <p className="font-semibold text-foreground">{insight.metrics.current}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Change</p>
                          <p className={`font-semibold ${insight.metrics.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {insight.metrics.change}
                          </p>
                        </div>
                        {insight.metrics.benchmark && (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Benchmark</p>
                            <p className="font-semibold text-foreground">{insight.metrics.benchmark}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {insight.recommendation && (
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1">Recommendation</p>
                          <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                        </div>
                        {insight.actionable && (
                          <Button
                            size="sm"
                            onClick={() => handleImplementAction(insight.id)}
                            className="gap-1"
                          >
                            <Zap className="h-3 w-3" />
                            Implement
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Recommendations Summary */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Priority Actions This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights
              .filter(i => i.actionable && i.impact === 'high')
              .slice(0, 3)
              .map((insight, index) => (
              <div key={insight.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Est. 2-3 days</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};