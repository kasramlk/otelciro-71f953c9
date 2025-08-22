import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, AlertTriangle, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'performance' | 'functionality' | 'configuration' | 'documentation';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  required: boolean;
  link?: string;
  action?: () => void;
}

const DeploymentChecklist = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const { toast } = useToast();

  const checklistItems: ChecklistItem[] = [
    // Security
    {
      id: 'rls-policies',
      title: 'Row Level Security Policies',
      description: 'Verify all database tables have proper RLS policies configured',
      category: 'security',
      priority: 'high',
      completed: false,
      required: true,
      link: '/admin/security'
    },
    {
      id: 'api-keys',
      title: 'API Keys & Secrets',
      description: 'Ensure all API keys are properly configured and not exposed',
      category: 'security',
      priority: 'high',
      completed: false,
      required: true
    },
    {
      id: 'auth-flows',
      title: 'Authentication Flows',
      description: 'Test all authentication scenarios (login, signup, reset)',
      category: 'security',
      priority: 'high',
      completed: false,
      required: true,
      link: '/auth'
    },
    {
      id: 'cors-config',
      title: 'CORS Configuration',
      description: 'Configure proper CORS settings for production domains',
      category: 'security',
      priority: 'medium',
      completed: false,
      required: true
    },

    // Performance
    {
      id: 'load-testing',
      title: 'Load Testing',
      description: 'Perform load testing with expected user volumes',
      category: 'performance',
      priority: 'high',
      completed: false,
      required: true,
      action: () => window.open('/reports?tab=performance', '_blank')
    },
    {
      id: 'image-optimization',
      title: 'Image Optimization',
      description: 'Ensure all images are properly optimized and compressed',
      category: 'performance',
      priority: 'medium',
      completed: false,
      required: true
    },
    {
      id: 'bundle-size',
      title: 'Bundle Size Analysis',
      description: 'Analyze and optimize JavaScript bundle sizes',
      category: 'performance',
      priority: 'medium',
      completed: false,
      required: false
    },
    {
      id: 'caching-strategy',
      title: 'Caching Strategy',
      description: 'Configure appropriate caching headers and strategies',
      category: 'performance',
      priority: 'medium',
      completed: false,
      required: true
    },

    // Functionality
    {
      id: 'reservation-flow',
      title: 'Reservation Flow Testing',
      description: 'Test complete reservation creation and management flow',
      category: 'functionality',
      priority: 'high',
      completed: false,
      required: true,
      link: '/reservations'
    },
    {
      id: 'payment-processing',
      title: 'Payment Processing',
      description: 'Test payment flows with sandbox/test data',
      category: 'functionality',
      priority: 'high',
      completed: false,
      required: true,
      link: '/cashier'
    },
    {
      id: 'report-generation',
      title: 'Report Generation',
      description: 'Verify all reports generate correctly with real data',
      category: 'functionality',
      priority: 'medium',
      completed: false,
      required: true,
      link: '/reports'
    },
    {
      id: 'user-roles',
      title: 'User Role Permissions',
      description: 'Test all user roles and permission restrictions',
      category: 'functionality',
      priority: 'high',
      completed: false,
      required: true,
      link: '/admin/users'
    },

    // Configuration
    {
      id: 'env-variables',
      title: 'Environment Variables',
      description: 'Verify all production environment variables are set',
      category: 'configuration',
      priority: 'high',
      completed: false,
      required: true
    },
    {
      id: 'domain-config',
      title: 'Domain Configuration',
      description: 'Configure custom domain and SSL certificates',
      category: 'configuration',
      priority: 'high',
      completed: false,
      required: true
    },
    {
      id: 'error-monitoring',
      title: 'Error Monitoring',
      description: 'Set up error tracking and monitoring services',
      category: 'configuration',
      priority: 'medium',
      completed: false,
      required: true
    },
    {
      id: 'backup-strategy',
      title: 'Backup Strategy',
      description: 'Configure automated database backups',
      category: 'configuration',
      priority: 'high',
      completed: false,
      required: true
    },

    // Documentation
    {
      id: 'api-docs',
      title: 'API Documentation',
      description: 'Complete API documentation for integrations',
      category: 'documentation',
      priority: 'medium',
      completed: false,
      required: false
    },
    {
      id: 'user-guide',
      title: 'User Guide',
      description: 'Create comprehensive user guide and help documentation',
      category: 'documentation',
      priority: 'low',
      completed: false,
      required: false
    },
    {
      id: 'admin-guide',
      title: 'Admin Guide',
      description: 'Document admin processes and configurations',
      category: 'documentation',
      priority: 'medium',
      completed: false,
      required: false
    }
  ];

  useEffect(() => {
    setItems(checklistItems);
  }, []);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, completed: !item.completed }
        : item
    ));

    const item = items.find(i => i.id === id);
    if (item) {
      toast({
        title: item.completed ? "Item unchecked" : "Item completed",
        description: item.title
      });
    }
  };

  const handleItemAction = (item: ChecklistItem) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      window.open(item.link, '_blank');
    }
  };

  const exportChecklist = () => {
    const checklistData = {
      exportDate: new Date().toISOString(),
      totalItems: items.length,
      completedItems: items.filter(i => i.completed).length,
      requiredItems: items.filter(i => i.required).length,
      items: items.map(item => ({
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        completed: item.completed,
        required: item.required
      }))
    };

    const blob = new Blob([JSON.stringify(checklistData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-checklist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Checklist exported",
      description: "Deployment checklist has been downloaded"
    });
  };

  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const totalItems = items.length;
  const completedItems = items.filter(i => i.completed).length;
  const requiredItems = items.filter(i => i.required).length;
  const completedRequired = items.filter(i => i.required && i.completed).length;

  const progress = (completedItems / totalItems) * 100;
  const requiredProgress = (completedRequired / requiredItems) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return '🔒';
      case 'performance': return '⚡';
      case 'functionality': return '⚙️';
      case 'configuration': return '🔧';
      case 'documentation': return '📚';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Deployment Checklist</h2>
          <p className="text-muted-foreground">Pre-production deployment verification</p>
        </div>
        <Button onClick={exportChecklist} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Checklist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{completedItems} of {totalItems} completed</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Required Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{completedRequired} of {requiredItems} completed</span>
                <span>{Math.round(requiredProgress)}%</span>
              </div>
              <Progress value={requiredProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deployment Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {requiredProgress === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <span className="font-medium">
                {requiredProgress === 100 ? 'Ready' : 'Not Ready'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{getCategoryIcon(category)}</span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <Badge variant="secondary" className="ml-auto">
                  {categoryItems.filter(i => i.completed).length} / {categoryItems.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {categoryItems.filter(i => i.required).length} required items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryItems.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </h4>
                        <Badge variant={getPriorityColor(item.priority) as any}>
                          {item.priority}
                        </Badge>
                        {item.required && (
                          <Badge variant="outline">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                        {item.description}
                      </p>
                    </div>

                    {(item.link || item.action) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleItemAction(item)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {index < categoryItems.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeploymentChecklist;