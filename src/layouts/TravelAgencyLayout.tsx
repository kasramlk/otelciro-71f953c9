import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { TravelAgencySidebar } from "@/components/agency/TravelAgencySidebar";
import { AgencyBranding } from "@/components/agency/AgencyBranding";
import { useAgencyAuth } from "@/hooks/use-agency-auth";
import { AgencyAuthProvider } from "@/components/providers/AgencyAuthProvider";
import { AgencySwitcher } from "@/components/agency/AgencySwitcher";

interface TravelAgencyLayoutProps {
  children: ReactNode;
}

const TravelAgencyLayoutContent = ({ children }: TravelAgencyLayoutProps) => {
  const { currentAgency, isLoadingAgencies } = useAgencyAuth();

  if (isLoadingAgencies) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Loading agency data...</div>
      </div>
    );
  }

  if (!currentAgency) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold mb-2">No Agency Found</h2>
          <p className="text-muted-foreground mb-4">You don't have access to any travel agency. Create one to get started.</p>
          <AgencySwitcher />
        </div>
      </div>
    );
  }

  return (
    <AgencyBranding agencyId={currentAgency.id}>
      <div className="flex h-screen bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-background dark:via-background dark:to-background">
        <TravelAgencySidebar />
        
        <main className="flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full overflow-y-auto"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="border-l-4 border-primary pl-4">
                  <h1 className="text-2xl font-bold text-foreground">{currentAgency.name}</h1>
                  <p className="text-muted-foreground">Search, compare and book hotel inventory worldwide</p>
                </div>
                <AgencySwitcher />
              </div>
              {children}
            </div>
          </motion.div>
        </main>
      </div>
    </AgencyBranding>
  );
};

export const TravelAgencyLayout = ({ children }: TravelAgencyLayoutProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AgencyAuthProvider>
        <TravelAgencyLayoutContent>
          {children}
        </TravelAgencyLayoutContent>
      </AgencyAuthProvider>
    </ThemeProvider>
  );
};