import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Menu, Bell, Search, Plus, TrendingUp, Users, Building, 
  DollarSign, Calendar, Filter, ChevronRight, Eye, Home,
  Bed, UserCheck, CreditCard, Settings, BarChart3
} from 'lucide-react';
import { useHotelContext } from '@/hooks/use-hotel-context';
import { useProductionData } from '@/hooks/use-production-data';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  action: () => void;
}

interface KPICardMobile {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

export const MobileOptimizedDashboard = () => {
  const { selectedHotelId, selectedHotel } = useHotelContext();
  const { reservations = [], rooms = [] } = useProductionData(selectedHotelId || undefined);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);

  // Mobile-optimized KPIs
  const kpis: KPICardMobile[] = useMemo(() => {
    const totalRevenue = reservations.reduce((sum, res) => sum + (res.total_amount || 0), 0);
    const occupancyRate = reservations.length / (rooms.length || 1);
    const avgADR = reservations.length > 0 ? totalRevenue / reservations.length : 0;

    return [
      {
        title: 'Revenue',
        value: `€${totalRevenue.toLocaleString()}`,
        change: '+12.5%',
        trend: 'up',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'text-primary'
      },
      {
        title: 'Occupancy',
        value: `${(occupancyRate * 100).toFixed(1)}%`,
        change: '+8.2%',
        trend: 'up',
        icon: <Building className="h-5 w-5" />,
        color: 'text-secondary'
      },
      {
        title: 'ADR',
        value: `€${avgADR.toFixed(0)}`,
        change: '-3.1%',
        trend: 'down',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-accent'
      },
      {
        title: 'Guests',
        value: reservations.length.toString(),
        change: '+15.7%',
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'text-muted-foreground'
      }
    ];
  }, [reservations, rooms]);

  // Quick actions for mobile
  const quickActions: QuickAction[] = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: 'New Booking',
      color: 'bg-primary text-primary-foreground',
      action: () => console.log('New booking')
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      label: 'Check In',
      color: 'bg-secondary text-secondary-foreground',
      action: () => console.log('Check in')
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Payment',
      color: 'bg-accent text-accent-foreground',
      action: () => console.log('Payment')
    },
    {
      icon: <Bed className="h-5 w-5" />,
      label: 'Room Status',
      color: 'bg-muted text-muted-foreground',
      action: () => console.log('Room status')
    }
  ];

  // Today's arrivals and departures
  const todayActivity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const arrivals = reservations.filter(res => {
      const checkIn = new Date(res.check_in);
      return checkIn >= today && checkIn < tomorrow;
    });

    const departures = reservations.filter(res => {
      const checkOut = new Date(res.check_out);
      return checkOut >= today && checkOut < tomorrow;
    });

    return { arrivals, departures };
  }, [reservations]);

  // Navigation tabs for mobile
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Home className="h-4 w-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
  ];

  if (!selectedHotelId) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground p-4">
        <div className="text-center">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Please select a hotel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedHotel?.name}</h2>
                    <p className="text-sm text-muted-foreground">Hotel Management</p>
                  </div>
                  
                  <nav className="space-y-2">
                    {[
                      { label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
                      { label: 'Reservations', icon: <Calendar className="h-4 w-4" /> },
                      { label: 'Guests', icon: <Users className="h-4 w-4" /> },
                      { label: 'Rooms', icon: <Bed className="h-4 w-4" /> },
                      { label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> }
                    ].map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            
            <div>
              <h1 className="font-semibold text-foreground truncate max-w-32">
                {selectedHotel?.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">3</Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={action.action}
                  className={cn(
                    "h-16 w-full flex-col gap-2 text-xs",
                    action.color
                  )}
                >
                  {action.icon}
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((kpi, index) => (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="card-modern">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={kpi.color}>
                        {kpi.icon}
                      </div>
                      <Badge 
                        variant={kpi.trend === 'up' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {kpi.change}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.title}</p>
                      <p className="text-xl font-bold">{kpi.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Today's Activity */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Arrivals */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-success">
                    Arrivals ({todayActivity.arrivals.length})
                  </h4>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {todayActivity.arrivals.slice(0, 3).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Guest #{reservation.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Room {reservation.room_id || 'TBA'} • {reservation.adults} guests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">€{reservation.total_amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(reservation.check_in), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {todayActivity.arrivals.length > 3 && (
                    <p className="text-xs text-center text-muted-foreground">
                      +{todayActivity.arrivals.length - 3} more arrivals
                    </p>
                  )}
                </div>
              </div>

              {/* Departures */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-warning">
                    Departures ({todayActivity.departures.length})
                  </h4>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {todayActivity.departures.slice(0, 3).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Guest #{reservation.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Room {reservation.room_id || 'TBA'} • {reservation.adults} guests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">€{reservation.total_amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(reservation.check_out), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {todayActivity.departures.length > 3 && (
                    <p className="text-xs text-center text-muted-foreground">
                      +{todayActivity.departures.length - 3} more departures
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Status Overview */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bed className="h-5 w-5" />
                Room Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">
                    {Math.floor(rooms.length * 0.7)}
                  </p>
                  <p className="text-xs text-muted-foreground">Clean</p>
                </div>
                <div className="text-center p-3 bg-warning/10 rounded-lg">
                  <p className="text-2xl font-bold text-warning">
                    {Math.floor(rooms.length * 0.2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Dirty</p>
                </div>
                <div className="text-center p-3 bg-info/10 rounded-lg">
                  <p className="text-2xl font-bold text-info">
                    {Math.floor(rooms.length * 0.08)}
                  </p>
                  <p className="text-xs text-muted-foreground">Inspected</p>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">
                    {Math.floor(rooms.length * 0.02)}
                  </p>
                  <p className="text-xs text-muted-foreground">OOO</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around p-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="flex-col h-12 text-xs"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};