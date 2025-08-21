import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Bed, 
  UserCheck, 
  BookOpen, 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Settings,
  FileText,
  Search,
  Plus,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Hotel,
  PieChart,
  Brain
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  color?: string;
}

const navigationItems: SidebarItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "primary" },
  { title: "Room Plan", href: "/room-plan", icon: Calendar, badge: "Live" },
  { title: "Occupancy", href: "/occupancy", icon: PieChart, badge: "New" },
  { title: "Reservations", href: "/reservations", icon: BookOpen, badge: 12 },
  { title: "Guests", href: "/guests", icon: Users },
  { title: "Room Status", href: "/room-status", icon: Bed, badge: 3 },
  { title: "Check In/Out", href: "/check-in-out", icon: UserCheck },
];

const businessItems: SidebarItem[] = [
  { title: "Guest CRM", href: "/guest-crm", icon: Users, badge: "New" },
  { title: "Revenue AI", href: "/revenue-ai", icon: Brain, badge: "AI" },
  { title: "Operations", href: "/operations", icon: Settings, badge: "Live" },
  { title: "Sales", href: "/sales", icon: TrendingUp },
  { title: "Active Folios", href: "/folios", icon: Receipt, badge: "8" },
  { title: "Cashier", href: "/cashier", icon: CreditCard },
  { title: "Analytics", href: "/analytics", icon: BarChart3, badge: "AI" },
  { title: "Reports", href: "/reports", icon: BarChart3 },
];

const systemItems: SidebarItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Audit Log", href: "/audit-log", icon: FileText },
];

export const ModernSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <motion.aside
      initial="expanded"
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-sidebar border-r border-sidebar-border backdrop-blur-xl sticky top-0 z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                    <Hotel className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-display text-sidebar-foreground">Hotel PMS</h1>
                    <p className="text-xs text-sidebar-foreground/60">Premium Edition</p>
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
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/60" />
                <Input
                  placeholder="Search guests, rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <div className="p-4">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-primary text-white shadow-glow hover:shadow-xl transition-all duration-300 button-glow"
                  onClick={() => navigate('/reservations?new=true')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Reservation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => navigate('/guests?new=true')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guest
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Main Navigation */}
          <div>
            <AnimatePresence>
              {!collapsed && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3"
                >
                  Operations
                </motion.h3>
              )}
            </AnimatePresence>
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center justify-between flex-1"
                      >
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto bg-accent text-accent-foreground text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavLink>
              ))}
            </nav>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Business */}
          <div>
            <AnimatePresence>
              {!collapsed && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3"
                >
                  Business
                </motion.h3>
              )}
            </AnimatePresence>
            <nav className="space-y-1">
              {businessItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center justify-between flex-1"
                      >
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto bg-accent text-accent-foreground text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavLink>
              ))}
            </nav>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* System */}
          <div>
            <AnimatePresence>
              {!collapsed && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3"
                >
                  System
                </motion.h3>
              )}
            </AnimatePresence>
            <nav className="space-y-1">
              {systemItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1"
                      >
                        <span className="font-medium">{item.title}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className={`h-4 w-4 ${collapsed ? "" : "mr-2"}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};