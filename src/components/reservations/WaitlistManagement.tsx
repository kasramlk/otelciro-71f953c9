import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Bell,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  ArrowUp,
  ArrowDown,
  Plus,
  Bed,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

// Mock waitlist data
const mockWaitlistEntries = [
  {
    id: 'wait_001',
    guest: {
      name: 'Robert Wilson',
      email: 'robert.wilson@email.com',
      phone: '+1-555-0789',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=RW',
      loyaltyTier: 'Gold'
    },
    roomType: 'Suite',
    checkIn: '2024-03-20',
    checkOut: '2024-03-23',
    adults: 2,
    children: 0,
    priority: 1,
    status: 'Active',
    requestedRate: 280.00,
    notes: 'VIP guest - anniversary celebration',
    createdAt: '2024-02-15',
    estimatedAvailability: '2024-03-18'
  },
  {
    id: 'wait_002',
    guest: {
      name: 'Lisa Anderson',
      email: 'lisa.anderson@company.com',
      phone: '+1-555-0321',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=LA',
      loyaltyTier: 'Platinum'
    },
    roomType: 'Executive',
    checkIn: '2024-03-22',
    checkOut: '2024-03-25',
    adults: 1,
    children: 1,
    priority: 1,
    status: 'Active',
    requestedRate: 220.00,
    notes: 'Corporate account - frequent guest',
    createdAt: '2024-02-18',
    estimatedAvailability: '2024-03-20'
  },
  {
    id: 'wait_003',
    guest: {
      name: 'Michael Brown',
      email: 'mbrown@gmail.com',
      phone: '+1-555-0654',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MB',
      loyaltyTier: 'Silver'
    },
    roomType: 'Standard',
    checkIn: '2024-03-25',
    checkOut: '2024-03-27',
    adults: 2,
    children: 2,
    priority: 3,
    status: 'Active',
    requestedRate: 150.00,
    notes: 'Family vacation - flexible dates',
    createdAt: '2024-02-20',
    estimatedAvailability: '2024-03-24'
  }
];

const getPriorityBadge = (priority: number) => {
  const priorityConfig = {
    1: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', label: 'High', icon: ArrowUp },
    2: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', label: 'Medium', icon: ArrowUp },
    3: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', label: 'Low', icon: ArrowDown },
  };
  
  return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[2];
};

const getLoyaltyBadge = (tier: string) => {
  const tierConfig = {
    'Standard': { color: 'bg-gray-100 text-gray-800' },
    'Silver': { color: 'bg-slate-100 text-slate-800' },
    'Gold': { color: 'bg-yellow-100 text-yellow-800' },
    'Platinum': { color: 'bg-purple-100 text-purple-800' },
  };
  
  return tierConfig[tier as keyof typeof tierConfig] || tierConfig.Standard;
};

export const WaitlistManagement = () => {
  const [waitlistEntries, setWaitlistEntries] = useState(mockWaitlistEntries);
  
  const updatePriority = (id: string, newPriority: number) => {
    setWaitlistEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, priority: newPriority } : entry
      )
    );
  };

  const confirmReservation = (id: string) => {
    setWaitlistEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, status: 'Confirmed' } : entry
      )
    );
  };

  // Waitlist statistics
  const totalWaitlist = waitlistEntries.length;
  const highPriority = waitlistEntries.filter(e => e.priority === 1).length;
  const estimatedRevenue = waitlistEntries.reduce((sum, entry) => {
    const nights = Math.ceil((parseISO(entry.checkOut).getTime() - parseISO(entry.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return sum + (entry.requestedRate * nights);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Waitlist Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalWaitlist}</div>
                <div className="text-xs text-muted-foreground">Total Waitlist</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50 border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{highPriority}</div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">${estimatedRevenue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Potential Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">85%</div>
                <div className="text-xs text-muted-foreground">Conversion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist Table */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-primary" />
              Overbooking Waitlist Management
              <Badge variant="secondary" className="ml-2">
                {totalWaitlist} entries
              </Badge>
            </div>
            <Button className="bg-gradient-primary text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add to Waitlist
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Guest</TableHead>
                  <TableHead className="font-semibold">Dates</TableHead>
                  <TableHead className="font-semibold">Room Request</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Est. Availability</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlistEntries.map((entry, index) => {
                  const priorityBadge = getPriorityBadge(entry.priority);
                  const loyaltyBadge = getLoyaltyBadge(entry.guest.loyaltyTier);
                  const nights = Math.ceil((parseISO(entry.checkOut).getTime() - parseISO(entry.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                  const totalAmount = entry.requestedRate * nights;
                  
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.guest.avatar} />
                            <AvatarFallback>{entry.guest.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{entry.guest.name}</div>
                            <Badge className={`${loyaltyBadge.color} text-xs`}>
                              {entry.guest.loyaltyTier}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.adults} adults{entry.children > 0 && `, ${entry.children} children`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {format(parseISO(entry.checkIn), 'MMM dd')} - {format(parseISO(entry.checkOut), 'MMM dd')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {nights} night{nights !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Added: {format(parseISO(entry.createdAt), 'MMM dd')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{entry.roomType}</div>
                          <div className="text-xs text-muted-foreground">
                            ${entry.requestedRate}/night
                          </div>
                          <div className="text-xs font-medium">
                            Total: ${totalAmount.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={priorityBadge.color}>
                            <priorityBadge.icon className="mr-1 h-3 w-3" />
                            {priorityBadge.label}
                          </Badge>
                          <div className="flex flex-col space-y-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePriority(entry.id, Math.max(1, entry.priority - 1))}
                              className="h-5 w-5 p-0"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePriority(entry.id, Math.min(3, entry.priority + 1))}
                              className="h-5 w-5 p-0"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'Confirmed' ? 'default' : 'secondary'}>
                          {entry.status === 'Confirmed' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {format(parseISO(entry.estimatedAvailability), 'MMM dd')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Expected availability
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {entry.status === 'Active' && (
                            <Button
                              size="sm"
                              onClick={() => confirmReservation(entry.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Confirm
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm">
                            <Phone className="mr-1 h-3 w-3" />
                            Call
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Mail className="mr-1 h-3 w-3" />
                            Email
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Waitlist Notes */}
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Waitlist Notes & Special Requests</h4>
            {waitlistEntries.map((entry) => (
              entry.notes && (
                <div key={entry.id} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.guest.avatar} />
                      <AvatarFallback className="text-xs">{entry.guest.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{entry.guest.name}</div>
                      <div className="text-sm text-muted-foreground">{entry.notes}</div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};