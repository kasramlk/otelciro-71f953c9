import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SocialMediaKPICardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  period?: string;
}

export const SocialMediaKPICard: React.FC<SocialMediaKPICardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  trend,
  period = 'vs last month'
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-3 w-3" />;
      case 'down':
        return <ArrowDownRight className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className={`flex items-center text-xs ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="ml-1">{change} {period}</span>
        </div>
      </CardContent>
    </Card>
  );
};