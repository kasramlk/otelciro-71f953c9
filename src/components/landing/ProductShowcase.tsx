import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { 
  Hotel, 
  Network, 
  Globe, 
  Megaphone,
  Brain,
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Users,
  Calendar,
  ArrowRight
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  borderColor: string;
  features: Array<{
    icon: React.ComponentType<any>;
    title: string;
    description: string;
  }>;
  demoComponent: React.ReactNode;
  ctaText: string;
  ctaRoute: string;
  badge?: string;
}

const products: Product[] = [
  {
    id: 'pms',
    title: 'Hotel PMS',
    subtitle: 'Property Management System',
    description: 'AI-powered hotel operations that learn from your guests and optimize every interaction',
    icon: Hotel,
    gradient: 'from-primary to-primary-light',
    borderColor: 'border-primary/30',
    features: [
      {
        icon: Brain,
        title: 'Smart Revenue Optimization',
        description: 'AI analyzes market demand and guest behavior to maximize revenue per room'
      },
      {
        icon: BarChart3,
        title: 'Predictive Analytics Dashboard',
        description: 'Forecast occupancy, predict maintenance needs, and anticipate guest preferences'
      },
      {
        icon: Users,
        title: 'Automated Guest Preferences',
        description: 'Learn and remember guest preferences to personalize every stay'
      },
      {
        icon: Zap,
        title: 'Real-time Demand Forecasting',
        description: 'Dynamic pricing based on 200+ market factors and booking patterns'
      }
    ],
    demoComponent: <PMSDemo />,
    ctaText: 'Discover PMS AI',
    ctaRoute: '/dashboard'
  },
  {
    id: 'channel',
    title: 'Channel Manager',
    subtitle: 'Multi-Channel Distribution',
    description: 'Intelligent distribution that automatically optimizes rates and inventory across all channels',
    icon: Network,
    gradient: 'from-secondary to-secondary-light',
    borderColor: 'border-secondary/30',
    features: [
      {
        icon: Target,
        title: 'Intelligent Rate Distribution',
        description: 'AI optimizes rates for each channel based on demand and competition'
      },
      {
        icon: TrendingUp,
        title: 'Market Demand Analysis',
        description: 'Real-time market insights to adjust pricing strategy instantly'
      },
      {
        icon: BarChart3,
        title: 'Competitor Price Intelligence',
        description: 'Monitor and respond to competitor pricing automatically'
      },
      {
        icon: Zap,
        title: 'Auto-Inventory Synchronization',
        description: 'Seamless real-time inventory updates across 200+ channels'
      }
    ],
    demoComponent: <ChannelDemo />,
    ctaText: 'Experience CM AI',
    ctaRoute: '/channel-management'
  },
  {
    id: 'gds',
    title: 'Mini GDS',
    subtitle: 'Global Distribution System',
    description: 'AI-driven search and booking engine that connects travel agencies with hotel inventory',
    icon: Globe,
    gradient: 'from-purple-500 to-purple-400',
    borderColor: 'border-purple-400/30',
    features: [
      {
        icon: Target,
        title: 'Smart Inventory Matching',
        description: 'AI matches agency requests with optimal hotel inventory'
      },
      {
        icon: Brain,
        title: 'Personalized Rate Recommendations',
        description: 'Machine learning suggests best rates based on booking history'
      },
      {
        icon: BarChart3,
        title: 'Travel Pattern Analysis',
        description: 'Analyze booking patterns to predict future demand'
      },
      {
        icon: Users,
        title: 'Automated Negotiation Assistant',
        description: 'AI assists in rate negotiations and contract management'
      }
    ],
    demoComponent: <GDSDemo />,
    ctaText: 'Explore GDS AI',
    ctaRoute: '/agency'
  },
  {
    id: 'social',
    title: 'Social Media Kit',
    subtitle: 'AI-Powered Marketing Platform',
    description: 'Comprehensive social media management with AI content generation and performance optimization',
    icon: Megaphone,
    gradient: 'from-accent to-accent-light',
    borderColor: 'border-accent/30',
    features: [
      {
        icon: Brain,
        title: 'AI Content Generation',
        description: 'Create engaging posts, stories, and campaigns with hotel-specific AI'
      },
      {
        icon: Calendar,
        title: 'Optimal Posting Predictions',
        description: 'AI determines the best times to post for maximum engagement'
      },
      {
        icon: TrendingUp,
        title: 'Engagement Forecasting',
        description: 'Predict post performance and optimize content strategy'
      },
      {
        icon: Zap,
        title: 'Automated Response Suggestions',
        description: 'AI-powered responses for comments and messages'
      }
    ],
    demoComponent: <SocialDemo />,
    ctaText: 'Try Social AI',
    ctaRoute: '/social-media',
    badge: 'NEW'
  }
];

