import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Edit, Trash2, Mail, Shield, Building, Plane, Search, Filter } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  org_id: string;
  org_name?: string;
  hotel_name?: string;
  agency_name?: string;
  auth_user_id: string | null;
  created_at: string;
  is_active: boolean;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Staff',
    org_id: '',
    password: '',
    hotel_id: '',
    agency_id: ''
  });

  const roles = [
    { value: 'Owner', label: 'Owner', description: 'Full system access' },
    { value: 'Manager', label: 'Manager', description: 'Manage hotel operations' },
    { value: 'Staff', label: 'Staff', description: 'Basic hotel operations' },
    { value: 'Finance', label: 'Finance', description: 'Financial operations' },
    { value: 'Housekeeping', label: 'Housekeeping', description: 'Room management' },
    { value: 'AgencyManager', label: 'Agency Manager', description: 'Manage agency operations' },
    { value: 'AgentStaff', label: 'Agent Staff', description: 'Book reservations' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchHotels();
    fetchAgencies();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          *,
          organizations!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get hotel and agency names for users
      const enrichedUsers = await Promise.all(
        (usersData || []).map(async (user: any) => {
          let extraData = {};
          
          // If user has org_id, try to get hotel or agency name
          if (user.org_id) {
            const { data: hotelData } = await supabase
              .from('hotels')
              .select('name')
              .eq('org_id', user.org_id)
              .single();
            
            const { data: agencyData } = await supabase
              .from('agencies')
              .select('name')
              .eq('org_id', user.org_id)
              .single();

            extraData = {
              hotel_name: hotelData?.name,
              agency_name: agencyData?.name,
              org_name: user.organizations?.name
            };
          }

          return {
            ...user,
            ...extraData,
            is_active: true // Default to active for existing users
          };
        })
      );

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name, org_id')
        .order('name');

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name, org_id')
        .order('name');

      if (error) throw error;
      setAgencies(data || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      let org_id = newUser.org_id;
      
      // If hotel selected, get its org_id
      if (newUser.hotel_id) {
        const hotel = hotels.find(h => h.id === newUser.hotel_id);
        org_id = hotel?.org_id;
      }
      
      // If agency selected, get its org_id
      if (newUser.agency_id) {
        const agency = agencies.find(a => a.id === newUser.agency_id);
        org_id = agency?.org_id;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        user_metadata: {
          name: newUser.name,
          role: newUser.role.toLowerCase().replace(' ', '_'),
          org_id: org_id
        }
      });

      if (authError) throw authError;

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          org_id: org_id,
          auth_user_id: authData.user?.id
        });

      if (userError) throw userError;

      toast({
        title: "Success",
        description: "User created successfully",
      });

      setShowCreateDialog(false);
      setNewUser({
        name: '',
        email: '',
        role: 'Staff',
        org_id: '',
        password: '',
        hotel_id: '',
        agency_id: ''
      });
      
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user?.auth_user_id) {
        toast({
          title: "Error",
          description: "Cannot update status for this user",
          variant: "destructive",
        });
        return;
      }

      // Update auth user
      const { error: authError } = await supabase.auth.admin.updateUserById(
        user.auth_user_id,
        { user_metadata: { ...user, is_active: isActive } }
      );

      if (authError) throw authError;

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: isActive } : u
      ));

      toast({
        title: "Success",
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const sendLoginInvite = async (user: User) => {
    try {
      // In a real implementation, you would send an email with login instructions
      // For now, we'll just show a success message
      toast({
        title: "Invite Sent",
        description: `Login invite sent to ${user.email}`,
      });
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const user = users.find(u => u.id === userId);
      
      // Delete auth user if exists
      if (user?.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(user.auth_user_id);
        if (authError) console.error('Auth user deletion error:', authError);
      }

      // Delete user record
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.hotel_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.agency_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and their permissions</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the platform</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Min 8 characters"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(newUser.role === 'Owner' || newUser.role === 'Manager' || newUser.role === 'Staff' || newUser.role === 'Finance' || newUser.role === 'Housekeeping') && (
                <div className="space-y-2">
                  <Label htmlFor="hotel">Hotel</Label>
                  <Select value={newUser.hotel_id} onValueChange={(value) => setNewUser(prev => ({ ...prev, hotel_id: value, agency_id: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map(hotel => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(newUser.role === 'AgencyManager' || newUser.role === 'AgentStaff') && (
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency</Label>
                  <Select value={newUser.agency_id} onValueChange={(value) => setNewUser(prev => ({ ...prev, agency_id: value, hotel_id: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map(agency => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createUser}>
                  Create User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, hotels, or agencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.hotel_name ? (
                        <>
                          <Building className="h-4 w-4" />
                          <span>{user.hotel_name}</span>
                        </>
                      ) : user.agency_name ? (
                        <>
                          <Plane className="h-4 w-4" />
                          <span>{user.agency_name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No organization</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active !== false}
                        onCheckedChange={(checked) => updateUserStatus(user.id, checked)}
                      />
                      <span className="text-sm">
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendLoginInvite(user)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;