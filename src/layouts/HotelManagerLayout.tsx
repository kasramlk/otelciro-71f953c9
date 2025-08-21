import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ModernLayout } from "@/components/layout/ModernLayout";

interface HotelManagerLayoutProps {
  children: ReactNode;
}

export const HotelManagerLayout = ({ children }: HotelManagerLayoutProps) => {
  return (
    <ModernLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="border-l-4 border-primary pl-4">
          <h1 className="text-2xl font-bold text-foreground">Hotel Management Dashboard</h1>
          <p className="text-muted-foreground">Manage your property operations, reservations, and channel distribution</p>
        </div>
        {children}
      </motion.div>
    </ModernLayout>
  );
};