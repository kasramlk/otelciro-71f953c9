import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const KPICard = ({ title, value, change, icon, color = 'primary', className }: KPICardProps) => {
  const colorClasses = {
    primary: 'from-primary to-primary-light',
    secondary: 'from-secondary to-secondary-light',
    accent: 'from-accent to-accent-light',
    success: 'from-green-500 to-green-400',
    warning: 'from-yellow-500 to-yellow-400',
    danger: 'from-red-500 to-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="card-modern card-hover overflow-hidden relative group">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <p className="text-3xl font-display font-bold text-foreground mb-2">{value}</p>
              
              {change && (
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={change.type === 'increase' ? 'default' : 'secondary'}
                    className={`flex items-center space-x-1 ${
                      change.type === 'increase' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {change.type === 'increase' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{change.value}%</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">{change.period}</span>
                </div>
              )}
            </div>
            
            {icon && (
              <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
                <div className="text-white">
                  {icon}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};