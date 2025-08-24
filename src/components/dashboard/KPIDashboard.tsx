import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Bed, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Percent,
  BarChart3,
  Target,
  Timer,
  MapPin,
  Star,
  Zap
} from "lucide-react";

interface KPIDashboardProps {
  dateRange: { from: Date; to: Date };
  hotelId: string;
}

interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  format: 'currency' | 'percentage' | 'number' | 'days';
  target?: number;
  unit?: string;
}

export const KPIDashboard = ({ dateRange, hotelId }: KPIDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Mock KPI data - in production this would come from API/Supabase
  const kpiMetrics: KPIMetric[] = useMemo(() => [
    // Revenue Metrics
    {
      id: 'occupancy',
      title: 'Occupancy Rate',
      value: 87.5,
      change: 2.3,
      icon: Bed,
      color: 'text-blue-600',
      format: 'percentage',
      target: 85
    },
    {
      id: 'adr',
      title: 'ADR (Average Daily Rate)',
      value: 185.50,
      change: -1.2,
      icon: DollarSign,
      color: 'text-green-600',
      format: 'currency',
      target: 180
    },
    {
      id: 'revpar',
      title: 'RevPAR',
      value: 162.31,
      change: 1.8,
      icon: TrendingUp,
      color: 'text-purple-600',
      format: 'currency',
      target: 155
    },
    {
      id: 'revpor',
      title: 'RevPOR (Revenue per Room)',
      value: 145.25,
      change: 0.5,
      icon: BarChart3,
      color: 'text-indigo-600',
      format: 'currency'
    },
    // Operational Metrics
    {
      id: 'pickup',
      title: 'Pickup (Δ OTB)',
      value: '+12',
      change: 15.2,
      icon: Target,
      color: 'text-orange-600',
      format: 'number',
      unit: 'rooms'
    },
    {
      id: 'otb_arrival',
      title: 'OTB by Arrival Date',
      value: 94,
      change: 8.1,
      icon: Calendar,
      color: 'text-cyan-600',
      format: 'number',
      unit: 'rooms'
    },
    {
      id: 'channel_mix',
      title: 'Direct Channel %',
      value: 35.8,
      change: 2.1,
      icon: Percent,
      color: 'text-emerald-600',
      format: 'percentage',
      target: 40
    },
    {
      id: 'cancellation_rate',
      title: 'Cancellation Rate',
      value: 8.2,
      change: -0.8,
      icon: AlertTriangle,
      color: 'text-red-600',
      format: 'percentage',
      target: 10
    },
    // Guest Experience
    {
      id: 'noshow_rate',
      title: 'No-Show Rate',
      value: 3.1,
      change: -0.4,
      icon: Users,
      color: 'text-amber-600',
      format: 'percentage'
    },
    {
      id: 'lead_time',
      title: 'Avg Lead Time',
      value: 14.5,
      change: 1.2,
      icon: Timer,
      color: 'text-slate-600',
      format: 'days'
    },
    {
      id: 'avg_los',
      title: 'Avg Length of Stay',
      value: 2.8,
      change: 0.3,
      icon: Clock,
      color: 'text-teal-600',
      format: 'days'
    },
    {
      id: 'rate_freshness',
      title: 'Rate Update Freshness',
      value: 94.2,
      change: 5.1,
      icon: Zap,
      color: 'text-yellow-600',
      format: 'percentage',
      target: 95
    }
  ], []);

  const formatValue = (value: string | number, format: string, unit?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value}%`;
      case 'days':
        return `${value} ${value === 1 ? 'day' : 'days'}`;
      case 'number':
        return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
      default:
        return value.toString();
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{change}%
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <TrendingDown className="h-4 w-4 mr-1" />
          {change}%
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-500 text-sm">
        <div className="w-4 h-4 mr-1" />
        0%
      </div>
    );
  };

  const getTargetStatus = (value: number, target?: number) => {
    if (!target) return null;
    
    const isAboveTarget = value >= target;
    return (
      <Badge 
        variant={isAboveTarget ? "default" : "secondary"} 
        className={`text-xs ${isAboveTarget ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
      >
        {isAboveTarget ? (
          <CheckCircle className="h-3 w-3 mr-1" />
        ) : (
          <Target className="h-3 w-3 mr-1" />
        )}
        Target: {formatValue(target, 'percentage')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hotel KPI Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics and operational insights
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="capitalize"
            >
              {period === 'today' ? 'Today' : `This ${period}`}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    {metric.title}
                  </div>
                  {metric.target && getTargetStatus(
                    typeof metric.value === 'number' ? metric.value : 0, 
                    metric.target
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatValue(metric.value, metric.format, metric.unit)}
                  </div>
                  <div className="flex items-center justify-between">
                    {getChangeIndicator(metric.change)}
                    <span className="text-xs text-muted-foreground">
                      vs last {selectedPeriod}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">High Cancellation Rate</p>
                  <p className="text-sm text-red-600 dark:text-red-300">8.2% cancellation rate exceeds benchmark of 6%</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Investigate
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Rate Update Needed</p>
                  <p className="text-sm text-amber-600 dark:text-amber-300">Some rates haven't been updated in 48+ hours</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Update Rates
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Occupancy Target Met</p>
                  <p className="text-sm text-green-600 dark:text-green-300">87.5% occupancy exceeds 85% target</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Excellent
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};