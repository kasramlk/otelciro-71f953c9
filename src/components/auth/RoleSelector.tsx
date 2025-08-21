import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Plane, 
  Shield, 
  Hotel, 
  MapPin, 
  Calendar,
  TrendingUp,
  Globe
} from "lucide-react";

interface RoleSelectorProps {
  onRoleSelect: (role: 'hotel_manager' | 'travel_agency' | 'admin') => void;
}

const roles = [
  {
    id: 'hotel_manager',
    title: 'Hotel Manager',
    description: 'Manage your property, reservations, and operations',
    icon: Building2,
    features: ['PMS Dashboard', 'Room Management', 'Channel Manager', 'Reports & Analytics'],
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'travel_agency',
    title: 'Travel Agency',
    description: 'Search, book and manage hotel inventory',
    icon: Plane,
    features: ['Mini-GDS Search', 'Real-time Booking', 'Negotiated Rates', 'Commission Tracking'],
    color: 'bg-green-500',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'admin',
    title: 'System Admin',
    description: 'Manage platform users and global settings',
    icon: Shield,
    features: ['User Management', 'Global Settings', 'Platform Analytics', 'System Monitoring'],
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600'
  }
];

export const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setTimeout(() => {
      onRoleSelect(roleId as any);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Hotel className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OtelCiro Platform
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Next-generation Hotel PMS + Channel Manager + Mini-GDS Agency Dashboard
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Multi-tenant SaaS
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Real-time ARI
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              AI-powered
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`cursor-pointer transition-all duration-300 ${
                selectedRole === role.id ? 'scale-105' : ''
              }`}
            >
              <Card 
                className={`h-full border-2 transition-all duration-300 hover:shadow-xl ${
                  selectedRole === role.id 
                    ? 'border-primary shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader className="text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${role.gradient} flex items-center justify-center mb-4`}>
                    <role.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${role.color}`} />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${role.gradient} hover:opacity-90 text-white border-0`}
                    disabled={selectedRole === role.id}
                  >
                    {selectedRole === role.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      `Access ${role.title}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>Select your role to access the appropriate dashboard and features</p>
        </motion.div>
      </div>
    </div>
  );
};