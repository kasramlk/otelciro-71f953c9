import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ArrowRight
} from "lucide-react";
import otelciroLogo from "@/assets/otelciro-logo.png";

export const CompanyProfile = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-6"
        initial="initial"
        animate="animate"
        variants={staggerChildren}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <div className="flex items-center justify-center mb-8">
              <img src={otelciroLogo} alt="OtelCiro" className="h-16 w-auto mr-4" />
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  OtelCiro
                </h1>
                <p className="text-xl text-muted-foreground mt-2">
                  One partner, one ecosystem—revenue, tech, and growth for hotels.
                </p>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-foreground/80 leading-relaxed">
                OtelCiro is an Istanbul‑based hospitality consultancy and technology company helping small and mid‑size hotels grow revenue and reduce costs. Since 2016 we have operated as an agency & consultancy; since 2024 we've focused on hotel management and online sales.
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
            variants={staggerChildren}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <stat.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                    <div className="font-semibold text-foreground mb-1">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.desc}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Company Details */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">Legal Entity</Badge>
                      <p className="text-sm text-foreground/80">BOSPHORUS LINE TURİZM ORGANİZASYON EMLAK TAŞIMACILIK İÇ VE DIŞ TİCARET LİMİTED ŞİRKETİ</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Badge variant="outline" className="mb-2">Founded</Badge>
                        <p className="text-sm">2016 (agency & consultancy)<br/>2024 (hotel management focus)</p>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">Headquarters</Badge>
                        <p className="text-sm">Istanbul, Türkiye</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <a href="http://www.otelciro.com" target="_blank" rel="noopener noreferrer" 
                           className="text-primary hover:underline">www.otelciro.com</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <a href="mailto:info@otelciro.com" className="text-primary hover:underline">info@otelciro.com</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>+90 501 332 43 00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>Türkiye (nationwide) • Dubai expansion (Year 1)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mission & Vision */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-primary" />
                    Mission & Vision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Badge variant="secondary" className="mb-3">Mission</Badge>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Transform how independent hotels operate by becoming their end‑to‑end back office for revenue and growth—so on‑property teams can focus on guests while we handle sales, pricing, distribution, marketing, and talent.
                    </p>
                  </div>
                  
                  <div>
                    <Badge variant="secondary" className="mb-3">Vision (3–5 years)</Badge>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      A unified operating and distribution ecosystem for 600+ properties across Türkiye and the Gulf, delivering measurable RevPAR uplift with lower operational overhead.
                    </p>
                  </div>

                  <div>
                    <Badge variant="secondary" className="mb-3">Core Values</Badge>
                    <div className="space-y-2">
                      {[
                        { title: "Ownership", desc: "We act as your sales office and revenue team" },
                        { title: "Clarity", desc: "Data‑driven decisions, transparent reporting" },
                        { title: "Speed", desc: "Rapid experimentation and market‑responsive strategies" },
                        { title: "Partnership", desc: "Training, recruitment, and on‑call support" }
                      ].map((value, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-sm">{value.title}:</span>
                            <span className="text-sm text-foreground/70 ml-1">{value.desc}</span>
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

      {/* Services Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Products & Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              OtelCiro blends hands‑on consultancy with an integrated hospitality tech stack, taking responsibility for revenue‑critical work.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/70">{service.desc}</p>
                    <ArrowRight className="h-4 w-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </motion.div>
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

      {/* Footer */}
      <footer className="py-12 px-6 bg-foreground text-background">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-2xl font-bold">OtelCiro</h3>
                <p className="text-sm opacity-80">Transforming hospitality, one hotel at a time</p>
              </div>
            </div>
            <div className="text-sm opacity-60">
              Last updated: 09 Sep 2025 • © 2025 OtelCiro - BOSPHORUS LINE TURİZM LTD. ŞTİ.
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};