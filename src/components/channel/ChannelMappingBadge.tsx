import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelMappingBadgeProps {
  mapped: number;
  total: number;
  className?: string;
}

export const ChannelMappingBadge = ({ mapped, total, className }: ChannelMappingBadgeProps) => {
  const unmapped = total - mapped;
  const completionPercentage = total > 0 ? Math.round((mapped / total) * 100) : 0;
  
  const getBadgeVariant = () => {
    if (completionPercentage === 100) return "default";
    if (completionPercentage >= 80) return "secondary";
    return "destructive";
  };

  const getIcon = () => {
    if (completionPercentage === 100) return <Check className="h-3 w-3 mr-1" />;
    if (unmapped > 0) return <X className="h-3 w-3 mr-1" />;
    return <AlertTriangle className="h-3 w-3 mr-1" />;
  };

  return (
    <Badge 
      variant={getBadgeVariant()} 
      className={cn("text-xs font-medium", className)}
    >
      {getIcon()}
      {completionPercentage}% ({mapped}/{total})
    </Badge>
  );
};