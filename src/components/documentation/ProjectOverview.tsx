import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Users, 
  Building, 
  Calendar, 
  BarChart, 
  Settings, 
  Shield,
  Zap,
  Database,
  Globe
} from 'lucide-react';

const ProjectOverview = () => {
  const phases = [
    {
      phase: 1,
      title: "Core HMS Foundation",
      status: "completed",
      description: "Basic hotel management system with reservations, rooms, and user management",
      features: [
        "Multi-tenant architecture with RLS",
        "Role-based authentication (Admin, Hotel Manager, Travel Agency)",
        "Core reservation management",
        "Room planning and occupancy tracking",
        "Basic folio management"
      ]
    },
    {
      phase: 2,
      title: "Advanced Reservations & Occupancy",
      status: "completed",
      description: "Enhanced booking features and comprehensive occupancy management",
      features: [
        "Advanced reservation workflows",
        "Group reservations and waitlist management",
        "Room move and extension dialogs",
        "Folio splitting and charge management",
        "Detailed occupancy analytics"
      ]
    },
    {
      phase: 3,
      title: "Channel Management & Integration",
      status: "completed",
      description: "Multi-channel distribution and rate management",
      features: [
        "ARI (Availability, Rates, Inventory) calendar",
        "Channel mapping and reconciliation",
        "Out-of-order room management",
        "Rate optimization with AI suggestions",
        "Multi-format export system (PDF, Excel, CSV, PowerPoint)"
      ]
    },
    {
      phase: 4,
      title: "Advanced Features & Performance",
      status: "completed",
      description: "Real-time features and performance optimizations",
      features: [
        "Real-time notifications and presence tracking",
        "Performance monitoring and analytics",
        "Virtualized tables for large datasets",
        "Advanced caching strategies",
        "Lazy loading and code splitting"
      ]
    },
    {
      phase: 5,
      title: "Production Readiness & QA",
      status: "completed",
      description: "Testing, deployment preparation, and final integration",
      features: [
        "Comprehensive QA test suite",
        "Deployment checklist and validation",
        "Performance monitoring dashboard",
        "Security audit tools",
        "Production deployment guidelines"
      ]
    }
  ];

  const keyFeatures = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "Multi-Tenant Architecture",
      description: "Secure role-based access with complete data isolation"
    },
    {
      icon: <Building className="h-5 w-5" />,
      title: "Hotel Management",
      description: "Complete PMS with reservations, rooms, and guest management"
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Travel Agency Portal",
      description: "Mini-GDS for agency bookings and hotel search"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "ARI Management",
      description: "Advanced availability, rates, and inventory control"
    },
    {
      icon: <BarChart className="h-5 w-5" />,
      title: "Analytics & Reporting",
      description: "Comprehensive reporting with multiple export formats"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Enterprise Security",
      description: "Row-level security, audit logging, and compliance"
    }
  ];

  const techStack = [
    { category: "Frontend", items: ["React 18", "TypeScript", "Tailwind CSS", "Framer Motion", "React Query"] },
    { category: "Backend", items: ["Supabase", "PostgreSQL", "Row Level Security", "Edge Functions"] },
    { category: "Performance", items: ["React Window", "Code Splitting", "Lazy Loading", "Caching"] },
    { category: "Testing", items: ["Automated QA Suite", "Performance Monitoring", "Security Scanning"] }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">OtelCiro PMS Platform</h1>
        <p className="text-xl text-muted-foreground mb-2">
          Enterprise Hotel Management System with Travel Agency Integration
        </p>
        <Badge className="text-sm px-3 py-1">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Production Ready
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keyFeatures.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Development Phases
          </CardTitle>
          <CardDescription>Complete development roadmap and feature delivery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {phases.map((phase, index) => (
            <div key={phase.phase}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {phase.phase}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{phase.title}</h3>
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {phase.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{phase.description}</p>
                  <ul className="space-y-1">
                    {phase.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {index < phases.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Technology Stack
          </CardTitle>
          <CardDescription>Modern, scalable technology choices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((stack, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-3 text-primary">{stack.category}</h4>
                <ul className="space-y-2">
                  {stack.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Architecture
          </CardTitle>
          <CardDescription>Enterprise-grade architecture and security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Security Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Row Level Security (RLS) policies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Multi-tenant data isolation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Role-based access control
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Comprehensive audit logging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Secure authentication flows
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Performance Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Virtualized tables for large datasets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Advanced caching strategies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Real-time data synchronization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Lazy loading and code splitting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Performance monitoring dashboard
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready for Production</h3>
              <p className="text-muted-foreground">
                The OtelCiro PMS platform is now complete with comprehensive testing, 
                security validation, and deployment preparation. All phases have been 
                successfully implemented and are ready for production deployment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverview;