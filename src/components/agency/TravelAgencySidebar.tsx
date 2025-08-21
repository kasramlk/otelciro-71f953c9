import { useState } from "react";
import { motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Search, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  Plane,
  MapPin,
  Users,
  DollarSign,
  Briefcase,
  Globe,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  {
    name: "Hotel Search",
    href: "/agency/search",
    icon: Search,
    description: "AI-powered hotel search"
  },
  {
    name: "My Bookings", 
    href: "/agency/bookings",
    icon: Calendar,
    description: "Manage reservations"
  },
  {
    name: "Negotiations",
    href: "/agency/contracts", 
    icon: Briefcase,
    description: "Rate agreements"
  },
  {
    name: "Payments",
    href: "/agency/payments",
    icon: CreditCard,
    description: "Invoices & commissions"
  },
  {
    name: "Analytics",
    href: "/agency/analytics",
    icon: BarChart3,
    description: "Performance reports"
  },
  {
    name: "Profile",
    href: "/agency/profile",
    icon: Users,
    description: "Agency settings"
  }
];

export const TravelAgencySidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
    navigate("/");
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={`bg-white dark:bg-gray-900 border-r border-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-72"
      } flex flex-col`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            animate={{ opacity: collapsed ? 0 : 1 }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Plane className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg text-foreground">OtelCiro</h2>
                <p className="text-xs text-muted-foreground">Travel Agency Portal</p>
              </div>
            )}
          </motion.div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            <Globe className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`w-full justify-start gap-3 ${collapsed ? "px-3" : ""}`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {!collapsed && "Toggle theme"}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={`w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ${collapsed ? "px-3" : ""}`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </Button>
      </div>
    </motion.aside>
  );
};