function PMSDemo() {
  return (
    <div className="bg-primary/5 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Today's AI Insights</span>
        <Badge variant="secondary">Live Data</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/80 rounded p-2">
          <div className="text-primary font-semibold">+23% Revenue</div>
          <div className="text-muted-foreground">AI Optimization</div>
        </div>
        <div className="bg-white/80 rounded p-2">
          <div className="text-green-600 font-semibold">98.2% Accuracy</div>
          <div className="text-muted-foreground">Demand Forecast</div>
        </div>
      </div>
      <div className="bg-accent/10 rounded p-2 text-xs">
        <div className="font-medium">🧠 AI Recommendation</div>
        <div className="text-muted-foreground">Increase weekend rates by 15% - High demand predicted</div>
      </div>
    </div>
  );
}

function ChannelDemo() {
  return (
    <div className="bg-secondary/5 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Channel Sync Status</span>
        <Badge className="bg-green-500">All Synced</Badge>
      </div>
      <div className="space-y-2">
        {['Booking.com', 'Expedia', 'Airbnb'].map((channel, i) => (
          <div key={channel} className="flex justify-between items-center text-xs">
            <span>{channel}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-secondary/20 rounded-full h-1">
                <div className="bg-secondary h-1 rounded-full" style={{width: `${90 + i * 3}%`}} />
              </div>
              <span className="text-secondary font-medium">{90 + i * 3}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-secondary/10 rounded p-2 text-xs">
        <div className="font-medium">🎯 AI Optimization</div>
        <div className="text-muted-foreground">Rate adjusted on 3 channels - Competition analysis complete</div>
      </div>
    </div>
  );
}

function GDSDemo() {
  return (
    <div className="bg-purple-50 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Smart Search Results</span>
        <Badge className="bg-purple-500">AI Powered</Badge>
      </div>
      <div className="space-y-2">
        <div className="bg-white rounded p-2 border-l-4 border-purple-400">
          <div className="font-medium text-sm">Luxury Resort Match</div>
          <div className="text-xs text-muted-foreground">95% compatibility • Best rate available</div>
        </div>
        <div className="bg-white rounded p-2 border-l-4 border-purple-300">
          <div className="font-medium text-sm">Business Hotel</div>
          <div className="text-xs text-muted-foreground">87% compatibility • Corporate rates</div>
        </div>
      </div>
      <div className="bg-purple-100 rounded p-2 text-xs">
        <div className="font-medium">💡 AI Suggestion</div>
        <div className="text-muted-foreground">Bundle recommendation increases booking probability by 34%</div>
      </div>
    </div>
  );
}

function SocialDemo() {
  return (
    <div className="bg-accent/5 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">AI Content Preview</span>
        <Badge className="bg-accent text-primary">Generating</Badge>
      </div>
      <div className="bg-white rounded p-3 border border-accent/20">
        <div className="text-xs font-medium mb-2">Generated Post:</div>
        <div className="text-xs text-muted-foreground italic">
          "Wake up to breathtaking ocean views at our luxury resort 🌅 Experience world-class hospitality where every detail is crafted for your perfect getaway. #LuxuryTravel #OceanView"
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span>Best posting time: 7:30 AM</span>
        <span className="text-accent font-medium">Engagement: 89% predicted</span>
      </div>
    </div>
  );
}

export const ProductShowcase = () => {
  const { ref, isIntersecting } = useIntersectionObserver({ 
    threshold: 0.1,
    freezeOnceVisible: true 
  });

  return (
    <section id="products" ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Four AI-Enhanced Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Each product powered by cutting-edge artificial intelligence that learns, adapts, and optimizes your hotel operations in real-time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={isIntersecting ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <Card className={`relative overflow-hidden border-2 ${product.borderColor} hover:shadow-xl transition-all duration-500 hover:scale-[1.02] group`}>
                {product.badge && (
                  <Badge className="absolute top-4 right-4 z-10 bg-accent text-primary font-bold">
                    {product.badge}
                  </Badge>
                )}
                
                <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
                <CardHeader className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-r ${product.gradient}`}>
                      <product.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{product.title}</CardTitle>
                      <CardDescription className="text-lg">{product.subtitle}</CardDescription>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{product.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* AI Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isIntersecting ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: index * 0.2 + featureIndex * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <feature.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Interactive Demo */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3">Live AI Demo</h4>
                    {product.demoComponent}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full bg-gradient-to-r ${product.gradient} hover:shadow-lg transition-all group/btn`}
                    onClick={() => window.location.href = product.ctaRoute}
                  >
                    {product.ctaText}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};