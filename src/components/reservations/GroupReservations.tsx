import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Users,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

// Mock data for group reservations
const mockGroupReservations = [
  {
    id: 'grp_001',
    name: 'Johnson Wedding Party',
    groupCode: 'JWED2024',
    groupType: 'Wedding',
    organizer: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0123',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SJ'
    },
    startDate: '2024-03-15',
    endDate: '2024-03-17',
    roomBlockSize: 20,
    roomsPickedUp: 12,
    roomsAvailable: 8,
    groupRate: 180.00,
    cutoffDate: '2024-03-01',
    status: 'Active',
    totalRevenue: 6480.00,
    avgNights: 2,
    notes: 'Bride & Groom require presidential suite. Block release after cutoff date.',
    reservations: [
      { guestName: 'Sarah Johnson', roomType: 'Presidential Suite', checkIn: '2024-03-15', nights: 2 },
      { guestName: 'Mike Johnson', roomType: 'Deluxe', checkIn: '2024-03-15', nights: 2 },
      { guestName: 'Mary Smith', roomType: 'Standard', checkIn: '2024-03-15', nights: 1 },
    ]
  },
  {
    id: 'grp_002',
    name: 'Tech Conference 2024',
    groupCode: 'TECH2024',
    groupType: 'Conference',
    organizer: {
      name: 'David Chen',
      email: 'david.chen@techconf.com',
      phone: '+1-555-0456',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DC'
    },
    startDate: '2024-04-10',
    endDate: '2024-04-12',
    roomBlockSize: 50,
    roomsPickedUp: 35,
    roomsAvailable: 15,
    groupRate: 160.00,
    cutoffDate: '2024-03-25',
    status: 'Active',
    totalRevenue: 11200.00,
    avgNights: 2,
    notes: 'Corporate billing. Meeting rooms reserved for conference sessions.',
    reservations: []
  },
  {
    id: 'grp_003',
    name: 'European Tour Group',
    groupCode: 'EURTOUR',
    groupType: 'Tour',
    organizer: {
      name: 'Anna Mueller',
      email: 'anna@europetours.com',
      phone: '+49-123-456789',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AM'
    },
    startDate: '2024-05-20',
    endDate: '2024-05-22',
    roomBlockSize: 25,
    roomsPickedUp: 25,
    roomsAvailable: 0,
    groupRate: 140.00,
    cutoffDate: '2024-05-10',
    status: 'Confirmed',
    totalRevenue: 10500.00,
    avgNights: 3,
    notes: 'All rooms confirmed. Late arrival expected (after 8 PM).',
    reservations: []
  }
];

const getStatusBadge = (status: string) => {
  const statusConfig = {
    'Active': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: Clock },
    'Confirmed': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
    'Cancelled': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: AlertTriangle },
  };
  
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.Active;
};

const getGroupTypeIcon = (type: string) => {
  const typeIcons = {
    'Wedding': '💒',
    'Conference': '🏢',
    'Tour': '🌍',
    'Corporate': '💼'
  };
  
  return typeIcons[type as keyof typeof typeIcons] || '👥';
};

export const GroupReservations = () => {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-muted-foreground">Active Groups</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">95</div>
                <div className="text-xs text-muted-foreground">Total Room Block</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">72</div>
                <div className="text-xs text-muted-foreground">Rooms Picked Up</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">$28.2K</div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Group Reservations & Room Blocks
            </div>
            <Button className="bg-gradient-primary text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Group Block
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockGroupReservations.map((group, index) => {
              const statusBadge = getStatusBadge(group.status);
              const pickupPercentage = (group.roomsPickedUp / group.roomBlockSize) * 100;
              
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <Card className="shadow-sm border-border/50 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          {/* Group Header */}
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">{getGroupTypeIcon(group.groupType)}</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold">{group.name}</h3>
                                <Badge variant="outline">{group.groupCode}</Badge>
                                <Badge className={statusBadge.color}>
                                  <statusBadge.icon className="mr-1 h-3 w-3" />
                                  {group.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {format(parseISO(group.startDate), 'MMM dd')} - {format(parseISO(group.endDate), 'MMM dd, yyyy')}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="mr-1 h-3 w-3" />
                                  {group.groupType}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Organizer Info */}
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={group.organizer.avatar} />
                              <AvatarFallback>{group.organizer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{group.organizer.name}</div>
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                <span className="flex items-center">
                                  <Mail className="mr-1 h-3 w-3" />
                                  {group.organizer.email}
                                </span>
                                <span className="flex items-center">
                                  <Phone className="mr-1 h-3 w-3" />
                                  {group.organizer.phone}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Room Block Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Room Block Progress</span>
                              <span>{group.roomsPickedUp}/{group.roomBlockSize} rooms picked up</span>
                            </div>
                            <Progress value={pickupPercentage} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Pickup Rate: {pickupPercentage.toFixed(1)}%</span>
                              <span>{group.roomsAvailable} rooms available</span>
                            </div>
                          </div>

                          {/* Financial Summary */}
                          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
                            <div>
                              <div className="text-lg font-semibold">${group.groupRate}</div>
                              <div className="text-xs text-muted-foreground">Group Rate</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">${group.totalRevenue.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Total Revenue</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{format(parseISO(group.cutoffDate), 'MMM dd')}</div>
                              <div className="text-xs text-muted-foreground">Cutoff Date</div>
                            </div>
                          </div>

                          {/* Notes */}
                          {group.notes && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-sm text-muted-foreground">{group.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{group.name} - Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Group Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <div>Group Code: {group.groupCode}</div>
                                      <div>Type: {group.groupType}</div>
                                      <div>Status: {group.status}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Room Block</h4>
                                    <div className="space-y-1 text-sm">
                                      <div>Block Size: {group.roomBlockSize} rooms</div>
                                      <div>Picked Up: {group.roomsPickedUp} rooms</div>
                                      <div>Available: {group.roomsAvailable} rooms</div>
                                    </div>
                                  </div>
                                </div>
                                {group.reservations.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Individual Reservations</h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Guest</TableHead>
                                          <TableHead>Room Type</TableHead>
                                          <TableHead>Check-in</TableHead>
                                          <TableHead>Nights</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {group.reservations.map((res, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell>{res.guestName}</TableCell>
                                            <TableCell>{res.roomType}</TableCell>
                                            <TableCell>{format(parseISO(res.checkIn), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{res.nights}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Block
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Reservation
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};