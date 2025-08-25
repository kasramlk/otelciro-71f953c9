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
  Zap
} from "lucide-react";

export const Tools3DShowcase = () => {
  const { t } = useTranslation();
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  const tools = [
    {
      icon: Hotel,
      title: "Hotel PMS",
      description: "Advanced property management system with AI-powered automation, real-time analytics, and seamless guest experience management.",
      color: "#6366f1"
    },
    {
      icon: Link,
      title: "Channel Manager",
      description: "Intelligent distribution management connecting to 500+ OTAs worldwide with dynamic pricing and inventory optimization.",
      color: "#8b5cf6"
    },
    {
      icon: Globe,
      title: "Mini-GDS",
      description: "Global distribution system accessing 100+ B2B agencies with real-time booking engine and commission management.",
      color: "#06b6d4"
    },
    {
      icon: Smartphone,
      title: "Social Media Kit",
      description: "AI-powered content creation, automated posting, brand management, and performance analytics across all platforms.",
      color: "#f59e0b"
    },
    {
      icon: Brain,
      title: "Revenue AI",
      description: "Machine learning algorithms for demand forecasting, dynamic pricing, and revenue optimization strategies.",
      color: "#10b981"
    },
    {
      icon: BarChart3,
      title: "Analytics Hub",
      description: "Advanced business intelligence dashboard with predictive analytics, KPI tracking, and automated reporting.",
      color: "#ef4444"
    },
    {
      icon: Users,
      title: "Guest CRM",
      description: "Comprehensive customer relationship management with personalization engine and loyalty program integration.",
      color: "#f97316"
    },
    {
      icon: Zap,
      title: "Automation Engine",
      description: "Workflow automation for operations, marketing campaigns, guest communications, and business processes.",
      color: "#ec4899"
    }
  ];

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent)] opacity-50" />
        
        {/* Floating geometric shapes */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-20 left-20 w-32 h-32 border border-purple-500/30 rounded-full"
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
          className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg"
        />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isIntersecting ? { scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-semibold">
                🚀 Our Revolutionary Ecosystem
              </span>
            </div>
          </motion.div>

          <motion.h2 
            className="text-6xl md:text-7xl font-bold mb-8"
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-200">
              Tools That
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              Transform Hotels
            </span>
          </motion.h2>

          <motion.p 
            className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Experience the future of hospitality with our AI-powered suite. Each tool is designed to maximize your revenue, 
            minimize operational costs, and deliver exceptional guest experiences.
          </motion.p>
        </motion.div>

        {/* 3D Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {tools.map((tool, index) => (
            <Interactive3DCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
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
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <button 
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-12 py-6 rounded-full overflow-hidden font-bold text-xl text-white transition-all duration-500"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 transition-all duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
              
              {/* Button text */}
              <span className="relative z-10 flex items-center space-x-3">
                <span>Experience Our Ecosystem</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </span>
            </button>
          </motion.div>

          <motion.p 
            className="text-white/60 mt-6 text-lg"
            initial={{ opacity: 0 }}
            animate={isIntersecting ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.4 }}
          >
            All tools included FREE with our revenue partnership
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};