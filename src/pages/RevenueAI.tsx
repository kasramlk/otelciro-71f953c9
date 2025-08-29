import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Settings
} from "lucide-react";

import { AIInsightsCenter } from '@/components/ai/AIInsightsCenter';

const RevenueAI = () => {
  return <AIInsightsCenter />;
};

export default RevenueAI;