import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { TravelAgencySidebar } from "@/components/agency/TravelAgencySidebar";

interface TravelAgencyLayoutProps {
  children: ReactNode;
}

export const TravelAgencyLayout = ({ children }: TravelAgencyLayoutProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
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
              <div className="border-l-4 border-green-500 pl-4">
                <h1 className="text-2xl font-bold text-foreground">Travel Agency Portal</h1>
                <p className="text-muted-foreground">Search, compare and book hotel inventory worldwide</p>
              </div>
              {children}
            </div>
          </motion.div>
        </main>
      </div>
    </ThemeProvider>
  );
};