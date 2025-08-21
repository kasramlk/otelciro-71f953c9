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

const RevenueAI = () => {
  // Mock AI data - in real app from Supabase + OpenAI
  const aiInsights = {
    revenueOptimization: 15.3, // percentage improvement
    pricingAccuracy: 94.2,
    demandForecast: 89.7,
    competitorAnalysis: 87.4
  };

  const pricingRecommendations = [
    {
      id: 1,
      roomType: "Deluxe Room",
      currentRate: 185,
      recommendedRate: 210,
      confidence: 92,
      reasoning: "High demand detected for March 15-22 due to Fashion Week event",
      potentialRevenue: 2850,
      status: "pending"
    },
    {
      id: 2,
      roomType: "Suite",
      currentRate: 350,
      recommendedRate: 320,
      confidence: 88,
      reasoning: "Competitor rates are 12% lower, recommend price adjustment",
      potentialRevenue: -1240,
      status: "applied"
    },
    {
      id: 3,
      roomType: "Standard Room",
      currentRate: 120,
      recommendedRate: 145,
      confidence: 95,
      reasoning: "Occupancy trending 85%+ for next week, opportunity to increase rates",
      potentialRevenue: 1875,
      status: "pending"
    }
  ];

  const competitorData = [
    { name: "Four Seasons", avgRate: 520, occupancy: 78, trend: "up" },
    { name: "Hilton", avgRate: 280, occupancy: 82, trend: "stable" },
    { name: "Marriott", avgRate: 245, occupancy: 89, trend: "down" },
    { name: "Hyatt", avgRate: 315, occupancy: 74, trend: "up" }
  ];

  const forecastData = [
    { period: "Next 7 Days", occupancy: 87.3, adr: 198, revpar: 173 },
    { period: "Next 30 Days", occupancy: 82.1, adr: 205, revpar: 168 },
    { period: "Next 90 Days", occupancy: 79.5, adr: 189, revpar: 150 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Revenue AI Copilot
          </h2>
          <p className="text-muted-foreground">AI-powered revenue optimization and dynamic pricing recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Zap className="mr-1 h-3 w-3" />
            AI Active
          </Badge>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configure AI
          </Button>
        </div>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Revenue Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-green-600">+{aiInsights.revenueOptimization}%</div>
              <p className="text-xs text-green-600 mt-1">vs baseline pricing</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Target className="mr-2 h-4 w-4 text-blue-500" />
                Pricing Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{aiInsights.pricingAccuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1">Prediction accuracy</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                Demand Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{aiInsights.demandForecast}%</div>
              <p className="text-xs text-muted-foreground mt-1">Forecast reliability</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <BarChart3 className="mr-2 h-4 w-4 text-orange-500" />
                Competitor Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{aiInsights.competitorAnalysis}%</div>
              <p className="text-xs text-muted-foreground mt-1">Data completeness</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="forecasts">Demand Forecasts</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="automation">Auto-Pricing Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Dynamic Pricing Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingRecommendations.map((rec, index) => {
                const StatusIcon = getStatusIcon(rec.status);
                const isIncrease = rec.recommendedRate > rec.currentRate;
                
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="grid md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold">{rec.roomType}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(rec.status)}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">
                            {rec.confidence}% confidence
                          </Badge>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Current Rate</div>
                        <div className="text-xl font-bold">${rec.currentRate}</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">AI Recommended</div>
                        <div className={`text-xl font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          ${rec.recommendedRate}
                        </div>
                        <div className={`text-xs ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncrease ? '+' : ''}{((rec.recommendedRate - rec.currentRate) / rec.currentRate * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Potential Impact</div>
                        <div className={`text-lg font-bold ${rec.potentialRevenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rec.potentialRevenue > 0 ? '+' : ''}${Math.abs(rec.potentialRevenue).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">next 30 days</div>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-muted/50 rounded">
                      <p className="text-sm"><strong>AI Reasoning:</strong> {rec.reasoning}</p>
                    </div>

                    {rec.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1">
                          Apply Recommendation
                        </Button>
                        <Button size="sm" variant="outline">
                          Modify
                        </Button>
                        <Button size="sm" variant="ghost">
                          Decline
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Demand Forecasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecastData.map((forecast, index) => (
                    <motion.div
                      key={forecast.period}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{forecast.period}</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{forecast.occupancy}%</div>
                          <div className="text-xs text-muted-foreground">Occupancy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">${forecast.adr}</div>
                          <div className="text-xs text-muted-foreground">ADR</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">${forecast.revpar}</div>
                          <div className="text-xs text-muted-foreground">RevPAR</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Market Events Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
                    <h3 className="font-semibold text-orange-800">Istanbul Fashion Week</h3>
                    <p className="text-sm text-orange-700">Mar 15-22 • High impact expected</p>
                    <div className="text-xs text-orange-600 mt-1">+80% demand increase predicted</div>
                  </div>
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-semibold text-blue-800">Tech Conference</h3>
                    <p className="text-sm text-blue-700">Apr 10-12 • Medium impact expected</p>
                    <div className="text-xs text-blue-600 mt-1">+40% demand increase predicted</div>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-semibold text-green-800">Summer Festival</h3>
                    <p className="text-sm text-green-700">Jul 20-22 • High impact expected</p>
                    <div className="text-xs text-green-600 mt-1">+110% demand increase predicted</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Competitive Positioning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {competitorData.map((competitor, index) => (
                  <motion.div
                    key={competitor.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{competitor.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        Avg Rate: <span className="font-medium">${competitor.avgRate}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{competitor.occupancy}%</div>
                      <div className="text-xs text-muted-foreground">Occupancy</div>
                    </div>
                    <div>
                      <Badge
                        variant={competitor.trend === 'up' ? 'default' : 
                                competitor.trend === 'down' ? 'destructive' : 'secondary'}
                      >
                        {competitor.trend === 'up' ? '↗' : competitor.trend === 'down' ? '↘' : '→'} 
                        {competitor.trend}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Auto-Pricing Rules</h3>
                <p className="text-muted-foreground">
                  Configure automated pricing rules based on occupancy, demand, competitor rates, and market events.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueAI;