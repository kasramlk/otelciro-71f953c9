import { motion } from "framer-motion";
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, PerspectiveCamera, Text, Sphere, Box } from '@react-three/drei';
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { TranslationProvider, Language } from "@/hooks/useTranslation";
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Target, 
  Users, 
  TrendingUp,
  Calendar,
  Award,
  Briefcase,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Rocket,
  Shield,
  Diamond,
  Crown,
  Home
} from "lucide-react";
import * as THREE from 'three';
import otelciroLogo from "@/assets/otelciro-logo.png";

// 3D Background Components
const FloatingGeometry = ({ position, color, type = 'sphere' }: { position: [number, number, number], color: string, type?: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position}>
        {type === 'box' ? (
          <boxGeometry args={[0.8, 0.8, 0.8]} />
        ) : (
          <sphereGeometry args={[0.4, 32, 32]} />
        )}
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.6}
          distort={0.2}
          speed={1}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
};

const Scene3DBackground = () => {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 75 }} className="absolute inset-0">
      <Environment preset="city" />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#3b82f6" />
      
      <FloatingGeometry position={[-3, 2, -2]} color="#003580" type="sphere" />
      <FloatingGeometry position={[3, -1, -1]} color="#009fe3" type="box" />
      <FloatingGeometry position={[-2, -2, -3]} color="#feba02" type="sphere" />
      <FloatingGeometry position={[2, 2, -2]} color="#8b5cf6" type="box" />
      <FloatingGeometry position={[0, -3, -4]} color="#10b981" type="sphere" />
    </Canvas>
  );
};

