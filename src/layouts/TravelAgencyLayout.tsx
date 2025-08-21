import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { TravelAgencySidebar } from "@/components/agency/TravelAgencySidebar";
import { AgencyBranding } from "@/components/agency/AgencyBranding";

interface TravelAgencyLayoutProps {
  children: ReactNode;
}

export const TravelAgencyLayout = ({ children }: TravelAgencyLayoutProps) => {
  // TODO: Get actual agency ID from user context
  const agencyId = "sample-agency-id";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AgencyBranding agencyId={agencyId}>
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
                <div className="border-l-4 border-primary pl-4">
                  <h1 className="text-2xl font-bold text-foreground">Travel Agency Portal</h1>
                  <p className="text-muted-foreground">Search, compare and book hotel inventory worldwide</p>
                </div>
                {children}
              </div>
            </motion.div>
          </main>
        </div>
      </AgencyBranding>
    </ThemeProvider>
  );
};