import { ReactNode } from "react";
import { motion } from "framer-motion";
import { HMSSidebar } from "@/components/hms/HMSSidebar";
import { ThemeProvider } from "next-themes";

interface HMSLayoutProps {
  children: ReactNode;
}

export const HMSLayout = ({ children }: HMSLayoutProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen bg-background">
        <HMSSidebar />
        
        <main className="flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full overflow-y-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </ThemeProvider>
  );
};