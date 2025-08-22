import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Workflow, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Edit,
  Eye,
  Send,
  Calendar,
  GitBranch,
  Users,
  MessageSquare,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'create' | 'review' | 'approve' | 'schedule' | 'publish';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo?: string;
  completedBy?: string;
  completedAt?: string;
  duration?: number; // in minutes
  requirements?: string[];
}

interface ContentWorkflow {
  id: string;
  name: string;
  description: string;
  contentId: string;
  contentTitle: string;
  platform: string;
  currentStep: number;
  steps: WorkflowStep[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  metrics: {
    totalSteps: number;
    completedSteps: number;
    avgStepTime: number;
    estimatedCompletion: string;
  };
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'completedBy' | 'completedAt'>[];
  category: 'standard' | 'express' | 'detailed' | 'campaign';
  estimatedTime: number; // in hours
  usageCount: number;
}

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Review Process',
    description: 'Basic content review and approval workflow',
    category: 'standard',
    estimatedTime: 2,
    usageCount: 45,
    steps: [
      { name: 'Content Creation', type: 'create', assignedTo: 'editor', duration: 30 },
      { name: 'Peer Review', type: 'review', assignedTo: 'peer', duration: 15 },
      { name: 'Manager Approval', type: 'approve', assignedTo: 'manager', duration: 10 },
      { name: 'Schedule Post', type: 'schedule', assignedTo: 'scheduler', duration: 5 },
      { name: 'Publish Content', type: 'publish', assignedTo: 'system', duration: 1 }
    ]
  },
  {
    id: 'express',
    name: 'Express Publishing',
    description: 'Fast-track workflow for urgent content',
    category: 'express',
    estimatedTime: 0.5,
    usageCount: 23,
    steps: [
      { name: 'Content Creation', type: 'create', assignedTo: 'editor', duration: 15 },
      { name: 'Quick Approval', type: 'approve', assignedTo: 'manager', duration: 5 },
      { name: 'Immediate Publish', type: 'publish', assignedTo: 'system', duration: 1 }
    ]
  },
  {
    id: 'campaign',
    name: 'Campaign Content',
    description: 'Comprehensive workflow for campaign content',
    category: 'campaign',
    estimatedTime: 4,
    usageCount: 12,
    steps: [
      { name: 'Content Creation', type: 'create', assignedTo: 'creator', duration: 60 },
      { name: 'Brand Review', type: 'review', assignedTo: 'brand_manager', duration: 30 },
      { name: 'Legal Review', type: 'review', assignedTo: 'legal', duration: 45 },
      { name: 'Final Approval', type: 'approve', assignedTo: 'director', duration: 20 },
      { name: 'Schedule Campaign', type: 'schedule', assignedTo: 'campaign_manager', duration: 15 },
      { name: 'Publish Content', type: 'publish', assignedTo: 'system', duration: 1 }
    ]
  }
];

const mockWorkflows: ContentWorkflow[] = [
  {
    id: '1',
    name: 'Weekend Special Promotion',
    description: 'Instagram post for weekend luxury suite promotion',
    contentId: 'post-1',
    contentTitle: 'Weekend Special - 20% Off Luxury Suites',
    platform: 'instagram',
    currentStep: 2,
    status: 'active',
    priority: 'high',
    tags: ['promotion', 'weekend', 'luxury'],
    createdAt: '2024-01-16T08:00:00Z',
    dueDate: '2024-01-17T18:00:00Z',
    steps: [
      {
        id: '1',
        name: 'Content Creation',
        type: 'create',
        status: 'completed',
        assignedTo: 'Mike Chen',
        completedBy: 'Mike Chen',
        completedAt: '2024-01-16T08:30:00Z',
        duration: 30
      },
      {
        id: '2',
        name: 'Peer Review',
        type: 'review',
        status: 'in_progress',
        assignedTo: 'Emma Wilson',
        duration: 15
      },
      {
        id: '3',
        name: 'Manager Approval',
        type: 'approve',
        status: 'pending',
        assignedTo: 'Sarah Johnson',
        duration: 10
      },
      {
        id: '4',
        name: 'Schedule Post',
        type: 'schedule',
        status: 'pending',
        assignedTo: 'System',
        duration: 5
      },
      {
        id: '5',
        name: 'Publish Content',
        type: 'publish',
        status: 'pending',
        assignedTo: 'System',
        duration: 1
      }
    ],
    metrics: {
      totalSteps: 5,
      completedSteps: 1,
      avgStepTime: 22,
      estimatedCompletion: '2024-01-16T12:00:00Z'
    }
  },
  {
    id: '2',
    name: 'Chef\'s Special Menu',
    description: 'Facebook post showcasing tonight\'s special menu',
    contentId: 'post-2',
    contentTitle: 'Tonight\'s Chef Special Tasting Menu',
    platform: 'facebook',
    currentStep: 4,
    status: 'active',
    priority: 'medium',
    tags: ['food', 'chef', 'special'],
    createdAt: '2024-01-16T07:30:00Z',
    steps: [
      {
        id: '1',
        name: 'Content Creation',
        type: 'create',
        status: 'completed',
        assignedTo: 'Mike Chen',
        completedBy: 'Mike Chen',
        completedAt: '2024-01-16T08:00:00Z',
        duration: 25
      },
      {
        id: '2',
        name: 'Peer Review',
        type: 'review',
        status: 'completed',
        assignedTo: 'Emma Wilson',
        completedBy: 'Emma Wilson',
        completedAt: '2024-01-16T08:15:00Z',
        duration: 10
      },
      {
        id: '3',
        name: 'Manager Approval',
        type: 'approve',
        status: 'completed',
        assignedTo: 'Sarah Johnson',
        completedBy: 'Sarah Johnson',
        completedAt: '2024-01-16T08:30:00Z',
        duration: 8
      },
      {        id: '4',
        name: 'Schedule Post',
        type: 'schedule',
        status: 'in_progress',
        assignedTo: 'System',
        duration: 5
      }
    ],
    metrics: {
      totalSteps: 4,
      completedSteps: 3,
      avgStepTime: 14,
      estimatedCompletion: '2024-01-16T19:00:00Z'
    }
  }
];

