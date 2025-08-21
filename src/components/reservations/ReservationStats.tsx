import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  MapPin, 
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from "lucide-react";

// Mock data - in real app, this would come from your API
const statsData = {
  totalReservations: 248,
  todayArrivals: 12,
  todayDepartures: 8,
  inHouse: 95,
  pendingConfirmation: 6,
  waitlistCount: 3,
  groupReservations: 4,
  totalRevenue: 185420,
  avgADR: 195.50,
  changes: {
    reservations: +12.5,
    revenue: +8.3,
    arrivals: -2.1,
    departures: +5.7
  }
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: any;
  description?: string;
  badge?: string;
  delay?: number;
  color?: 'default' | 'success' | 'warning' | 'error';
}

const StatCard = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  description, 
  badge,
  delay = 0,
  color = 'default'
}: StatCardProps) => {
  const getChangeColor = () => {
    if (!change || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  const getCardAccent = () => {
    switch (color) {
      case 'success': return 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'warning': return 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'error': return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20';
      default: return 'border-l-4 border-l-primary bg-primary/5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="h-full"
    >
      <Card className={`h-full shadow-sm border-border/50 hover:shadow-md transition-all duration-200 ${getCardAccent()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon className="mr-2 h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            {badge && (
              <Badge 
                variant={color === 'warning' ? 'destructive' : color === 'success' ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {badge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {typeof value === 'number' && title.includes('Revenue') 
                ? `$${value.toLocaleString()}` 
                : typeof value === 'number' && title.includes('ADR')
                ? `$${value}`
                : value}
            </div>
            
            {change !== undefined && (
              <div className={`flex items-center text-xs ${getChangeColor()}`}>
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : change < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : null}
                <span>
                  {Math.abs(change)}% {changeLabel || "vs yesterday"}
                </span>
              </div>
            )}
            
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ReservationStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
      <StatCard
        title="Total Reservations"
        value={statsData.totalReservations}
        change={statsData.changes.reservations}
        changeLabel="vs yesterday"
        icon={BookOpen}
        description="Active bookings"
        delay={0}
      />
      
      <StatCard
        title="Today's Arrivals"
        value={statsData.todayArrivals}
        change={statsData.changes.arrivals}
        changeLabel="vs yesterday"
        icon={Clock}
        description="Check-ins expected"
        badge={statsData.todayArrivals > 10 ? "Busy" : "Normal"}
        color={statsData.todayArrivals > 15 ? 'warning' : 'default'}
        delay={0.05}
      />
      
      <StatCard
        title="Today's Departures"
        value={statsData.todayDepartures}
        change={statsData.changes.departures}
        changeLabel="vs yesterday"
        icon={MapPin}
        description="Check-outs expected"
        delay={0.1}
      />
      
      <StatCard
        title="In-House Guests"
        value={statsData.inHouse}
        icon={Users}
        description="Currently staying"
        color="success"
        delay={0.15}
      />
      
      <StatCard
        title="Pending Confirmation"
        value={statsData.pendingConfirmation}
        icon={AlertTriangle}
        description="Awaiting response"
        badge={statsData.pendingConfirmation > 5 ? "Action Required" : "Normal"}
        color={statsData.pendingConfirmation > 5 ? 'warning' : 'default'}
        delay={0.2}
      />
      
      <StatCard
        title="Total Revenue"
        value={statsData.totalRevenue}
        change={statsData.changes.revenue}
        changeLabel="vs yesterday"
        icon={DollarSign}
        description="Today's bookings"
        color="success"
        delay={0.25}
      />
    </div>
  );
};