import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bed, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Users,
  Building,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

// Mock KPI data - in real app, this would come from your API
const kpiData = {
  totalRooms: 120,
  avgOccupancy: 78.5,
  totalRevenue: 145250.00,
  avgADR: 186.75,
  occupancyChange: +5.2, // percentage change from previous period
  revenueChange: +12.8,
  adrChange: -2.1,
  roomsChange: 0,
  
  // Additional insights
  occupiedRooms: 94,
  availableRooms: 26,
  revPAR: 146.69, // Revenue Per Available Room
  forecast: {
    nextWeekOccupancy: 82.3,
    nextMonthRevenue: 425000
  }
};

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: any;
  description?: string;
  badge?: string;
  delay?: number;
}

const KPICard = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  description, 
  badge,
  delay = 0 
}: KPICardProps) => {
  const getChangeIcon = () => {
    if (!change || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getChangeColor = () => {
    if (!change || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="h-full"
    >
      <Card className="h-full shadow-sm border-border/50 hover:shadow-md transition-all duration-200 hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Icon className="mr-2 h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            {badge && (
              <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">
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
                : typeof value === 'number' && (title.includes('Occupancy') || title.includes('ADR') || title.includes('RevPAR'))
                ? `${value}${title.includes('Occupancy') ? '%' : title.includes('ADR') || title.includes('RevPAR') ? '' : ''}`
                : value}
            </div>
            
            {change !== undefined && (
              <div className={`flex items-center text-xs ${getChangeColor()}`}>
                {getChangeIcon()}
                <span className="ml-1">
                  {Math.abs(change)}% {changeLabel || "vs last period"}
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

export const OccupancyKPIs = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <KPICard
        title="Total Rooms"
        value={kpiData.totalRooms}
        change={kpiData.roomsChange}
        changeLabel="vs capacity"
        icon={Building}
        description={`${kpiData.occupiedRooms} occupied, ${kpiData.availableRooms} available`}
        delay={0}
      />
      
      <KPICard
        title="Average Occupancy"
        value={kpiData.avgOccupancy}
        change={kpiData.occupancyChange}
        changeLabel="vs last period"
        icon={Bed}
        description="Across all room types"
        badge="Live"
        delay={0.1}
      />
      
      <KPICard
        title="Total Revenue"
        value={kpiData.totalRevenue}
        change={kpiData.revenueChange}
        changeLabel="vs last period"
        icon={DollarSign}
        description="Room revenue only"
        delay={0.2}
      />
      
      <KPICard
        title="Average ADR"
        value={`$${kpiData.avgADR}`}
        change={kpiData.adrChange}
        changeLabel="vs last period"
        icon={TrendingUp}
        description="Average Daily Rate"
        delay={0.3}
      />
    </div>
  );
};