// Interactive 3D Card Component
const Interactive3DCard = ({ children, className = "", index = 0 }: { children: React.ReactNode, className?: string, index?: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateY: -15 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.02,
        rotateY: 5,
        rotateX: 2,
        z: 50
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group perspective-1000 ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Glowing backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
      
      {/* Glass card */}
      <div className="relative glass rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-elevated overflow-hidden transition-all duration-500">
        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div 
            className="absolute inset-0 bg-conic-gradient"
            style={{
              background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)',
              animation: 'spin 4s linear infinite'
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Particle effects */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary"
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: `${20 + Math.random() * 60}%`,
                  y: `${20 + Math.random() * 60}%`,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const CompanyProfile = () => {
  const [scrollY, setScrollY] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const hotels = [
    "Lumy Suite Hotel Bodrum Gumbet – Private Pool",
    "Balatella Suites",
    "Taksim Nova Orion Hotel & Spa",
    "Bodrum Eskicesme Lumy Hotel – Private Pool",
    "Istanbul Taksim Istanbul Street CasaVilla Hotel",
    "Erba Hotel",
    "Taksim Galata Port by AYDIN Hotel – City Center",
    "Istanbul Old City Beyazid Belmond Hotel",
    "Kensington Prince's Island Historical Mansion",
    "Nova Butik Hotel Çeşme",
    "Istanbul Old City Colorful Houses Balat PETRION Hotel",
    "Istiklal Street Kamilbey Hotel",
    "Istanbul Old City Topkapi Porta Romanos Hotel – Ottoman Heritage",
    "Marmaris Kensington Green",
    "Cihangir Modern Suite Hotel Taksim",
    "Istanbul Taksim Residence Hotel by MESUT",
    "Topkapi Old City Kensington Hotel – Ottoman Heritage",
    "Rays Hotel – Bakirkoy Istanbul City Center",
    "Taksim Istanbul NX Hotel – Istanbul Street",
    "Isparta Historical Mansion Eskiciler Konağı – Cittaslow",
    "Ramada by Wyndham Istanbul Grand Bazaar",
    "Wineport Lodge Ağva Riverside Hotel & Winery",
    "Tulip Rose Hotel",
    "Tulip City Hotel",
    "Tulip Hotel"
  ];

  const services = [
    { title: "OtelCiro RMS", desc: "Demand forecasting, price automation, promotions, and mix management" },
    { title: "PMS Integration Layer", desc: "Connects to existing PMSs while we migrate into one stack" },
    { title: "Channel Manager", desc: "Central ARI sync across OTAs and B2B partners" },
    { title: "Mini-GDS / Agency Hub", desc: "Access to 100+ local & global B2B agencies" },
    { title: "Social Media AI Kit", desc: "Multi-language content generation, scheduling, and analytics" }
  ];

  const stats = [
    { icon: Building2, label: "Hotels Managed", value: "~30", desc: "Across Türkiye" },
    { icon: Target, label: "Year 1 Goal", value: "150", desc: "Hotels in TR & Dubai" },
    { icon: TrendingUp, label: "3-Year Vision", value: "600+", desc: "Hotels TR & UAE" },
    { icon: Users, label: "B2B Partners", value: "100+", desc: "Agencies & DMCs" }
  ];

  const handleNavigation = (section: 'home' | 'dashboard' | 'about' | 'pricing') => {
    if (section === 'home') {
      window.location.href = '/';
    } else if (section === 'dashboard') {
      window.location.href = '/auth';
    }
  };

  return (
    <TranslationProvider language={language} setLanguage={setLanguage}>
      <div className="min-h-screen overflow-x-hidden relative">
        {/* 3D Background Scene */}
        <div className="fixed inset-0 z-0">
          <Scene3DBackground />
        </div>
        
        {/* Gradient Overlays */}
        <div className="fixed inset-0 z-1">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,53,128,0.3),transparent)] opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,159,227,0.3),transparent)] opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(254,186,2,0.2),transparent)] opacity-70" />
        </div>

        {/* Navbar */}
        <div className="relative z-50">
          <Navbar onNavigate={handleNavigation} />
        </div>

      {/* Hero Section */}
      <motion.section 
        className="relative py-32 px-6 z-10"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
        style={{
          transform: `translateY(${scrollY * 0.1}px)`
        }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div 
            className="text-center mb-20"
            variants={fadeInUp}
          >
            {/* Logo with 3D glassmorphism */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: -30 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 1.2, type: "spring", stiffness: 100 }}
              className="flex items-center justify-center mb-12 group"
            >
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05, rotateY: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Floating glow effects */}
                <div className="absolute -inset-8 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-full blur-3xl opacity-60 group-hover:opacity-100 animate-pulse-glow transition-opacity duration-1000" />
                
                {/* Main glass container */}
                <div className="relative glass rounded-3xl p-8 border border-white/30 shadow-elevated">
                  <img 
                    src={otelciroLogo} 
                    alt="OtelCiro.com" 
                    className="relative h-20 md:h-24 w-auto drop-shadow-2xl filter brightness-110"
                  />
                </div>
                
                {/* Floating particles around logo */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-accent"
                    style={{
                      top: `${20 + Math.sin(i * 45 * Math.PI / 180) * 40}%`,
                      left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 40}%`,
                    }}
                    animate={{
                      scale: [0.5, 1, 0.5],
                      opacity: [0.3, 1, 0.3],
                      y: [0, -10, 0]
                    }}
                    transition={{
                      duration: 3 + i * 0.2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced Headlines */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-8"
            >
              <motion.h1 
                className="text-6xl md:text-8xl lg:text-9xl font-bold leading-tight max-w-6xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.6 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white">
                  OtelCiro
                </span>
                <br />
                <motion.span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-secondary-light to-accent-light text-4xl md:text-5xl lg:text-6xl"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  style={{
                    backgroundSize: '200% 200%'
                  }}
                >
                  Company Profile
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-white to-accent font-semibold">
                  One partner, one ecosystem—revenue, tech, and growth for hotels.
                </span>
              </motion.p>
            </motion.div>

            {/* Interactive Navigation Pills */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-wrap gap-4 justify-center mt-12"
            >
              {[
                { icon: Home, label: 'Back to Home', action: () => window.location.href = '/' },
                { icon: Building2, label: 'Company Info', action: () => document.getElementById('company-info')?.scrollIntoView({ behavior: 'smooth' }) },
                { icon: Target, label: 'Mission & Vision', action: () => document.getElementById('mission-vision')?.scrollIntoView({ behavior: 'smooth' }) },
                { icon: Briefcase, label: 'Services', action: () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }
              ].map((nav, index) => (
                <motion.div
                  key={nav.label}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  <Button
                    onClick={nav.action}
                    className="group glass border border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-6 py-3 rounded-full text-sm backdrop-blur-xl transition-all duration-300"
                  >
                    <nav.icon className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                    {nav.label}
                    <Sparkles className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Enhanced Stats Grid with 3D Effects */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
            variants={staggerChildren}
          >
            {stats.map((stat, index) => (
              <Interactive3DCard key={index} index={index}>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.2,
                      rotateZ: 10,
                      filter: 'drop-shadow(0 0 20px currentColor)'
                    }}
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center relative"
                    style={{
                      background: `linear-gradient(145deg, hsl(var(--primary))/20, hsl(var(--secondary))/20)`,
                      boxShadow: '0 10px 30px hsl(var(--primary))/30'
                    }}
                  >
                    <stat.icon className="h-8 w-8 text-accent" />
                    
                    {/* Rotating ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-accent/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                  
                  <div className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-accent via-white to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="font-semibold text-white mb-2 text-lg">{stat.label}</div>
                  <div className="text-sm text-white/70">{stat.desc}</div>
                </motion.div>
              </Interactive3DCard>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Company Details with Enhanced 3D Design */}
      <section id="company-info" className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-accent to-white mb-4">
              Company Details
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Enhanced Company Info */}
            <Interactive3DCard index={0}>
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center"
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white">Company Information</h3>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <Badge className="mb-3 bg-gradient-to-r from-accent to-accent-light text-black font-semibold px-4 py-1">
                      Legal Entity
                    </Badge>
                    <p className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
                      BOSPHORUS LINE TURİZM ORGANİZASYON EMLAK TAŞIMACILIK İÇ VE DIŞ TİCARET LİMİTED ŞİRKETİ
                    </p>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="group">
                      <Badge className="mb-3 bg-gradient-to-r from-primary to-primary-light text-white font-semibold px-4 py-1">
                        Founded
                      </Badge>
                      <p className="text-white/90 text-sm group-hover:text-white transition-colors">
                        2016 (agency & consultancy)<br/>
                        <span className="text-accent font-semibold">2024 (hotel management focus)</span>
                      </p>
                    </div>
                    <div className="group">
                      <Badge className="mb-3 bg-gradient-to-r from-secondary to-secondary-light text-white font-semibold px-4 py-1">
                        Headquarters
                      </Badge>
                      <p className="text-white/90 text-sm group-hover:text-white transition-colors">Istanbul, Türkiye</p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <div className="space-y-4">
                    {[
                      { icon: Globe, text: "www.otelciro.com", href: "http://www.otelciro.com", color: "text-primary" },
                      { icon: Mail, text: "info@otelciro.com", href: "mailto:info@otelciro.com", color: "text-secondary" },
                      { icon: Phone, text: "+90 501 332 43 00", href: "tel:+905013324300", color: "text-accent" },
                      { icon: MapPin, text: "Türkiye (nationwide) • Dubai expansion (Year 1)", color: "text-white/80" }
                    ].map((contact, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 group cursor-pointer"
                        whileHover={{ x: 10, scale: 1.02 }}
                        onClick={() => contact.href && window.open(contact.href, '_blank')}
                      >
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          className={`p-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 ${contact.color}`}
                        >
                          <contact.icon className="h-4 w-4" />
                        </motion.div>
                        <span className="text-white/90 group-hover:text-white transition-colors text-sm">
                          {contact.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Interactive3DCard>

            {/* Enhanced Mission & Vision */}
            <Interactive3DCard index={1}>
              <div className="space-y-6" id="mission-vision">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-secondary to-accent flex items-center justify-center"
                  >
                    <Target className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white">Mission & Vision</h3>
                </div>

                <div className="space-y-8">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 hover:border-primary/50 transition-all"
                  >
                    <Badge className="mb-4 bg-gradient-to-r from-primary to-primary-light text-white font-semibold px-4 py-2">
                      <Rocket className="mr-2 h-4 w-4" />
                      Mission
                    </Badge>
                    <p className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
                      Transform how independent hotels operate by becoming their end‑to‑end back office for revenue and growth—so on‑property teams can focus on guests while we handle sales, pricing, distribution, marketing, and talent.
                    </p>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group p-6 rounded-2xl bg-gradient-to-r from-secondary/20 to-transparent border border-secondary/30 hover:border-secondary/50 transition-all"
                  >
                    <Badge className="mb-4 bg-gradient-to-r from-secondary to-secondary-light text-white font-semibold px-4 py-2">
                      <Crown className="mr-2 h-4 w-4" />
                      Vision (3–5 years)
                    </Badge>
                    <p className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
                      A unified operating and distribution ecosystem for 600+ properties across Türkiye and the Gulf, delivering measurable RevPAR uplift with lower operational overhead.
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group p-6 rounded-2xl bg-gradient-to-r from-accent/20 to-transparent border border-accent/30 hover:border-accent/50 transition-all"
                  >
                    <Badge className="mb-4 bg-gradient-to-r from-accent to-accent-light text-black font-semibold px-4 py-2">
                      <Diamond className="mr-2 h-4 w-4" />
                      Core Values
                    </Badge>
                    <div className="space-y-3">
                      {[
                        { title: "Ownership", desc: "We act as your sales office and revenue team", icon: Shield, color: "text-primary" },
                        { title: "Clarity", desc: "Data‑driven decisions, transparent reporting", icon: Zap, color: "text-secondary" },
                        { title: "Speed", desc: "Rapid experimentation and market‑responsive strategies", icon: Rocket, color: "text-accent" },
                        { title: "Partnership", desc: "Training, recruitment, and on‑call support", icon: Users, color: "text-white" }
                      ].map((value, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ x: 10, scale: 1.02 }}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group/item"
                        >
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            className={`p-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 ${value.color}`}
                          >
                            <value.icon className="h-4 w-4" />
                          </motion.div>
                          <div className="flex-1">
                            <span className="font-semibold text-white text-sm group-hover/item:text-accent transition-colors">
                              {value.title}:
                            </span>
                            <span className="text-white/80 ml-2 text-sm group-hover/item:text-white transition-colors">
                              {value.desc}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </Interactive3DCard>
          </div>
        </div>
      </section>

      {/* Enhanced Services Section with 3D Cards */}
      <section id="services" className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-accent to-white mb-4">
              Products & Services
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              OtelCiro blends hands‑on consultancy with an integrated hospitality tech stack, taking responsibility for revenue‑critical work.
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mt-6" />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Interactive3DCard key={index} index={index}>
                <motion.div
                  whileHover={{ y: -10 }}
                  className="h-full flex flex-col"
                >
                  {/* Service Icon */}
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center justify-center relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-accent/20 via-transparent to-primary/20"
                    />
                    <Zap className="h-8 w-8 text-accent relative z-10" />
                  </motion.div>

                  {/* Service Title */}
                  <motion.h3 
                    className="text-xl font-bold text-white mb-4 group-hover:text-accent transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    {service.title}
                  </motion.h3>

                  {/* Service Description */}
                  <motion.p 
                    className="text-white/80 leading-relaxed flex-1 group-hover:text-white transition-colors text-sm"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {service.desc}
                  </motion.p>

                  {/* Animated Arrow */}
                  <motion.div
                    className="flex items-center mt-6 text-accent group cursor-pointer"
                    whileHover={{ x: 10 }}
                  >
                    <span className="text-sm font-semibold mr-2">Learn More</span>
                    <ArrowRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </motion.div>

                  {/* Background Glow Effect */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    layoutId={`service-glow-${index}`}
                  />
                </motion.div>
              </Interactive3DCard>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Current Portfolio</h2>
            <p className="text-muted-foreground">~30 hotels managed across Türkiye</p>
          </motion.div>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {hotels.map((hotel, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 transition-all"
                  >
                    <Star className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{hotel}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Business Model & Roadmap */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    Business Model
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/10 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium text-foreground">
                      Hotels that engage our consultancy get access to the OtelCiro ecosystem at no extra software cost. We monetize through consultancy/management services tied to measurable outcomes.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Key Differentiators:</h4>
                    <ul className="space-y-2">
                      {[
                        "All‑in‑One Partner: Your sales office + revenue manager + marketing team",
                        "Outcome‑Linked Model: Consultancy first; platform access included",
                        "Agency Network Advantage: Direct reach to 100+ B2B partners",
                        "SME Focus: Tailored to small/mid‑range hotels"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    Traction & Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-primary/20"></div>
                      {[
                        { phase: "Now", desc: "~30 hotels managed across Türkiye using diverse PMSs and tools", status: "current" },
                        { phase: "Phase 1", desc: "Migrate first 30 hotels into the OtelCiro ecosystem", status: "next" },
                        { phase: "Year 1 Goal", desc: "150 hotels in Türkiye + Dubai launch with 10–15 hotels", status: "future" },
                        { phase: "3-Year Vision", desc: "600+ hotels across Türkiye & UAE", status: "future" }
                      ].map((milestone, index) => (
                        <div key={index} className="relative flex items-start gap-4 pb-6">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 ${
                            milestone.status === 'current' ? 'bg-primary' : 
                            milestone.status === 'next' ? 'bg-accent' : 'bg-muted-foreground/30'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className="font-semibold text-foreground mb-1">{milestone.phase}</h4>
                            <p className="text-sm text-foreground/70">{milestone.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer with 3D Effects */}
      <footer className="py-16 px-6 relative z-10 mt-20">
        <div className="container mx-auto max-w-6xl">
          <Interactive3DCard>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div 
                className="flex items-center justify-center gap-6 mb-8"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-accent/30 via-primary/30 to-secondary/30 rounded-full blur-lg" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-accent to-accent-light flex items-center justify-center">
                    <Award className="h-8 w-8 text-black" />
                  </div>
                </motion.div>
                
                <div>
                  <motion.h3 
                    className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-accent to-white"
                    whileHover={{ scale: 1.1 }}
                  >
                    OtelCiro
                  </motion.h3>
                  <motion.p 
                    className="text-lg text-white/80 mt-2"
                    whileHover={{ color: "rgb(255 255 255)" }}
                  >
                    Transforming hospitality, one hotel at a time
                  </motion.p>
                </div>
              </motion.div>
              
              {/* Floating Contact Elements */}
              <motion.div 
                className="flex flex-wrap justify-center gap-6 mb-8"
                variants={staggerChildren}
                initial="initial"
                whileInView="animate"
              >
                {[
                  { icon: Globe, text: "www.otelciro.com", href: "http://www.otelciro.com" },
                  { icon: Mail, text: "info@otelciro.com", href: "mailto:info@otelciro.com" },
                  { icon: Phone, text: "+90 501 332 43 00", href: "tel:+905013324300" },
                  { icon: MapPin, text: "Istanbul, Türkiye" }
                ].map((contact, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                    onClick={() => contact.href && window.open(contact.href, '_blank')}
                  >
                    <contact.icon className="h-4 w-4 text-accent" />
                    <span className="text-white text-sm">{contact.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Animated Divider */}
              <motion.div
                className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 1 }}
              />
              
              <motion.div 
                className="text-white/60 text-sm"
                whileHover={{ color: "rgb(255 255 255 / 0.8)" }}
              >
                Last updated: 09 Sep 2025 • © 2025 OtelCiro - BOSPHORUS LINE TURİZM LTD. ŞTİ.
              </motion.div>

              {/* Back to Top Button */}
              <motion.div
                className="mt-8"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="group bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-white px-6 py-3 rounded-full border-0"
                >
                  <ArrowRight className="mr-2 h-4 w-4 rotate-[-90deg] group-hover:translate-y-[-2px] transition-transform" />
                  Back to Top
                  <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-180 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          </Interactive3DCard>
        </div>
      </footer>
    </div>
    </TranslationProvider>
  );
};