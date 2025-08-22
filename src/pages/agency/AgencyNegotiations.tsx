import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  MessageCircle, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Building2,
  Calendar,
  DollarSign,
  Send,
  Filter
} from "lucide-react";

interface NegotiationRequest {
  id?: string;
  hotel_name: string;
  check_in: string;
  check_out: string;
  rooms: number;
  guests: number;
  budget_range: string;
  special_requirements: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
}

const AgencyNegotiations = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [newRequest, setNewRequest] = useState<NegotiationRequest>({
    hotel_name: "",
    check_in: "",
    check_out: "",
    rooms: 1,
    guests: 2,
    budget_range: "",
    special_requirements: "",
    status: 'pending',
    priority: 'medium'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for negotiations - in production this would come from Supabase
  const mockNegotiations = [
    {
      id: "1",
      hotel_name: "Grand Hyatt Istanbul",
      check_in: "2024-03-15",
      check_out: "2024-03-18",
      rooms: 10,
      guests: 20,
      budget_range: "$200-250/night",
      special_requirements: "Group booking, conference room access",
      status: 'in_progress' as const,
      priority: 'high' as const,
      created_at: "2024-01-15T10:00:00Z",
      messages: [
        { id: "1", from: "agency", message: "Hello, we need 10 rooms for corporate event", timestamp: "2024-01-15T10:00:00Z" },
        { id: "2", from: "hotel", message: "Thank you for your inquiry. We can offer special corporate rates.", timestamp: "2024-01-15T14:30:00Z" }
      ]
    },
    {
      id: "2", 
      hotel_name: "Four Seasons Bosphorus",
      check_in: "2024-04-10",
      check_out: "2024-04-15",
      rooms: 5,
      guests: 10,
      budget_range: "$300-400/night",
      special_requirements: "Sea view rooms, late checkout",
      status: 'pending' as const,
      priority: 'medium' as const,
      created_at: "2024-01-20T15:00:00Z",
      messages: []
    }
  ];

  const { data: negotiations = mockNegotiations, isLoading } = useQuery({
    queryKey: ['agency-negotiations', statusFilter],
    queryFn: async () => {
      // In production, this would fetch from booking_holds or a negotiations table
      return mockNegotiations.filter(n => statusFilter === 'all' || n.status === statusFilter);
    }
  });

  const createNegotiationMutation = useMutation({
    mutationFn: async (request: NegotiationRequest) => {
      // In production, this would create in Supabase
      const { data, error } = await supabase
        .from('booking_holds')
        .insert({
          hotel_id: '550e8400-e29b-41d4-a716-446655440000', // Mock hotel ID
          room_type_id: '550e8400-e29b-41d4-a716-446655440001', // Mock room type
          agency_id: '550e8400-e29b-41d4-a716-446655440002', // Mock agency ID
          check_in: request.check_in,
          check_out: request.check_out,
          adults: request.guests,
          children: 0,
          guest_name: 'Negotiation Request',
          special_requests: request.special_requirements,
          rate_quoted: parseFloat(request.budget_range.split('-')[0].replace('$', '')) || 0,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Negotiation request created successfully"
      });
      setIsNewRequestOpen(false);
      setNewRequest({
        hotel_name: "",
        check_in: "",
        check_out: "",
        rooms: 1,
        guests: 2,
        budget_range: "",
        special_requirements: "",
        status: 'pending',
        priority: 'medium'
      });
      queryClient.invalidateQueries({ queryKey: ['agency-negotiations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create negotiation request",
        variant: "destructive"
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateRequest = () => {
    createNegotiationMutation.mutate(newRequest);
  };

  const stats = [
    { title: "Active Negotiations", value: negotiations.filter(n => n.status === 'in_progress').length, icon: MessageCircle, color: "text-blue-600" },
    { title: "Pending Requests", value: negotiations.filter(n => n.status === 'pending').length, icon: Clock, color: "text-yellow-600" },
    { title: "Completed", value: negotiations.filter(n => ['completed', 'rejected'].includes(n.status)).length, icon: CheckCircle, color: "text-green-600" },
    { title: "Success Rate", value: "78%", icon: DollarSign, color: "text-primary" }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Negotiations</h1>
          <p className="text-muted-foreground">Manage rate negotiations and contract discussions</p>
        </div>
        
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Negotiation Request</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hotel Name</label>
                <Input
                  placeholder="Enter hotel name"
                  value={newRequest.hotel_name}
                  onChange={(e) => setNewRequest({...newRequest, hotel_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={newRequest.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => setNewRequest({...newRequest, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-in Date</label>
                <Input
                  type="date"
                  value={newRequest.check_in}
                  onChange={(e) => setNewRequest({...newRequest, check_in: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-out Date</label>
                <Input
                  type="date"
                  value={newRequest.check_out}
                  onChange={(e) => setNewRequest({...newRequest, check_out: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Rooms</label>
                <Input
                  type="number"
                  min="1"
                  value={newRequest.rooms}
                  onChange={(e) => setNewRequest({...newRequest, rooms: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Guests</label>
                <Input
                  type="number"
                  min="1"
                  value={newRequest.guests}
                  onChange={(e) => setNewRequest({...newRequest, guests: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Budget Range</label>
                <Input
                  placeholder="e.g., $200-250/night"
                  value={newRequest.budget_range}
                  onChange={(e) => setNewRequest({...newRequest, budget_range: e.target.value})}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Special Requirements</label>
                <Textarea
                  placeholder="Group booking, conference facilities, etc."
                  value={newRequest.special_requirements}
                  onChange={(e) => setNewRequest({...newRequest, special_requirements: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRequest} disabled={createNegotiationMutation.isPending}>
                {createNegotiationMutation.isPending ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Negotiations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Negotiation Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Rooms/Guests</TableHead>
                  <TableHead>Budget Range</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : negotiations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <MessageCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No negotiations found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  negotiations.map((negotiation) => (
                    <TableRow key={negotiation.id}>
                      <TableCell>
                        <div className="font-medium">{negotiation.hotel_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Premium Property
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(negotiation.check_in).toLocaleDateString()} - 
                          {new Date(negotiation.check_out).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {Math.ceil((new Date(negotiation.check_out).getTime() - new Date(negotiation.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{negotiation.rooms} rooms</div>
                        <div className="text-sm text-muted-foreground">{negotiation.guests} guests</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {negotiation.budget_range}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(negotiation.priority)}>
                          {negotiation.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(negotiation.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(negotiation.status)}
                            {negotiation.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(negotiation.created_at!).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="gap-1">
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyNegotiations;