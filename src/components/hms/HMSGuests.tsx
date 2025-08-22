import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, Eye, Star, MessageSquare, Calendar, Download, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useHMSStore } from '@/stores/hms-store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const HMSGuests = () => {
  const { guests, addGuest, updateGuest, deleteGuest, addAuditEntry } = useHMSStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [vipFilter, setVipFilter] = useState('all');
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [modalType, setModalType] = useState<'profile' | 'crm' | 'edit' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = searchQuery === '' || 
        `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.phone.includes(searchQuery);
      
      const matchesTier = tierFilter === 'all' || guest.loyaltyTier === tierFilter;
      const matchesVip = vipFilter === 'all' || 
        (vipFilter === 'vip' && guest.vipStatus) ||
        (vipFilter === 'regular' && !guest.vipStatus);

      return matchesSearch && matchesTier && matchesVip;
    });
  }, [guests, searchQuery, tierFilter, vipFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: guests.length,
      vip: guests.filter(g => g.vipStatus).length,
      gold: guests.filter(g => g.loyaltyTier === 'Gold').length,
      silver: guests.filter(g => g.loyaltyTier === 'Silver').length,
      blacklisted: guests.filter(g => g.blacklisted).length
    };
  }, [guests]);

  // Handle new guest
  const handleAddGuest = (guestData: any) => {
    addGuest({
      firstName: guestData.firstName,
      lastName: guestData.lastName,
      email: guestData.email,
      phone: guestData.phone,
      nationality: guestData.nationality || 'US',
      dateOfBirth: new Date(guestData.dateOfBirth),
      idNumber: guestData.idNumber || '',
      vipStatus: false,
      loyaltyTier: 'Standard',
      loyaltyPoints: 0,
      lastStay: new Date(),
      totalStays: 0,
      totalSpent: 0,
      preferences: [],
      blacklisted: false,
      notes: guestData.notes || ''
    });

    addAuditEntry('Guest Created', `New guest ${guestData.firstName} ${guestData.lastName} added to system`);
    toast({ title: 'Guest added successfully' });
    setShowNewGuestModal(false);
  };

  // Handle edit guest
  const handleEditGuest = (guestId: string, updates: any) => {
    updateGuest(guestId, updates);
    addAuditEntry('Guest Updated', `Guest profile updated for ${updates.firstName || ''} ${updates.lastName || ''}`);
    toast({ title: 'Guest updated successfully' });
    setModalType(null);
    setSelectedGuest(null);
  };

  // Handle delete guest
  const handleDeleteGuest = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    if (confirm(`Are you sure you want to delete ${guest.firstName} ${guest.lastName}?`)) {
      deleteGuest(guestId);
      addAuditEntry('Guest Deleted', `Guest ${guest.firstName} ${guest.lastName} removed from system`);
      toast({ title: 'Guest deleted successfully' });
    }
  };

  // Export guests
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Nationality', 'Loyalty Tier', 'Points', 'Total Stays', 'Total Spent', 'VIP Status'].join(','),
      ...filteredGuests.map(g => [
        `${g.firstName} ${g.lastName}`,
        g.email,
        g.phone,
        g.nationality,
        g.loyaltyTier,
        g.loyaltyPoints,
        g.totalStays,
        g.totalSpent,
        g.vipStatus ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Guest list exported successfully' });
  };

  const getTierBadge = (tier: string) => {
    const variants = {
      'Gold': 'default',
      'Silver': 'secondary', 
      'Standard': 'outline'
    };
    return <Badge variant={(variants[tier as keyof typeof variants] as any) || 'outline'}>{tier}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Management</h1>
          <p className="text-muted-foreground">Manage guest profiles and CRM data</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowNewGuestModal(true)} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Guests</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">VIP Guests</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.vip}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Gold Members</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.gold}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Silver Members</p>
              <p className="text-2xl font-bold text-gray-600">{stats.silver}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Blacklisted</p>
              <p className="text-2xl font-bold text-red-600">{stats.blacklisted}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t flex items-center gap-4">
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={vipFilter} onValueChange={setVipFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by VIP status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Guests</SelectItem>
                  <SelectItem value="vip">VIP Only</SelectItem>
                  <SelectItem value="regular">Regular Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Guests ({filteredGuests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Last Stay</TableHead>
                  <TableHead>Total Stays</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow key={guest.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{guest.firstName} {guest.lastName}</p>
                          <p className="text-sm text-muted-foreground">{guest.nationality}</p>
                        </div>
                        {guest.vipStatus && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{guest.email}</p>
                        <p className="text-sm text-muted-foreground">{guest.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getTierBadge(guest.loyaltyTier)}
                        <p className="text-sm text-muted-foreground mt-1">{guest.loyaltyPoints} pts</p>
                      </div>
                    </TableCell>
                    <TableCell>{format(guest.lastStay, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{guest.totalStays}</TableCell>
                    <TableCell>€{guest.totalSpent.toLocaleString()}</TableCell>
                    <TableCell>
                      {guest.blacklisted ? (
                        <Badge variant="destructive">Blacklisted</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            setSelectedGuest(guest);
                            setModalType('profile');
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedGuest(guest);
                            setModalType('crm');
                          }}>
                            <Users className="h-4 w-4 mr-2" />
                            Guest CRM
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedGuest(guest);
                            setModalType('edit');
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredGuests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No guests found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Guest Modal */}
      <Dialog open={showNewGuestModal} onOpenChange={setShowNewGuestModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
          </DialogHeader>
          <AddGuestForm onSave={handleAddGuest} onCancel={() => setShowNewGuestModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Guest Profile/CRM/Edit Modals */}
      {selectedGuest && (
        <>
          <Dialog open={modalType === 'profile'} onOpenChange={() => setModalType(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Guest Profile - {selectedGuest.firstName} {selectedGuest.lastName}</DialogTitle>
              </DialogHeader>
              <GuestProfileModal guest={selectedGuest} />
            </DialogContent>
          </Dialog>

          <Dialog open={modalType === 'crm'} onOpenChange={() => setModalType(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Guest CRM - {selectedGuest.firstName} {selectedGuest.lastName}</DialogTitle>
              </DialogHeader>
              <GuestCRMModal guest={selectedGuest} />
            </DialogContent>
          </Dialog>

          <Dialog open={modalType === 'edit'} onOpenChange={() => setModalType(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Guest - {selectedGuest.firstName} {selectedGuest.lastName}</DialogTitle>
              </DialogHeader>
              <EditGuestForm 
                guest={selectedGuest} 
                onSave={(updates) => handleEditGuest(selectedGuest.id, updates)}
                onCancel={() => setModalType(null)} 
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </motion.div>
  );
};

// Add Guest Form Component
const AddGuestForm = ({ onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: 'US',
    dateOfBirth: '',
    idNumber: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            placeholder="First name"
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            placeholder="Last name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="email@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="+1 234 567 8900"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="nationality">Nationality</Label>
          <Select value={formData.nationality} onValueChange={(value) => setFormData({...formData, nationality: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="IT">Italy</SelectItem>
              <SelectItem value="ES">Spain</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="idNumber">ID Number</Label>
          <Input
            value={formData.idNumber}
            onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
            placeholder="ID/Passport number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-gradient-primary">Add Guest</Button>
      </div>
    </form>
  );
};

// Edit Guest Form Component  
const EditGuestForm = ({ guest, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    nationality: guest.nationality,
    vipStatus: guest.vipStatus,
    loyaltyTier: guest.loyaltyTier,
    blacklisted: guest.blacklisted,
    notes: guest.notes
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="loyaltyTier">Loyalty Tier</Label>
          <Select value={formData.loyaltyTier} onValueChange={(value) => setFormData({...formData, loyaltyTier: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-4 pt-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.vipStatus}
              onChange={(e) => setFormData({...formData, vipStatus: e.target.checked})}
            />
            <span className="text-sm">VIP Status</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.blacklisted}
              onChange={(e) => setFormData({...formData, blacklisted: e.target.checked})}
            />
            <span className="text-sm">Blacklisted</span>
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-gradient-primary">Update Guest</Button>
      </div>
    </form>
  );
};

// Guest Profile Modal Component
const GuestProfileModal = ({ guest }: any) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Full Name:</label>
          <p>{guest.firstName} {guest.lastName}</p>
        </div>
        <div>
          <label className="font-medium">Email:</label>
          <p>{guest.email}</p>
        </div>
        <div>
          <label className="font-medium">Phone:</label>
          <p>{guest.phone}</p>
        </div>
        <div>
          <label className="font-medium">Nationality:</label>
          <p>{guest.nationality}</p>
        </div>
        <div>
          <label className="font-medium">Date of Birth:</label>
          <p>{format(guest.dateOfBirth, 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <label className="font-medium">ID Number:</label>
          <p>{guest.idNumber || 'Not provided'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="font-medium">Loyalty Tier:</label>
          <Badge variant="default">{guest.loyaltyTier}</Badge>
        </div>
        <div>
          <label className="font-medium">Loyalty Points:</label>
          <p>{guest.loyaltyPoints}</p>
        </div>
        <div>
          <label className="font-medium">VIP Status:</label>
          {guest.vipStatus ? (
            <Badge variant="default" className="bg-yellow-500"><Star className="h-3 w-3 mr-1" />VIP</Badge>
          ) : (
            <Badge variant="outline">Regular</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="font-medium">Total Stays:</label>
          <p>{guest.totalStays}</p>
        </div>
        <div>
          <label className="font-medium">Total Spent:</label>
          <p>€{guest.totalSpent.toLocaleString()}</p>
        </div>
        <div>
          <label className="font-medium">Last Stay:</label>
          <p>{format(guest.lastStay, 'MMM dd, yyyy')}</p>
        </div>
      </div>

      {guest.notes && (
        <div>
          <label className="font-medium">Notes:</label>
          <p className="mt-1 text-sm text-muted-foreground">{guest.notes}</p>
        </div>
      )}
    </div>
  );
};

// Guest CRM Modal Component
const GuestCRMModal = ({ guest }: any) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('loyalty');
  const [newMessage, setNewMessage] = useState('');

  // Mock data for CRM tabs
  const loyaltyData = {
    currentTier: guest.loyaltyTier,
    points: guest.loyaltyPoints,
    nextTierPoints: guest.loyaltyTier === 'Standard' ? 1000 : guest.loyaltyTier === 'Silver' ? 2500 : 5000,
    lastActivity: guest.lastStay,
    benefits: guest.loyaltyTier === 'Gold' ? ['Free WiFi', 'Late Checkout', 'Room Upgrade'] : 
              guest.loyaltyTier === 'Silver' ? ['Free WiFi', 'Late Checkout'] : ['Free WiFi']
  };

  const mockCommunications = [
    { id: 1, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), type: 'email', subject: 'Welcome Back!', status: 'sent' },
    { id: 2, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), type: 'sms', subject: 'Reservation Confirmation', status: 'delivered' },
    { id: 3, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), type: 'email', subject: 'Special Offer', status: 'opened' }
  ];

  const analytics = {
    lifetimeValue: guest.totalSpent,
    avgStayValue: guest.totalStays > 0 ? guest.totalSpent / guest.totalStays : 0,
    stayFrequency: guest.totalStays / 12, // per month estimate
    lastBookingChannel: 'Direct',
    preferredRoomType: 'Deluxe Double'
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Mock send message
    toast({ title: 'Message sent successfully', description: 'Guest will receive your message shortly' });
    setNewMessage('');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
        <TabsTrigger value="communications">Communications</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="loyalty" className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loyalty Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Current Tier:</label>
                <Badge variant="default" className="ml-2">{loyaltyData.currentTier}</Badge>
              </div>
              <div>
                <label className="font-medium">Points Balance:</label>
                <p className="text-lg font-semibold">{loyaltyData.points} pts</p>
              </div>
            </div>
            
            <div>
              <label className="font-medium">Progress to Next Tier:</label>
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2" 
                    style={{ width: `${(loyaltyData.points / loyaltyData.nextTierPoints) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {loyaltyData.nextTierPoints - loyaltyData.points} points to next tier
                </p>
              </div>
            </div>

            <div>
              <label className="font-medium">Current Benefits:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {loyaltyData.benefits.map((benefit, idx) => (
                  <Badge key={idx} variant="outline">{benefit}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="communications" className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
            />
            <Button onClick={handleSendMessage} className="bg-gradient-primary">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCommunications.map(comm => (
                <div key={comm.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{comm.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {comm.type.toUpperCase()} • {format(comm.date, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline">{comm.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics" className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-medium">Lifetime Value:</label>
                <p className="text-2xl font-bold text-green-600">€{analytics.lifetimeValue.toLocaleString()}</p>
              </div>
              <div>
                <label className="font-medium">Average Stay Value:</label>
                <p className="text-lg font-semibold">€{analytics.avgStayValue.toFixed(2)}</p>
              </div>
              <div>
                <label className="font-medium">Stay Frequency:</label>
                <p className="text-lg font-semibold">{analytics.stayFrequency.toFixed(1)} stays/month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-medium">Preferred Room Type:</label>
                <p>{analytics.preferredRoomType}</p>
              </div>
              <div>
                <label className="font-medium">Last Booking Channel:</label>
                <p>{analytics.lastBookingChannel}</p>
              </div>
              <div>
                <label className="font-medium">Guest Preferences:</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {guest.preferences.length > 0 ? guest.preferences.map((pref: string, idx: number) => (
                    <Badge key={idx} variant="outline">{pref}</Badge>
                  )) : (
                    <p className="text-sm text-muted-foreground">No preferences recorded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};