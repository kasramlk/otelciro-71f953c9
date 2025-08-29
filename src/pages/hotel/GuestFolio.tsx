import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  CreditCard, 
  Receipt, 
  Plus, 
  Printer, 
  Mail, 
  Search,
  DollarSign,
  Calendar,
  Clock,
  Phone,
  MapPin
} from "lucide-react";

export default function GuestFolio() {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock guest data
  const guests = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1 (555) 123-4567",
      room: "204",
      checkIn: "2024-01-15",
      checkOut: "2024-01-18",
      status: "Checked In",
      balance: 1240.50,
      charges: [
        { id: 1, date: "2024-01-15", description: "Room Charge - Night 1", amount: 320.00, type: "room" },
        { id: 2, date: "2024-01-15", description: "City Tax", amount: 15.00, type: "tax" },
        { id: 3, date: "2024-01-16", description: "Room Service - Dinner", amount: 85.50, type: "service" },
        { id: 4, date: "2024-01-16", description: "Minibar", amount: 25.00, type: "service" },
        { id: 5, date: "2024-01-17", description: "Spa Treatment", amount: 150.00, type: "service" }
      ],
      payments: [
        { id: 1, date: "2024-01-15", description: "Credit Card Authorization", amount: -500.00, type: "authorization" }
      ]
    },
    {
      id: 2,
      name: "Sarah Johnson", 
      email: "sarah.j@email.com",
      phone: "+1 (555) 987-6543",
      room: "312",
      checkIn: "2024-01-14",
      checkOut: "2024-01-17",
      status: "Checked Out",
      balance: 0.00,
      charges: [
        { id: 1, date: "2024-01-14", description: "Room Charge - Premium Suite", amount: 450.00, type: "room" },
        { id: 2, date: "2024-01-14", description: "Parking", amount: 25.00, type: "service" }
      ],
      payments: [
        { id: 1, date: "2024-01-17", description: "Credit Card Payment", amount: -475.00, type: "payment" }
      ]
    }
  ];

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.room.includes(searchTerm) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChargeTypeColor = (type) => {
    switch (type) {
      case 'room': return 'text-blue-600 bg-blue-100';
      case 'service': return 'text-green-600 bg-green-100';
      case 'tax': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'payment': return 'text-green-600 bg-green-100';
      case 'authorization': return 'text-blue-600 bg-blue-100';
      case 'refund': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guest Folio Management</h1>
          <p className="text-muted-foreground">
            Manage guest billing, charges, and payment history
          </p>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Charge
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, room, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Guest List */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Active Guests ({filteredGuests.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedGuest?.id === guest.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => setSelectedGuest(guest)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{guest.name}</h4>
                      <Badge 
                        variant={guest.status === 'Checked In' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {guest.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Room {guest.room}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        Balance: ${guest.balance.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {guest.checkIn} - {guest.checkOut}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Folio Details */}
        <div className="lg:col-span-2">
          {selectedGuest ? (
            <div className="space-y-6">
              {/* Guest Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedGuest.name} - Room {selectedGuest.room}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print Folio
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Email Folio
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact Information</label>
                        <div className="mt-1 space-y-1">
                          <p className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            {selectedGuest.email}
                          </p>
                          <p className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {selectedGuest.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Stay Information</label>
                        <div className="mt-1 space-y-1">
                          <p className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            Check-in: {selectedGuest.checkIn}
                          </p>
                          <p className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            Check-out: {selectedGuest.checkOut}
                          </p>
                          <Badge 
                            variant={selectedGuest.status === 'Checked In' ? 'default' : 'secondary'}
                            className="mt-2"
                          >
                            {selectedGuest.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Folio Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Folio Details
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-bold">
                        ${selectedGuest.balance.toFixed(2)}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="charges" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="charges">Charges</TabsTrigger>
                      <TabsTrigger value="payments">Payments</TabsTrigger>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="charges" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Room Charges & Services</h4>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Charge
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedGuest.charges.map((charge) => (
                          <div key={charge.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getChargeTypeColor(charge.type)}`}>
                                  {charge.type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {charge.date}
                                </span>
                              </div>
                              <p className="font-medium mt-1">{charge.description}</p>
                            </div>
                            <p className="text-lg font-semibold">
                              +${charge.amount.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="payments" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Payments & Credits</h4>
                        <Button size="sm" className="gap-2">
                          <CreditCard className="h-4 w-4" />
                          Record Payment
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedGuest.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getPaymentTypeColor(payment.type)}`}>
                                  {payment.type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {payment.date}
                                </span>
                              </div>
                              <p className="font-medium mt-1">{payment.description}</p>
                            </div>
                            <p className="text-lg font-semibold text-green-600">
                              ${Math.abs(payment.amount).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3">Billing Summary</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Charges:</span>
                            <span className="font-medium">
                              ${selectedGuest.charges.reduce((sum, charge) => sum + charge.amount, 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Payments:</span>
                            <span className="font-medium">
                              ${Math.abs(selectedGuest.payments.reduce((sum, payment) => sum + payment.amount, 0)).toFixed(2)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Current Balance:</span>
                            <span>${selectedGuest.balance.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a guest to view their folio</p>
                  <p className="text-sm">Choose from the guest list to see detailed billing information</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}