export const ContentWorkflow: React.FC = () => {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<ContentWorkflow[]>(mockWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ContentWorkflow | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const getStepIcon = (type: string, status: string) => {
    const iconClass = status === 'completed' ? 'text-green-500' : 
                     status === 'in_progress' ? 'text-blue-500' : 'text-gray-400';
    
    switch (type) {
      case 'create':
        return <Edit className={`h-4 w-4 ${iconClass}`} />;
      case 'review':
        return <Eye className={`h-4 w-4 ${iconClass}`} />;
      case 'approve':
        return <CheckCircle className={`h-4 w-4 ${iconClass}`} />;
      case 'schedule':
        return <Calendar className={`h-4 w-4 ${iconClass}`} />;
      case 'publish':
        return <Send className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <Clock className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (workflow: ContentWorkflow) => {
    return (workflow.metrics.completedSteps / workflow.metrics.totalSteps) * 100;
  };

  const handleCompleteStep = (workflowId: string, stepId: string) => {
    setWorkflows(prev => prev.map(workflow => {
      if (workflow.id === workflowId) {
        const updatedSteps = workflow.steps.map(step => {
          if (step.id === stepId && step.status === 'in_progress') {
            return {
              ...step,
              status: 'completed' as const,
              completedBy: 'Current User',
              completedAt: new Date().toISOString()
            };
          }
          return step;
        });
        
        // Update metrics
        const completedSteps = updatedSteps.filter(s => s.status === 'completed').length;
        const nextStepIndex = updatedSteps.findIndex(s => s.status === 'pending');
        
        // Auto-start next step if available
        if (nextStepIndex !== -1) {
          updatedSteps[nextStepIndex].status = 'in_progress';
        }
        
        return {
          ...workflow,
          steps: updatedSteps,
          currentStep: nextStepIndex !== -1 ? nextStepIndex : workflow.steps.length,
          status: completedSteps === workflow.steps.length ? 'completed' as const : workflow.status,
          metrics: {
            ...workflow.metrics,
            completedSteps
          }
        };
      }
      return workflow;
    }));
    
    toast({
      title: "Step Completed",
      description: "Workflow step has been marked as completed",
    });
  };

  const handlePauseWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, status: workflow.status === 'paused' ? 'active' : 'paused' }
        : workflow
    ));
  };

  const activeWorkflows = workflows.filter(w => w.status === 'active');
  const completedWorkflows = workflows.filter(w => w.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Workflows</h1>
          <p className="text-muted-foreground">
            Manage content creation and approval workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <GitBranch className="h-4 w-4 mr-2" />
            Create Template
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Start New Workflow
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{activeWorkflows.length}</p>
              </div>
              <Workflow className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">{completedWorkflows.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Completion</p>
                <p className="text-2xl font-bold">2.4h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <ArrowRight className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Workflows */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Active Workflows ({activeWorkflows.length})
              </CardTitle>
              <CardDescription>
                Currently running content workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AnimatePresence>
                  {activeWorkflows.map((workflow, index) => (
                    <motion.div
                      key={workflow.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{workflow.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="capitalize">
                              {workflow.platform}
                            </Badge>
                            <Badge className={getPriorityColor(workflow.priority)}>
                              {workflow.priority}
                            </Badge>
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePauseWorkflow(workflow.id)}
                          >
                            {workflow.status === 'paused' ? (
                              <Play className="h-3 w-3" />
                            ) : (
                              <Pause className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{workflow.metrics.completedSteps}/{workflow.metrics.totalSteps} steps</span>
                        </div>
                        <Progress value={calculateProgress(workflow)} className="h-2" />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {workflow.steps.slice(0, 5).map((step, stepIndex) => (
                              <div
                                key={step.id}
                                className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium ${
                                  step.status === 'completed' ? 'bg-green-500 text-white' :
                                  step.status === 'in_progress' ? 'bg-blue-500 text-white' :
                                  'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {stepIndex + 1}
                              </div>
                            ))}
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            ETA: {new Date(workflow.metrics.estimatedCompletion).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Templates */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Workflow Templates
              </CardTitle>
              <CardDescription>
                Pre-configured workflow templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflowTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{template.steps.length} steps</span>
                      <span>~{template.estimatedTime}h</span>
                      <span>{template.usageCount} uses</span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">MC</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">Mike Chen</span>
                  </div>
                  <Badge variant="outline">3 active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">EW</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">Emma Wilson</span>
                  </div>
                  <Badge variant="outline">2 active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">SJ</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">Sarah Johnson</span>
                  </div>
                  <Badge variant="outline">1 active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};