import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

export const PricingSection = () => {
  const { t } = useTranslation();
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.2 });

  const plans = [
    {
      id: 'starter',
      icon: Zap,
      popular: false,
      features: [
        'pricing.starter.feature1',
        'pricing.starter.feature2',
        'pricing.starter.feature3',
        'pricing.starter.feature4',
        'pricing.starter.feature5'
      ]
    },
    {
      id: 'professional',
      icon: Star,
      popular: true,
      features: [
        'pricing.professional.feature1',
        'pricing.professional.feature2',
        'pricing.professional.feature3',
        'pricing.professional.feature4',
        'pricing.professional.feature5',
        'pricing.professional.feature6',
        'pricing.professional.feature7'
      ]
    },
    {
      id: 'enterprise',
      icon: Crown,
      popular: false,
      features: [
        'pricing.enterprise.feature1',
        'pricing.enterprise.feature2',
        'pricing.enterprise.feature3',
        'pricing.enterprise.feature4',
        'pricing.enterprise.feature5',
        'pricing.enterprise.feature6',
        'pricing.enterprise.feature7',
        'pricing.enterprise.feature8'
      ]
    }
  ];

  const handleContactUs = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={ref} id="pricing" className="py-20 bg-gradient-to-br from-secondary/5 to-primary/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('pricing.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1">
                      {t('pricing.popular')}
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full border-0 shadow-xl relative overflow-hidden ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-primary/5 to-secondary/5 ring-2 ring-primary/20' 
                    : 'bg-background'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary to-secondary opacity-10 rounded-bl-full" />
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary to-secondary' 
                        : 'bg-muted'
                    }`}>
                      <Icon className={`h-8 w-8 ${plan.popular ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {t(`pricing.${plan.id}.name`)}
                    </CardTitle>
                    
                    <p className="text-muted-foreground mt-2">
                      {t(`pricing.${plan.id}.description`)}
                    </p>
                    
                    <div className="mt-6">
                      <div className="text-4xl font-bold text-foreground">
                        {t(`pricing.${plan.id}.price`)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(`pricing.${plan.id}.period`)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {t(feature)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleContactUs}
                      className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white shadow-lg hover:shadow-xl'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      {t('pricing.contactUs')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Card className="max-w-4xl mx-auto border-0 shadow-lg bg-gradient-to-r from-accent/5 to-primary/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {t('pricing.guarantee.title')}
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                {t('pricing.guarantee.description')}
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">30</div>
                  <div className="text-sm text-muted-foreground">{t('pricing.guarantee.days')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">{t('pricing.guarantee.support')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent mb-2">∞</div>
                  <div className="text-sm text-muted-foreground">{t('pricing.guarantee.updates')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};