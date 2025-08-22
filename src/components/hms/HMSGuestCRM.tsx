import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  MessageSquare, 
  Calendar, 
  Star,
  Heart,
  MapPin,
  Phone,
  Mail,
  User,
  TrendingUp,
  Download,
  Send,
  Settings,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useHMSStore } from "@/stores/hms-store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface GuestCRMData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  vipStatus: boolean;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  loyaltyPoints: number;
  totalStays: number;
  totalSpend: number;
  averageSpend: number;
  lastStayDate: string;
  nextStayDate?: string;
  preferences: string[];
  notes: string;
  communicationHistory: {
    id: string;
    type: 'Email' | 'SMS' | 'Call' | 'In-Person';
    subject: string;
    content: string;
    date: string;
    staff: string;
  }[];
  bookingHistory: {
    id: string;
    dates: string;
    roomType: string;
    rate: number;
    status: string;
  }[];
}

// Mock CRM data
const mockGuestCRM: GuestCRMData[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    nationality: 'US',
    vipStatus: true,
    loyaltyTier: 'Gold',
    loyaltyPoints: 2500,
    totalStays: 12,
    totalSpend: 15600,
    averageSpend: 1300,
    lastStayDate: '2024-01-10',
    nextStayDate: '2024-02-15',
    preferences: ['Non-smoking', 'High floor', 'King bed', 'Late checkout'],
    notes: 'Prefers room service breakfast. Allergic to shellfish.',
    communicationHistory: [
      {
        id: '1',
        type: 'Email',
        subject: 'Welcome back!',
        content: 'Thank you for choosing our hotel again...',
        date: '2024-01-08',
        staff: 'Sarah Johnson'
      }
    ],
    bookingHistory: [
      {
        id: '1',
        dates: 'Jan 10-12, 2024',
        roomType: 'Deluxe Suite',
        rate: 350,
        status: 'Completed'
      }
    ]
  },
  {
    id: '2',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.wilson@email.com',
    phone: '+1 (555) 987-6543',
    nationality: 'CA',
    vipStatus: false,
    loyaltyTier: 'Silver',
    loyaltyPoints: 1200,
    totalStays: 5,
    totalSpend: 4500,
    averageSpend: 900,
    lastStayDate: '2023-12-20',
    preferences: ['Quiet room', 'Twin beds', 'Airport transfer'],
    notes: 'Business traveler. Prefers early check-in.',
    communicationHistory: [
      {
        id: '2',
        type: 'SMS',
        subject: 'Booking confirmation',
        content: 'Your reservation is confirmed for Dec 20-22',
        date: '2023-12-18',
        staff: 'Mike Davis'
      }
    ],
    bookingHistory: [
      {
        id: '2',
        dates: 'Dec 20-22, 2023',
        roomType: 'Standard Double',
        rate: 180,
        status: 'Completed'
      }
    ]
  }
];

