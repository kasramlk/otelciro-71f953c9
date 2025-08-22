import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Eye,
  Send,
  Calendar,
  Bell,
  UserCheck,
  UserX,
  Shield,
  Settings,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer' | 'approver';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  permissions: string[];
  postsCreated: number;
  postsApproved: number;
}

interface ApprovalRequest {
  id: string;
  contentId: string;
  title: string;
  platform: string;
  createdBy: TeamMember;
  status: 'pending' | 'approved' | 'rejected';
  scheduledFor: string;
  content: string;
  comments: {
    id: string;
    author: TeamMember;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
}

interface Activity {
  id: string;
  type: 'post_created' | 'post_approved' | 'post_rejected' | 'member_added' | 'comment_added';
  user: TeamMember;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@hotel.com',
    avatar: '/api/placeholder/32/32',
    role: 'admin',
    status: 'active',
    lastActive: '2024-01-16T10:30:00Z',
    permissions: ['create', 'edit', 'approve', 'publish', 'manage_team'],
    postsCreated: 45,
    postsApproved: 120
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@hotel.com',
    avatar: '/api/placeholder/32/32',
    role: 'editor',
    status: 'active',
    lastActive: '2024-01-16T09:15:00Z',
    permissions: ['create', 'edit', 'schedule'],
    postsCreated: 28,
    postsApproved: 0
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@hotel.com',
    role: 'approver',
    status: 'active',
    lastActive: '2024-01-16T08:45:00Z',
    permissions: ['approve', 'reject', 'comment'],
    postsCreated: 8,
    postsApproved: 85
  },
  {
    id: '4',
    name: 'David Park',
    email: 'david@hotel.com',
    role: 'viewer',
    status: 'inactive',
    lastActive: '2024-01-15T16:20:00Z',
    permissions: ['view'],
    postsCreated: 0,
    postsApproved: 0
  }
];

const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: '1',
    contentId: 'post-1',
    title: 'Weekend Special Promotion',
    platform: 'instagram',
    createdBy: mockTeamMembers[1],
    status: 'pending',
    scheduledFor: '2024-01-17T18:00:00Z',
    content: 'Join us this weekend for an exclusive 20% off all luxury suites! Book now and experience unparalleled comfort. #LuxuryHotel #WeekendSpecial',
    comments: [
      {
        id: '1',
        author: mockTeamMembers[2],
        message: 'Great content! Consider adding our spa package mention.',
        timestamp: '2024-01-16T09:30:00Z'
      }
    ],
    createdAt: '2024-01-16T08:00:00Z'
  },
  {
    id: '2',
    contentId: 'post-2',
    title: 'Chef\'s Special Menu',
    platform: 'facebook',
    createdBy: mockTeamMembers[1],
    status: 'approved',
    scheduledFor: '2024-01-16T19:00:00Z',
    content: 'Tonight our chef presents a special tasting menu featuring local ingredients and seasonal flavors.',
    comments: [],
    createdAt: '2024-01-16T07:30:00Z'
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'post_approved',
    user: mockTeamMembers[2],
    description: 'approved "Chef\'s Special Menu" for Facebook',
    timestamp: '2024-01-16T10:15:00Z'
  },
  {
    id: '2',
    type: 'comment_added',
    user: mockTeamMembers[2],
    description: 'commented on "Weekend Special Promotion"',
    timestamp: '2024-01-16T09:30:00Z'
  },
  {
    id: '3',
    type: 'post_created',
    user: mockTeamMembers[1],
    description: 'created new post "Weekend Special Promotion"',
    timestamp: '2024-01-16T08:00:00Z'
  }
];

export const TeamCollaboration: React.FC = () => {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(mockApprovalRequests);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [newComment, setNewComment] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer' | 'approver'>('editor');

  const handleApprove = (requestId: string) => {
    setApprovalRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'approved' as const } : req
    ));
    
    toast({
      title: "Post Approved",
      description: "The post has been approved and will be published as scheduled",
    });
  };

  const handleReject = (requestId: string) => {
    setApprovalRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
    ));
    
    toast({
      title: "Post Rejected",
      description: "The post has been rejected and will not be published",
      variant: "destructive"
    });
  };

  const handleAddComment = (requestId: string) => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: Date.now().toString(),
      author: mockTeamMembers[0], // Current user
      message: newComment,
      timestamp: new Date().toISOString()
    };
    
    setApprovalRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, comments: [...req.comments, newCommentObj] }
        : req
    ));
    
    setNewComment('');
    toast({
      title: "Comment Added",
      description: "Your comment has been added to the approval request",
    });
  };

  const handleInviteTeamMember = () => {
    if (!inviteEmail.trim()) return;
    
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      lastActive: new Date().toISOString(),
      permissions: getRolePermissions(inviteRole),
      postsCreated: 0,
      postsApproved: 0
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    
    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${inviteEmail}`,
    });
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return ['create', 'edit', 'approve', 'publish', 'manage_team'];
      case 'editor':
        return ['create', 'edit', 'schedule'];
      case 'approver':
        return ['approve', 'reject', 'comment'];
      case 'viewer':
        return ['view'];
      default:
        return ['view'];
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'approver':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post_created':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'post_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'post_rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'member_added':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const pendingRequests = approvalRequests.filter(req => req.status === 'pending');
  const activeMembers = teamMembers.filter(member => member.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
          <p className="text-muted-foreground">
            Manage team members, approval workflows, and collaborative content creation
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite Team Member
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{activeMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posts This Month</p>
                <p className="text-2xl font-bold">42</p>
              </div>
              <Edit className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approval Requests */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approvals ({pendingRequests.length})
              </CardTitle>
              <CardDescription>
                Content waiting for review and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending approval requests at the moment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{request.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                              {request.platform}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              by {request.createdBy.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          <span className="text-sm capitalize">{request.status}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {request.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>Scheduled for: {new Date(request.scheduledFor).toLocaleString()}</span>
                        <span>{request.comments.length} comments</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(request.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          className="flex-1"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Members & Activity */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="approver">Approver</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInviteTeamMember} className="w-full" size="sm">
                  <Send className="h-3 w-3 mr-1" />
                  Send Invite
                </Button>
              </div>
              
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(member.role)} variant="secondary">
                            {member.role}
                          </Badge>
                          <div className={`h-2 w-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.description}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};