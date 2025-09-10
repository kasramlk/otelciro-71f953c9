import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Mail, Shield, MoreVertical, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAgencyAuth } from "@/hooks/use-agency-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roleColors = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  agent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export const AgencyUserManagement = () => {
  const { currentAgency, hasRole, inviteUser } = useAgencyAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch agency users
  const { data: agencyUsers = [], refetch } = useQuery({
    queryKey: ['agency-users', currentAgency?.id],
    queryFn: async () => {
      if (!currentAgency) return [];
      
      const { data, error } = await supabase
        .from('agency_users')
        .select(`
          *
        `)
        .eq('agency_id', currentAgency.id)
        .order('role', { ascending: true });

      if (error) throw error;
      
      // Get user profiles separately to avoid foreign key issues
      const userIds = data.map(au => au.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      // Combine the data
      return data.map(user => ({
        ...user,
        profile: profiles?.find(p => p.id === user.user_id) || null
      }));
    },
    enabled: !!currentAgency,
  });

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) return;

    setIsLoading(true);
    try {
      await inviteUser(inviteEmail, inviteRole);
      toast.success("Invitation sent successfully!");
      setInviteEmail("");
      setInviteRole("agent");
      setIsInviteOpen(false);
      refetch();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('agency_users')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .eq('agency_id', currentAgency?.id);

      if (error) throw error;
      
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error("Failed to update user status");
    }
  };

  if (!currentAgency) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No agency selected</p>
        </CardContent>
      </Card>
    );
  }

  const canManageUsers = hasRole('admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">Manage your agency team members and their roles</p>
        </div>
        
        {canManageUsers && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      {hasRole('owner') && <SelectItem value="admin">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleInviteUser} 
                  disabled={isLoading || !inviteEmail}
                  className="w-full"
                >
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({agencyUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agencyUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {user.profile?.display_name || user.profile?.first_name || 'Unknown User'}
                    </h3>
                      <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                        {user.role}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>
                        {user.joined_at ? `Joined ${new Date(user.joined_at).toLocaleDateString()}` : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>

                {canManageUsers && user.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.is_active ? (
                        <DropdownMenuItem 
                          onClick={() => handleUpdateUserStatus(user.user_id, false)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleUpdateUserStatus(user.user_id, true)}
                          className="text-green-600"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            ))}

            {agencyUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your team by inviting colleagues to join your agency.
                </p>
                {canManageUsers && (
                  <Button onClick={() => setIsInviteOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite First Team Member
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};