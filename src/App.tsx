import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { setupGlobalErrorHandling } from "@/lib/error-handler";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import Guests from "./pages/Guests";
import RoomPlan from "./pages/RoomPlan";
import RoomStatus from "./pages/RoomStatus";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Cashier from "./pages/Cashier";
import Sales from "./pages/Sales";
import AuditLog from "./pages/AuditLog";
import Occupancy from "./pages/Occupancy";
import NotFound from "./pages/NotFound";
import HotelSearch from "./pages/agency/HotelSearch";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import { HotelManagerLayout } from "./layouts/HotelManagerLayout";
import { TravelAgencyLayout } from "./layouts/TravelAgencyLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import HotelOnboarding from "./pages/admin/HotelOnboarding";
import UserManagement from "./pages/admin/UserManagement";
import AgencyManagement from "./pages/admin/AgencyManagement";
import PlatformSettings from "./pages/admin/PlatformSettings";
import AuditMonitoring from "./pages/admin/AuditMonitoring";
import GuestCRM from "./pages/GuestCRM";
import RevenueAI from "./pages/RevenueAI";
import Operations from "./pages/Operations";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors  
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Setup global error handling
setupGlobalErrorHandling();

const AppContent = () => {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPublicRoute = ['/', '/auth'].includes(location.pathname);

  if (!session && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  // Role-based routing
  if (session) {
    const role = userRole || 'hotel_manager';
    
    // Agency routes
    if (location.pathname.startsWith('/agency')) {
      if (role !== 'travel_agency') {
        return <Navigate to="/" replace />;
      }
      return (
        <TravelAgencyLayout>
          <Routes>
            <Route path="/agency" element={<AgencyDashboard />} />
            <Route path="/agency/search" element={<HotelSearch />} />
            <Route path="/agency/bookings" element={<div>My Bookings</div>} />
            <Route path="/agency/contracts" element={<div>Negotiations</div>} />
            <Route path="/agency/payments" element={<div>Payments</div>} />
            <Route path="/agency/analytics" element={<div>Analytics</div>} />
            <Route path="/agency/profile" element={<div>Profile</div>} />
          </Routes>
        </TravelAgencyLayout>
      );
    }
    
    // Admin routes
    if (location.pathname.startsWith('/admin')) {
      if (role !== 'admin') {
        return <Navigate to="/" replace />;
      }
      return (
        <AdminLayout>
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/onboarding" element={<HotelOnboarding />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/agencies" element={<AgencyManagement />} />
            <Route path="/admin/settings" element={<PlatformSettings />} />
            <Route path="/admin/audit" element={<AuditMonitoring />} />
            <Route path="/admin/data" element={<div>Data Management</div>} />
          </Routes>
        </AdminLayout>
      );
    }
    
    // Hotel manager routes (default)
    if (role === 'travel_agency' && location.pathname === '/') {
      return <Navigate to="/agency" replace />;
    }
    
    if (role === 'admin' && location.pathname === '/') {
      return <Navigate to="/admin" replace />;
    }
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={session ? (
        <HotelManagerLayout>
          <Index />
        </HotelManagerLayout>
      ) : <Index />} />
      
      {/* Hotel Manager Routes */}
      <Route path="/dashboard" element={
        <HotelManagerLayout>
          <Dashboard />
        </HotelManagerLayout>
      } />
      <Route path="/reservations" element={
        <HotelManagerLayout>
          <Reservations />
        </HotelManagerLayout>
      } />
      <Route path="/guests" element={
        <HotelManagerLayout>
          <Guests />
        </HotelManagerLayout>
      } />
      <Route path="/room-plan" element={
        <HotelManagerLayout>
          <RoomPlan />
        </HotelManagerLayout>
      } />
      <Route path="/room-status" element={
        <HotelManagerLayout>
          <RoomStatus />
        </HotelManagerLayout>
      } />
      <Route path="/occupancy" element={
        <HotelManagerLayout>
          <Occupancy />
        </HotelManagerLayout>
      } />
      <Route path="/reports" element={
        <HotelManagerLayout>
          <Reports />
        </HotelManagerLayout>
      } />
      <Route path="/sales" element={
        <HotelManagerLayout>
          <Sales />
        </HotelManagerLayout>
      } />
      <Route path="/cashier" element={
        <HotelManagerLayout>
          <Cashier />
        </HotelManagerLayout>
      } />
      <Route path="/guest-crm" element={
        <HotelManagerLayout>
          <GuestCRM />
        </HotelManagerLayout>
      } />
      <Route path="/revenue-ai" element={
        <HotelManagerLayout>
          <RevenueAI />
        </HotelManagerLayout>
      } />
      <Route path="/operations" element={
        <HotelManagerLayout>
          <Operations />
        </HotelManagerLayout>
      } />
      <Route path="/audit-log" element={
        <HotelManagerLayout>
          <AuditLog />
        </HotelManagerLayout>
      } />
      <Route path="/settings" element={
        <HotelManagerLayout>
          <Settings />
        </HotelManagerLayout>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;