import { motion } from "framer-motion";
import { Interactive3DCard } from "@/components/3d/Interactive3DCard";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Hotel, 
  Link, 
  Globe, 
  Smartphone,
  Brain,
  BarChart3,
  Users,
  Zap,
  Gift,
  Star
} from "lucide-react";

export const Tools3DShowcase = () => {
  const { t } = useTranslation();
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  const tools = [
    {
      icon: Hotel,
      titleKey: "tools.hotelPms.title",
      descriptionKey: "tools.hotelPms.description",
      color: "#6366f1"
    },
    {
      icon: Globe,
      titleKey: "tools.miniGds.title",
      descriptionKey: "tools.miniGds.description",
      color: "#06b6d4"
    },
    {
      icon: Smartphone,
      titleKey: "tools.socialMediaKit.title",
      descriptionKey: "tools.socialMediaKit.description",
      color: "#f59e0b"
    },
    {
      icon: Brain,
      titleKey: "tools.revenueAi.title",
      descriptionKey: "tools.revenueAi.description",
      color: "#10b981"
    },
    {
      icon: BarChart3,
      titleKey: "tools.analyticsHub.title",
      descriptionKey: "tools.analyticsHub.description",
      color: "#ef4444"
    },
    {
      icon: Users,
      titleKey: "tools.guestCrm.title",
      descriptionKey: "tools.guestCrm.description",
      color: "#f97316"
    },
    {
      icon: Zap,
      titleKey: "tools.automationEngine.title",
      descriptionKey: "tools.automationEngine.description",
      color: "#ec4899"
    }
  ];

  return (
    <section ref={ref} className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent)] opacity-50" />
        
        {/* Floating geometric shapes - responsive sizes */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-10 sm:top-20 left-4 sm:left-20 w-20 h-20 sm:w-32 sm:h-32 border border-purple-500/30 rounded-full"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            y: [0, -20, 0]
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-10 sm:bottom-20 right-4 sm:right-20 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-center mb-20"
        >
          {/* FREE Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={isIntersecting ? { scale: 1, rotate: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-400 blur-lg opacity-50 animate-pulse" />
              <div className="relative px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 border-2 border-white/20 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                  <Gift className="w-6 h-6 text-white animate-bounce" />
                  <span className="text-white font-bold text-lg">
                    {t('tools.freeBadge')}
                  </span>
                  <Star className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={isIntersecting ? { scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-semibold">
                {t('tools.revolutionaryEcosystem')}
              </span>
            </div>
          </motion.div>

          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-tight"
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-200 block">
              {t('tools.toolsThat')}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 block">
              {t('tools.transformHotels')}
            </span>
          </motion.h2>

          <motion.p 
            className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
          >
            {t('tools.subtitle')}
          </motion.p>

          {/* Partnership Emphasis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-8 px-4"
          >
            <div className="inline-flex items-center space-x-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-400/30">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 border-2 border-white animate-pulse" />
              </div>
              <span className="text-white/90 font-semibold text-sm sm:text-base">
                {t('tools.partnershipMessage')}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* 3D Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 mb-20 px-4">
          {tools.map((tool, index) => (
            <Interactive3DCard
              key={tool.titleKey}
              icon={tool.icon}
              title={t(tool.titleKey)}
              description={t(tool.descriptionKey)}
              color={tool.color}
              index={index}
            />
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-center px-4"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <button 
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-8 sm:px-12 py-4 sm:py-6 rounded-full overflow-hidden font-bold text-lg sm:text-xl text-white transition-all duration-500"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 transition-all duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
              
              {/* Button text */}
              <span className="relative z-10 flex items-center space-x-3">
                <span>{t('tools.ctaButton')}</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </span>
            </button>
          </motion.div>

          {/* Enhanced FREE messaging */}
          <motion.div 
            className="mt-8 space-y-4"
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.4 }}
          >
            <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-400/20 backdrop-blur-xl border border-emerald-400/30">
              <Gift className="w-5 h-5 text-emerald-300 animate-bounce" />
              <span className="text-white font-semibold text-base sm:text-lg">
                {t('tools.freeMessage')}
              </span>
            </div>
            
            <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto">
              {t('tools.noExtraCost')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};