export const HMSGuestCRM = () => {
  const [guestData, setGuestData] = useState<GuestCRMData[]>(mockGuestCRM);
  const [selectedGuest, setSelectedGuest] = useState<GuestCRMData | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [vipFilter, setVipFilter] = useState<string>("all");
  const [messageForm, setMessageForm] = useState({
    type: 'Email',
    subject: '',
    content: ''
  });

  const { addAuditEntry } = useHMSStore();
  const { toast } = useToast();

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guestData.filter(guest => {
      const matchesSearch = 
        guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTier = tierFilter === "all" || guest.loyaltyTier === tierFilter;
      const matchesVip = vipFilter === "all" || 
        (vipFilter === "vip" && guest.vipStatus) ||
        (vipFilter === "regular" && !guest.vipStatus);
      
      return matchesSearch && matchesTier && matchesVip;
    });
  }, [guestData, searchQuery, tierFilter, vipFilter]);

  // CRM Statistics
  const crmStats = useMemo(() => {
    const totalGuests = guestData.length;
    const vipGuests = guestData.filter(g => g.vipStatus).length;
    const averageLoyaltyPoints = Math.round(guestData.reduce((sum, g) => sum + g.loyaltyPoints, 0) / totalGuests);
    const totalLifetimeValue = guestData.reduce((sum, g) => sum + g.totalSpend, 0);
    
    return { totalGuests, vipGuests, averageLoyaltyPoints, totalLifetimeValue };
  }, [guestData]);

  const handleSendMessage = () => {
    if (!selectedGuest || !messageForm.subject || !messageForm.content) {
      toast({ 
        title: "Please fill in all message fields",
        variant: "destructive"
      });
      return;
    }

    const newMessage = {
      id: Date.now().toString(),
      type: messageForm.type as 'Email' | 'SMS' | 'Call' | 'In-Person',
      subject: messageForm.subject,
      content: messageForm.content,
      date: format(new Date(), 'yyyy-MM-dd'),
      staff: 'Current User'
    };

    setGuestData(prev => prev.map(guest => 
      guest.id === selectedGuest.id 
        ? { ...guest, communicationHistory: [newMessage, ...guest.communicationHistory] }
        : guest
    ));

    setSelectedGuest(prev => prev ? {
      ...prev,
      communicationHistory: [newMessage, ...prev.communicationHistory]
    } : null);

    addAuditEntry('Guest Communication', `${messageForm.type} sent to ${selectedGuest.firstName} ${selectedGuest.lastName}`);
    toast({ title: `${messageForm.type} sent successfully` });
    
    setMessageForm({ type: 'Email', subject: '', content: '' });
    setShowMessageModal(false);
  };

  const handleCreateBooking = (guest: GuestCRMData) => {
    addAuditEntry('New Booking', `Booking creation initiated for ${guest.firstName} ${guest.lastName}`);
    toast({ title: "Opening new booking form...", description: `Pre-filled for ${guest.firstName} ${guest.lastName}` });
    // This would typically navigate to the new booking form with pre-filled guest data
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Silver':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Bronze':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guest CRM</h1>
          <p className="text-muted-foreground">Manage guest relationships and communication</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={() => setShowAddGuest(true)}
            className="bg-gradient-primary text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold">{crmStats.totalGuests}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VIP Guests</p>
                <p className="text-2xl font-bold text-purple-600">{crmStats.vipGuests}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Loyalty Points</p>
                <p className="text-2xl font-bold text-green-600">{crmStats.averageLoyaltyPoints}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total LTV</p>
                <p className="text-2xl font-bold text-orange-600">€{crmStats.totalLifetimeValue.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search Guests</Label>
                  <Input
                    id="search"
                    placeholder="Name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Loyalty Tier</Label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Tiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vip">VIP Status</Label>
                  <Select value={vipFilter} onValueChange={setVipFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Guests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Guests</SelectItem>
                      <SelectItem value="vip">VIP Only</SelectItem>
                      <SelectItem value="regular">Regular Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Guest Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest) => (
          <Card key={guest.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                    {guest.firstName[0]}{guest.lastName[0]}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {guest.firstName} {guest.lastName}
                      {guest.vipStatus && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTierColor(guest.loyaltyTier)}>
                        {guest.loyaltyTier}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {guest.loyaltyPoints} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {guest.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {guest.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {guest.nationality}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-muted rounded">
                  <p className="font-semibold">{guest.totalStays}</p>
                  <p className="text-muted-foreground">Stays</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-semibold">€{guest.averageSpend}</p>
                  <p className="text-muted-foreground">Avg Spend</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-semibold">€{guest.totalSpend}</p>
                  <p className="text-muted-foreground">Total</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Last stay: {format(new Date(guest.lastStayDate), 'MMM dd, yyyy')}
                {guest.nextStayDate && (
                  <span className="block">Next stay: {format(new Date(guest.nextStayDate), 'MMM dd, yyyy')}</span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedGuest(guest)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedGuest(guest);
                    setShowMessageModal(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateBooking(guest)}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No guests found matching your criteria</p>
        </div>
      )}

      {/* Guest Details Dialog */}
      {selectedGuest && !showMessageModal && (
        <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedGuest.firstName} {selectedGuest.lastName}
                {selectedGuest.vipStatus && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
                <TabsTrigger value="communications">Communications</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Contact Information</Label>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>{selectedGuest.email}</div>
                        <div>{selectedGuest.phone}</div>
                        <div>{selectedGuest.nationality}</div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Preferences</Label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedGuest.preferences.map((pref, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Stay Statistics</Label>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-muted rounded">
                          <p className="font-semibold">{selectedGuest.totalStays}</p>
                          <p className="text-muted-foreground text-xs">Total Stays</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="font-semibold">€{selectedGuest.totalSpend}</p>
                          <p className="text-muted-foreground text-xs">Total Spend</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <div className="mt-2 p-3 bg-muted rounded text-sm">
                        {selectedGuest.notes}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowMessageModal(true);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" onClick={() => handleCreateBooking(selectedGuest)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    New Booking
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="loyalty" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Badge className={getTierColor(selectedGuest.loyaltyTier)} variant="outline">
                        {selectedGuest.loyaltyTier}
                      </Badge>
                      <p className="text-2xl font-bold mt-2">{selectedGuest.loyaltyPoints}</p>
                      <p className="text-sm text-muted-foreground">Points Balance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto text-green-500" />
                      <p className="text-2xl font-bold mt-2">€{selectedGuest.averageSpend}</p>
                      <p className="text-sm text-muted-foreground">Average Spend</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Heart className="h-8 w-8 mx-auto text-red-500" />
                      <p className="text-2xl font-bold mt-2">€{selectedGuest.totalSpend}</p>
                      <p className="text-sm text-muted-foreground">Lifetime Value</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="communications" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Communication History</h4>
                  <Button
                    size="sm"
                    onClick={() => setShowMessageModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Send Message
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedGuest.communicationHistory.map((comm) => (
                    <Card key={comm.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{comm.type}</Badge>
                            <span className="font-medium">{comm.subject}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(comm.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{comm.content}</p>
                        <div className="text-xs text-muted-foreground">
                          by {comm.staff}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Booking History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dates</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedGuest.bookingHistory.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="text-xs">{booking.dates}</TableCell>
                              <TableCell className="text-xs">{booking.roomType}</TableCell>
                              <TableCell className="text-xs">€{booking.rate}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {booking.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Guest Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm">
                        <p className="font-medium mb-2">Stay Frequency</p>
                        <p className="text-muted-foreground">
                          Average {Math.round(365 / selectedGuest.totalStays)} days between stays
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium mb-2">Seasonal Pattern</p>
                        <p className="text-muted-foreground">
                          Most bookings in Q4 (40%)
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium mb-2">Booking Lead Time</p>
                        <p className="text-muted-foreground">
                          Average 14 days advance booking
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Message Dialog */}
      {showMessageModal && selectedGuest && (
        <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to {selectedGuest.firstName} {selectedGuest.lastName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="messageType">Message Type</Label>
                <Select 
                  value={messageForm.type} 
                  onValueChange={(value) => setMessageForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Call">Phone Call</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Message subject..."
                />
              </div>
              <div>
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={messageForm.content}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};