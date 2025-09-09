import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { setupGlobalErrorHandling } from "@/lib/error-handler";
import { ProtectedSocialMediaRoute } from "@/components/auth/ProtectedSocialMediaRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import { CompanyProfile } from "./pages/CompanyProfile";
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
import AgencySearches from "./pages/agency/AgencySearches";
import AgencyPartners from "./pages/agency/AgencyPartners";
import HotelDashboard from "./pages/hotel/HotelDashboard";
import HotelReservations from "./pages/hotel/HotelReservations";
import HousekeepingModule from "./pages/hotel/HousekeepingModule";
import HotelNotifications from "./pages/hotel/HotelNotifications";
import GuestFolio from "./pages/hotel/GuestFolio";
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
import { HMSRevenueAI } from "./components/hms/HMSRevenueAI";
import { HMSNewReservation } from "./components/hms/HMSNewReservation";
import { NotificationCenter } from "./components/realtime/NotificationCenter";
import { OnlineUsers } from "./components/realtime/OnlineUsers";
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
import SocialMediaAdvanced from "./pages/SocialMediaAdvanced";
import SocialMediaIntegration from "./pages/SocialMediaIntegration";
import SocialMediaEnterprise from "./pages/SocialMediaEnterprise";
import Beds24Integration from "./pages/admin/Beds24Integration";

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
  const { isAdmin, loading: authLoading } = useAuth();

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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Index />} />
      <Route path="/compprofile" element={<CompanyProfile />} />
      
      {/* Protected Routes - Redirect to auth if no session */}
      {!session ? (
        <Route path="*" element={<Navigate to="/auth" replace />} />
      ) : (
        <>
          {/* Role-based routing for authenticated users */}
          {userRole === 'travel_agency' && location.pathname !== '/' && !location.pathname.startsWith('/agency') && (
            <Route path="*" element={<Navigate to="/agency" replace />} />
          )}
          
          {userRole === 'admin' && location.pathname !== '/' && !location.pathname.startsWith('/admin') && (
            <Route path="*" element={<Navigate to="/admin" replace />} />
          )}
          
          {/* Agency Routes */}
          <Route path="/agency" element={
            userRole === 'travel_agency' ? (
              <TravelAgencyLayout>
                <AgencyDashboard />
              </TravelAgencyLayout>
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/agency/search" element={
            userRole === 'travel_agency' ? (
              <TravelAgencyLayout>
                <HotelSearch />
              </TravelAgencyLayout>
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/agency/bookings" element={
            userRole === 'travel_agency' ? (
              <TravelAgencyLayout>
                <AgencyBookings />
              </TravelAgencyLayout>
            ) : <Navigate to="/dashboard" replace />
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            authLoading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : isAdmin() ? (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/admin/hotels" element={
            authLoading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : isAdmin() ? (
              <AdminLayout>
                <HotelManagement />
              </AdminLayout>
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/admin/beds24-integration" element={
            authLoading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : isAdmin() ? (
              <AdminLayout>
                <Beds24Integration />
              </AdminLayout>
            ) : <Navigate to="/dashboard" replace />
          } />
          
          {/* HMS Routes - Default for hotel managers */}
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
          <Route path="/profile" element={
            <HMSLayout>
              <UserProfilePage />
            </HMSLayout>
          } />
          
          {/* Social Media Routes */}
          <Route path="/social-media" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMedia />
              </ProtectedSocialMediaRoute>
            </HMSLayout>
          } />
          <Route path="/social-media/brand-kit" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMediaBrandKit />
              </ProtectedSocialMediaRoute>
            </HMSLayout>
          } />
          <Route path="/social-media/calendar" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMediaCalendar />
              </ProtectedSocialMediaRoute>
            </HMSLayout>
          } />
          <Route path="/social-media/generator" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMediaGenerator />
              </ProtectedSocialMediaRoute>
            </HMSLayout>
          } />
          <Route path="/social-media/analytics" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMediaAnalyticsPage />
              </ProtectedSocialMediaRoute>
            </HMSLayout>
          } />
          <Route path="/social-media/advanced" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMediaAdvanced />
              </ProtectedSocialMediaRoute>
            </HMSLayout>
          } />
          <Route path="/social-media/integrations" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMediaIntegration />
              </ProtectedSocialMediaRoute>
            </HMSLayout>
          } />
          <Route path="/social-media/enterprise" element={
            <HMSLayout>
              <ProtectedSocialMediaRoute>
                <SocialMediaEnterprise />
              </ProtectedSocialMediaRoute>
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
          
          {/* Hotel Management Routes */}
          <Route path="/hotel/dashboard" element={
            <HotelManagerLayout>
              <HotelDashboard />
            </HotelManagerLayout>
          } />
          <Route path="/hotel/reservations" element={
            <HotelManagerLayout>
              <HotelReservations />
            </HotelManagerLayout>
          } />
          <Route path="/hotel/notifications" element={
            <HotelManagerLayout>
              <HotelNotifications />
            </HotelManagerLayout>
          } />
          <Route path="/hotel/folio" element={
            <HotelManagerLayout>
              <GuestFolio />
            </HotelManagerLayout>
          } />
          <Route path="/hotel/housekeeping" element={
            <HotelManagerLayout>
              <HousekeepingModule />
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
          
          {/* Catch all for authenticated users */}
          <Route path="*" element={<NotFound />} />
        </>
      )}
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