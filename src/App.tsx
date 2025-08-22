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
import NewReservation from "./pages/NewReservation";
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
import AgencyBookings from "./pages/agency/AgencyBookings";
import AgencyReports from "./pages/agency/AgencyReports";
import AgencyPayments from "./pages/agency/AgencyPayments";
import AgencyNegotiations from "./pages/agency/AgencyNegotiations";
import AgencyProfile from "./pages/agency/AgencyProfile";
import HotelDashboard from "./pages/hotel/HotelDashboard";
import HotelReservations from "./pages/hotel/HotelReservations";
import HousekeepingModule from "./pages/hotel/HousekeepingModule";
import { HotelManagerLayout } from "./layouts/HotelManagerLayout";
import { HMSLayout } from "./layouts/HMSLayout";
import { HMSDashboard } from "./components/hms/HMSDashboard";
import { HMSReservations } from "./components/hms/HMSReservations";
import { HMSRoomPlan } from "./components/hms/HMSRoomPlan";
import { HMSHousekeeping } from "./components/hms/HMSHousekeeping";
import { HMSFrontOffice } from "./components/hms/HMSFrontOffice";
import { HMSGuests } from "./components/hms/HMSGuests";
import { HMSAnalytics } from "./components/hms/HMSAnalytics";
import { HMSGuestCRM } from "./components/hms/HMSGuestCRM";
import { HMSChannelMapping } from "./components/hms/HMSChannelMapping";
import { HMSChannelReconciliation } from "./components/hms/HMSChannelReconciliation";
import { HMSRevenueAI } from "./components/hms/HMSRevenueAI";
import { HMSNewReservation } from "./components/hms/HMSNewReservation";
import { NotificationCenter } from "./components/realtime/NotificationCenter";
import { OnlineUsers } from "./components/realtime/OnlineUsers";
import ChannelARICalendar from "./components/channel/ARICalendar";
import ChannelMapping from "./components/channel/ChannelMapping";
import ChannelReconciliation from "./components/channel/ChannelReconciliation";
import ChannelOrders from "./components/channel/ChannelOrders";
import { TravelAgencyLayout } from "./layouts/TravelAgencyLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import HotelOnboarding from "./pages/admin/HotelOnboarding";
import UserManagement from "./pages/admin/UserManagement";
import AgencyManagement from "./pages/admin/AgencyManagement";
import PlatformSettings from "./pages/admin/PlatformSettings";
import HotelManagement from "./pages/admin/HotelManagement";
import AuditMonitoring from "./pages/admin/AuditMonitoring";
import GuestCRM from "./pages/GuestCRM";
import RevenueAI from "./pages/RevenueAI";
import Operations from "./pages/Operations";
import FrontOffice from "./pages/FrontOffice";
import GuestExperience from "./pages/GuestExperience";
import Analytics from "./pages/Analytics";
import QATestSuite from "./pages/QATestSuite";
import UserProfilePage from "./pages/UserProfile";
import SocialMedia from "./pages/SocialMedia";
import SocialMediaBrandKit from "./pages/SocialMediaBrandKit";
import SocialMediaGenerator from "./pages/SocialMediaGenerator";
import SocialMediaCalendar from "./pages/SocialMediaCalendar";
import SocialMediaAnalyticsPage from "./pages/SocialMediaAnalytics";

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
            <Route path="/agency/bookings" element={<AgencyBookings />} />
            <Route path="/agency/contracts" element={<AgencyNegotiations />} />
            <Route path="/agency/payments" element={<AgencyPayments />} />
            <Route path="/agency/analytics" element={<AgencyReports />} />
            <Route path="/agency/profile" element={<AgencyProfile />} />
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
            <Route path="/admin/hotels" element={<HotelManagement />} />
            <Route path="/admin/onboarding" element={<HotelOnboarding />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/agencies" element={<AgencyManagement />} />
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
      
      {/* HMS Routes */}
      <Route path="/dashboard" element={
        <HMSLayout>
          <HMSDashboard />
        </HMSLayout>
      } />
      <Route path="/reservations" element={
        <HMSLayout>
          <HMSReservations />
        </HMSLayout>
      } />
      <Route path="/reservations/new" element={
        <HMSLayout>
          <HMSNewReservation />
        </HMSLayout>
      } />
      <Route path="/channel/ari" element={
        <HMSLayout>
          <ChannelARICalendar />
        </HMSLayout>
      } />
      <Route path="/channel/mapping" element={
        <HMSLayout>
          <ChannelMapping />
        </HMSLayout>
      } />
      <Route path="/channel/reconcile" element={
        <HMSLayout>
          <ChannelReconciliation />
        </HMSLayout>
      } />
      <Route path="/channel/orders" element={
        <HMSLayout>
          <ChannelOrders />
        </HMSLayout>
      } />
      <Route path="/room-plan" element={
        <HMSLayout>
          <HMSRoomPlan />
        </HMSLayout>
      } />
      <Route path="/housekeeping" element={
        <HMSLayout>
          <HMSHousekeeping />
        </HMSLayout>
      } />
      <Route path="/front-office" element={
        <HMSLayout>
          <HMSFrontOffice />
        </HMSLayout>
      } />
      <Route path="/guests" element={
        <HMSLayout>
          <HMSGuests />
        </HMSLayout>
      } />
      <Route path="/guest-crm" element={
        <HMSLayout>
          <HMSGuestCRM />
        </HMSLayout>
      } />
      <Route path="/analytics" element={
        <HMSLayout>
          <HMSAnalytics />
        </HMSLayout>
      } />
      <Route path="/revenue-ai" element={
        <HMSLayout>
          <HMSRevenueAI />
        </HMSLayout>
      } />
      <Route path="/notifications" element={
        <HMSLayout>
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            <NotificationCenter />
          </div>
        </HMSLayout>
      } />
      <Route path="/online-users" element={
        <HMSLayout>
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Online Users</h1>
            <OnlineUsers />
          </div>
        </HMSLayout>
      } />
      <Route path="/profile" element={
        <HMSLayout>
          <UserProfilePage />
        </HMSLayout>
      } />
      
      {/* Social Media Routes */}
      <Route path="/social-media" element={
        <HMSLayout>
          <SocialMedia />
        </HMSLayout>
      } />
      <Route path="/social-media/brand-kit" element={
        <HMSLayout>
          <SocialMediaBrandKit />
        </HMSLayout>
      } />
      <Route path="/social-media/calendar" element={
        <HMSLayout>
          <SocialMediaCalendar />
        </HMSLayout>
      } />
      <Route path="/social-media/generator" element={
        <HMSLayout>
          <SocialMediaGenerator />
        </HMSLayout>
      } />
      <Route path="/social-media/analytics" element={
        <HMSLayout>
          <SocialMediaAnalyticsPage />
        </HMSLayout>
      } />
      
      <Route path="/reports" element={
        <HMSLayout>
          <Reports />
        </HMSLayout>
      } />
      <Route path="/settings" element={
        <HMSLayout>
          <Settings />
        </HMSLayout>
      } />
      <Route path="/audit-log" element={
        <HMSLayout>
          <AuditLog />
        </HMSLayout>
      } />
      <Route path="/ari-calendar" element={
        <HotelManagerLayout>
          <ChannelARICalendar />
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
      <Route path="/operations" element={
        <HotelManagerLayout>
          <Operations />
        </HotelManagerLayout>
      } />
      <Route path="/guest-experience" element={
        <HotelManagerLayout>
          <GuestExperience />
        </HotelManagerLayout>
      } />
      <Route path="/qa" element={
        <HotelManagerLayout>
          <QATestSuite />
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