import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Handshake, TrendingUp, Shield } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTranslation } from "@/hooks/useTranslation";

export const CTASection = () => {
  const { t } = useTranslation();
  const { ref, isIntersecting } = useIntersectionObserver({ 
    threshold: 0.3,
    freezeOnceVisible: true 
  });

  const handleContactUs = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-primary via-secondary to-primary relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-primary-glow/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="bg-accent/20 text-white border-accent/30 px-6 py-2 text-sm font-semibold mb-6">
            🤝 {t('landing.promise.title')}
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight max-w-4xl mx-auto">
            {t('landing.promise.subtitle')}
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('landing.promise.description')}
          </p>

          <p className="text-xl text-accent font-semibold mb-12">
            {t('landing.promise.goal')}
          </p>
        </motion.div>

        {/* Partnership Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {[
            { 
              icon: Handshake, 
              title: "Partnership Approach", 
              description: "We don't just consult - we become your revenue partner",
              color: "from-blue-400 to-blue-300" 
            },
            { 
              icon: TrendingUp, 
              title: "Proven Results", 
              description: "20+ years of experience maximizing hotel revenues",
              color: "from-green-400 to-green-300" 
            },
            { 
              icon: Shield, 
              title: "Risk-Free Growth", 
              description: "Full ecosystem included at no extra cost",
              color: "from-purple-400 to-purple-300" 
            }
          ].map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Card className="border-0 bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105 h-full">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${benefit.color} flex items-center justify-center mb-6`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{benefit.title}</h3>
                    <p className="text-white/80 leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={handleContactUs}
            className="bg-accent hover:bg-accent-light text-primary font-bold px-12 py-6 rounded-full text-xl shadow-2xl hover:shadow-accent/25 transition-all duration-300 hover:scale-110 group"
          >
            {t('landing.hero.cta')}
            <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-white/70 mt-6 text-lg">
            Free consultation • Custom strategy • No upfront costs
          </p>
        </motion.div>
      </div>
    </section>
  );
};