import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ModernSidebar } from "./ModernSidebar";
import { ThemeProvider } from "next-themes";

interface ModernLayoutProps {
  children: ReactNode;
}

export const ModernLayout = ({ children }: ModernLayoutProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen bg-background">
        <ModernSidebar />
        
        <main className="flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full overflow-y-auto"
          >
            <div className="p-8 space-y-8">
              {children}
            </div>
          </motion.div>
        </main>
      </div>
    </ThemeProvider>
  );
};