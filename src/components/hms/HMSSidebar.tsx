import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar,
  Users,
  Bed,
  ClipboardList,
  UserCheck,
  BarChart3,
  TrendingUp,
  Settings,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Hotel,
  DollarSign,
  Wrench,
  BookOpen,
  MessageSquare,
  FileText,
  Globe,
  Target,
  ChevronLeft,
  Moon,
  Sun,
  LogOut,
  Building,
  Share2,
  Image,
  Calendar1,
  Palette,
  Zap,
  Smartphone,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RealtimeNotifications } from "@/components/hms/RealtimeNotifications";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useHotels } from "@/hooks/use-production-data";
import { useHMSStore } from "@/stores/hms-store";

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  color?: string;
}

// Navigation Items
const operationsItems: SidebarItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Reservations", href: "/reservations", icon: Calendar, badge: "12" },
  { title: "New Reservation", href: "/reservations/new", icon: Plus },
  { title: "Room Plan", href: "/room-plan", icon: Bed },
  { title: "Front Office", href: "/front-office", icon: UserCheck, badge: "5" },
  { title: "Housekeeping", href: "/housekeeping", icon: ClipboardList, badge: "8" },
  { title: "Guests", href: "/guests", icon: Users },
  { title: "Guest CRM", href: "/guest-crm", icon: MessageSquare }
];

const businessItems: SidebarItem[] = [
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Advanced Analytics", href: "/advanced-analytics", icon: TrendingUp, color: "text-accent" },
  { title: "Revenue AI", href: "/revenue-ai", icon: TrendingUp, color: "text-accent" },
  { title: "AI Insights V2", href: "/ai-insights-v2", icon: Zap, color: "text-accent" },
  { title: "Reports", href: "/reports", icon: FileText }
];


const socialMediaItems: SidebarItem[] = [
  { title: "Content Studio", href: "/social-media", icon: Share2, color: "text-accent" },
  { title: "Brand Kit", href: "/social-media/brand-kit", icon: Palette },
  { title: "Calendar", href: "/social-media/calendar", icon: Calendar1, badge: "7" },
  { title: "AI Generator", href: "/social-media/generator", icon: Zap, color: "text-accent" },
  { title: "Analytics", href: "/social-media/analytics", icon: BarChart3 }
];

const systemItems: SidebarItem[] = [
  { title: "Mobile Dashboard", href: "/mobile-dashboard", icon: Smartphone },
  { title: "Performance", href: "/performance", icon: Activity, color: "text-accent" },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Audit Log", href: "/audit-log", icon: BookOpen }
];

export const HMSSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({
    operations: true,
    business: true,
    social: true,
    system: false
  });
  
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { data: hotels, isLoading: hotelsLoading } = useHotels();
  const { selectedHotelId, setSelectedHotel } = useHMSStore();

  // Auto-select first hotel if none selected
  useEffect(() => {
    if (hotels && hotels.length > 0 && !selectedHotelId) {
      setSelectedHotel(hotels[0].id);
    }
  }, [hotels, selectedHotelId, setSelectedHotel]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const renderNavItem = (item: SidebarItem) => (
    <NavLink
      key={item.href}
      to={item.href}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:bg-sidebar-accent ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
        }`
      }
    >
      <item.icon className={`h-5 w-5 ${item.color || ""}`} />
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center justify-between flex-1"
          >
            <span className="font-medium">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </NavLink>
  );

  const renderNavGroup = (
    title: string,
    items: SidebarItem[],
    groupKey: keyof typeof expandedGroups
  ) => (
    <div key={title} className="space-y-2">
      <AnimatePresence>
        {!collapsed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleGroup(groupKey)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            <span>{title}</span>
            {expandedGroups[groupKey] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {(!collapsed && expandedGroups[groupKey]) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {items.map(renderNavItem)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="bg-sidebar border-r border-sidebar-border h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Hotel className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-sidebar-foreground">HMS</h2>
                  <Select 
                    value={selectedHotelId || ''} 
                    onValueChange={setSelectedHotel}
                  >
                    <SelectTrigger className="h-6 text-xs bg-transparent border-none p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground">
                      <SelectValue placeholder={hotelsLoading ? "Loading..." : "Select Hotel"} />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels?.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
          >
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                className="bg-gradient-primary text-white hover:opacity-90"
                onClick={() => navigate('/reservations/new')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Booking
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-sidebar-border"
                onClick={() => navigate('/guests')}
              >
                <Users className="h-4 w-4 mr-1" />
                Guest
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto">
        {renderNavGroup("Operations", operationsItems, "operations")}
        <Separator className="bg-sidebar-border" />
        {renderNavGroup("Business", businessItems, "business")}
        <Separator className="bg-sidebar-border" />
        {renderNavGroup("Social Media", socialMediaItems, "social")}
        <Separator className="bg-sidebar-border" />
        {renderNavGroup("System", systemItems, "system")}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {collapsed && (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};