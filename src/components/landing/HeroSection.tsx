import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, TrendingUp, Users, Target, Sparkles } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTranslation } from "@/hooks/useTranslation";
import { Scene3D } from "@/components/3d/Scene3D";
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
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      {/* 3D Background Scene */}
      <Scene3D />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90" />
      
      {/* Animated mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.4),transparent)] opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.4),transparent)] opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(6,182,212,0.4),transparent)] opacity-70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Logo with glassmorphism */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isIntersecting ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center justify-center mb-12"
          >
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Glowing backdrop */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-cyan-600/30 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Glass container */}
              <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl">
                <img 
                  src={otelciroLogo} 
                  alt="OtelCiro.com" 
                  className="relative h-16 md:h-20 w-auto drop-shadow-2xl filter brightness-110"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Headlines with gradient text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight max-w-6xl mx-auto"
              initial={{ opacity: 0 }}
              animate={isIntersecting ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white">
                {t('landing.hero.title').split(' ').slice(0, 6).join(' ')}
              </span>
              <br />
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                style={{
                  backgroundSize: '200% 200%'
                }}
              >
                {t('landing.hero.title').split(' ').slice(6).join(' ')}
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-white/80 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {t('landing.hero.subtitle')}
            </motion.p>
          </motion.div>

          {/* CTA Buttons with micro animations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-full text-lg shadow-2xl border-0"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{t('landing.hero.cta')}</span>
                  <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="group border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full text-lg bg-transparent"
                onClick={onExploreClick}
              >
                <ArrowDown className="mr-2 h-5 w-5 group-hover:translate-y-1 transition-transform duration-300" />
                {t('landing.hero.ctaSecondary')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Interactive benefit cards with 3D hover effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto"
          >
            {[
              { 
                icon: TrendingUp,
                title: t('landing.whatWeDo.benefit1'),
                color: "#10b981",
                delay: 0
              },
              { 
                icon: Target,
                title: t('landing.whatWeDo.benefit2'),
                color: "#3b82f6",
                delay: 0.1
              },
              { 
                icon: Users,
                title: t('landing.whatWeDo.benefit3'),
                color: "#8b5cf6",
                delay: 0.2
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 1.4 + benefit.delay }}
                  whileHover={{ 
                    y: -10,
                    rotateY: 10,
                    rotateX: 5
                  }}
                  className="group relative cursor-pointer"
                  onClick={onExploreClick}
                >
                  {/* Glass card with backdrop blur */}
                  <div 
                    className="relative p-8 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 group-hover:shadow-4xl h-full"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      boxShadow: `0 25px 50px -12px ${benefit.color}30`
                    }}
                  >
                    {/* Animated border gradient */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: `conic-gradient(from 0deg, transparent, ${benefit.color}40, transparent)`,
                          animation: 'spin 3s linear infinite'
                        }}
                      />
                    </div>

                    {/* Icon with glow effect */}
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="relative z-10 w-16 h-16 mb-6 rounded-2xl flex items-center justify-center mx-auto"
                      style={{
                        background: `linear-gradient(145deg, ${benefit.color}30, ${benefit.color}20)`,
                        boxShadow: `0 10px 30px ${benefit.color}40`
                      }}
                    >
                      <Icon className="w-8 h-8" style={{ color: benefit.color }} />
                    </motion.div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      <h3 className="text-lg font-semibold text-white leading-tight">
                        {benefit.title}
                      </h3>
                    </div>

                    {/* Hover glow */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, ${benefit.color}20, transparent 70%)`,
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Animated scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isIntersecting ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center space-y-2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
            />
          </div>
          <span className="text-white/60 text-sm">Scroll</span>
        </motion.div>
      </motion.div>
    </section>
  );
};