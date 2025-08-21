import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'blue',
  className 
}: StatCardProps) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      text: 'text-green-600',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    yellow: {
      bg: 'from-yellow-500 to-yellow-600',
      text: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      text: 'text-red-600',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    gray: {
      bg: 'from-gray-500 to-gray-600',
      text: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="card-modern overflow-hidden relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {icon && (
              <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color].bg} shadow-sm`}>
                <div className="text-white h-4 w-4">
                  {icon}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-display font-bold text-foreground">{value}</span>
              {trend && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    trend.direction === 'up' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : trend.direction === 'down'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}
                >
                  {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {trend.value}
                </Badge>
              )}
            </div>
            
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            
            {trend && (
              <p className="text-xs text-muted-foreground">{trend.label}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};