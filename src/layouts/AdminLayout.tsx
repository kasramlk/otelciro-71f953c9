import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Building,
  Users,
  Plane,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Database
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Hotel Onboarding", url: "/admin/onboarding", icon: Building },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Agency Management", url: "/admin/agencies", icon: Plane },
  { title: "Beds24 Integration", url: "/admin/beds24-integration", icon: Database },
  { title: "Platform Settings", url: "/admin/settings", icon: Settings },
  { title: "Audit & Monitoring", url: "/admin/audit", icon: FileText },
  { title: "Data Management", url: "/admin/data", icon: Database },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { toast } = useToast();
  
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };
  
  const getNavCls = (path: string) =>
    isActive(path) ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of the admin panel"
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg text-primary">Admin Panel</h2>
                <p className="text-sm text-muted-foreground">OtelCiro Platform</p>
              </div>
            )}
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Admin Panel</span>
            </div>
          </header>
          
          <main className="flex-1 p-6 bg-muted/10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};