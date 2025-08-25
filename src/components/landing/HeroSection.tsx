import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, TrendingUp, Users, Target } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTranslation } from "@/hooks/useTranslation";
import otelciroLogo from "@/assets/otelciro-logo.png";

interface HeroSectionProps {
  onExploreClick: () => void;
}

export const HeroSection = ({ onExploreClick }: HeroSectionProps) => {
  const { t } = useTranslation();
  const { ref, isIntersecting } = useIntersectionObserver({ 
    threshold: 0.3,
    freezeOnceVisible: true 
  });

  return (
    <section ref={ref} className="relative min-h-screen bg-gradient-to-br from-primary via-secondary to-primary overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-glow/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isIntersecting ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center justify-center mb-10"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent-light/20 blur-lg rounded-full animate-pulse-glow" />
              <img 
                src={otelciroLogo} 
                alt="OtelCiro.com" 
                className="relative h-24 md:h-28 w-auto drop-shadow-2xl filter brightness-105 hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>

          {/* Headlines */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-5xl mx-auto">
              {t('landing.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
          >
            <Button
              size="lg"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              {t('landing.hero.cta')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full text-lg"
              onClick={onExploreClick}
            >
              <ArrowDown className="mr-2 h-5 w-5" />
              {t('landing.hero.ctaSecondary')}
            </Button>
          </motion.div>

          {/* Revenue Benefits Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
          >
            {[
              { 
                icon: TrendingUp,
                title: t('landing.whatWeDo.benefit1'),
                color: "from-green-500 to-green-400" 
              },
              { 
                icon: Target,
                title: t('landing.whatWeDo.benefit2'),
                color: "from-blue-500 to-blue-400" 
              },
              { 
                icon: Users,
                title: t('landing.whatWeDo.benefit3'),
                color: "from-purple-500 to-purple-400" 
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className={`glass p-6 rounded-2xl bg-gradient-to-r ${benefit.color} backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform cursor-pointer`}
                  onClick={onExploreClick}
                >
                  <Icon className="h-8 w-8 text-white mb-3" />
                  <p className="text-white font-semibold text-sm leading-relaxed">{benefit.title}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isIntersecting ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <ArrowDown className="h-6 w-6 text-white/70 animate-bounce" />
      </motion.div>
    </section>
  );
};