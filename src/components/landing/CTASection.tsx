import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { ArrowRight, Sparkles, Users, TrendingUp, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stats = [
  { icon: Users, value: "10,000+", label: "Hotels Trust Us" },
  { icon: TrendingUp, value: "35%", label: "Average Revenue Increase" },
  { icon: Shield, value: "99.9%", label: "Uptime Guarantee" },
  { icon: Sparkles, value: "24/7", label: "AI-Powered Support" }
];

export const CTASection = () => {
  const navigate = useNavigate();
  const { ref, isIntersecting } = useIntersectionObserver({ 
    threshold: 0.3,
    freezeOnceVisible: true 
  });

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          {/* Headlines */}
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Ready to Transform Your Hotel?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of hotels already using OtelCiro's AI-powered platform to increase efficiency, 
              boost revenue, and deliver exceptional guest experiences.
            </p>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <stat.icon className="h-8 w-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-white font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
            >
              <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Start Your AI Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary/30 text-primary hover:bg-primary/5 px-8 py-4 rounded-full text-lg group"
              onClick={() => window.open('https://docs.lovable.dev', '_blank')}
            >
              View Documentation
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
            className="pt-12 space-y-4"
          >
            <p className="text-sm text-muted-foreground">Trusted by leading hotel chains worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Placeholder for hotel chain logos */}
              <div className="h-8 w-24 bg-muted rounded"></div>
              <div className="h-8 w-32 bg-muted rounded"></div>
              <div className="h-8 w-28 bg-muted rounded"></div>
              <div className="h-8 w-36 bg-muted rounded"></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};