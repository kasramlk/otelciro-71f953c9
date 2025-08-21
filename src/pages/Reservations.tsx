import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen,
  Plus,
  Calendar,
  Users,
  Filter,
  Download,
  Clock,
  MapPin,
  CreditCard,
  Bell,
  Search
} from "lucide-react";
import { ReservationsList } from "@/components/reservations/ReservationsList";
import { ReservationFilters } from "@/components/reservations/ReservationFilters";
import { ReservationStats } from "@/components/reservations/ReservationStats";
import { GroupReservations } from "@/components/reservations/GroupReservations";
import { WaitlistManagement } from "@/components/reservations/WaitlistManagement";
import { ReservationCalendar } from "@/components/reservations/ReservationCalendar";
import { NewReservationModal } from "@/components/reservations/NewReservationModal";
import { useToast } from "@/hooks/use-toast";

export default function Reservations() {
  const [activeTab, setActiveTab] = useState("all");
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const { toast } = useToast();

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    toast({
      title: "Export Started",
      description: `Reservations are being exported as ${format.toUpperCase()}. Download will start shortly.`,
    });
  };

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    toast({
      title: "Bulk Action",
      description: `${action} applied to ${selectedIds.length} reservations.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 space-y-6 p-4 md:p-8 pt-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center text-foreground">
            <BookOpen className="mr-3 h-8 w-8 text-primary" />
            Reservations Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete reservation lifecycle with group bookings, overbooking, and corporate billing
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              List View
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : ''}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
          </div>
          
          <Button 
            onClick={() => setShowNewReservation(true)}
            className="bg-gradient-primary text-white shadow-glow hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Reservation
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            className="border-border hover:bg-accent"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ReservationStats />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <ReservationFilters onBulkAction={handleBulkAction} />
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="all" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            All Reservations
          </TabsTrigger>
          <TabsTrigger value="arrivals" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Arrivals
          </TabsTrigger>
          <TabsTrigger value="departures" className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            Departures
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Group Bookings
          </TabsTrigger>
          <TabsTrigger value="waitlist" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Waitlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {viewMode === 'list' ? (
              <ReservationsList filterStatus="all" />
            ) : (
              <ReservationCalendar />
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="arrivals" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <ReservationsList filterStatus="arrivals" />
          </motion.div>
        </TabsContent>

        <TabsContent value="departures" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <ReservationsList filterStatus="departures" />
          </motion.div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <GroupReservations />
          </motion.div>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <WaitlistManagement />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* New Reservation Modal */}
      <NewReservationModal 
        open={showNewReservation}
        onClose={() => setShowNewReservation(false)}
      />
    </motion.div>
  );
}