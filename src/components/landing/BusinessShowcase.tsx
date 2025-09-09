import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Target, 
  Map, 
  PlayCircle, 
  Hotel, 
  Link, 
  Globe, 
  Smartphone,
  CheckCircle,
  Users,
  TrendingUp,
  Clock
} from "lucide-react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTranslation } from "@/hooks/useTranslation";

export const BusinessShowcase = () => {
  const { t } = useTranslation();
  const { ref: whatWeDoRef, isIntersecting: whatWeDoVisible } = useIntersectionObserver({ threshold: 0.2 });
  const { ref: howWeWorkRef, isIntersecting: howWeWorkVisible } = useIntersectionObserver({ threshold: 0.2 });
  const { ref: ecosystemRef, isIntersecting: ecosystemVisible } = useIntersectionObserver({ threshold: 0.2 });
  const { ref: whyChooseRef, isIntersecting: whyChooseVisible } = useIntersectionObserver({ threshold: 0.2 });

  const workSteps = [
    {
      icon: Search,
      title: t('landing.howWeWork.step1Title'),
      description: t('landing.howWeWork.step1Description'),
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: Target,
      title: t('landing.howWeWork.step2Title'),
      description: t('landing.howWeWork.step2Description'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Map,
      title: t('landing.howWeWork.step3Title'),
      description: t('landing.howWeWork.step3Description'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: PlayCircle,
      title: t('landing.howWeWork.step4Title'),
      description: t('landing.howWeWork.step4Description'),
      color: 'from-purple-500 to-violet-500'
    }
  ];

  const ecosystemTools = [
    {
      icon: Hotel,
      title: t('landing.ecosystem.pms'),
      color: 'from-primary to-primary-light'
    },
    {
      icon: Globe,
      title: t('landing.ecosystem.miniGDS'),
      color: 'from-secondary to-secondary-light'
    },
    {
      icon: Link,
      title: t('landing.ecosystem.channelManager'),
      color: 'from-blue-500 to-blue-400'
    },
    {
      icon: Smartphone,
      title: t('landing.ecosystem.socialKit'),
      color: 'from-accent to-accent-light'
    }
  ];

  const whyChooseItems = [
    {
      icon: Clock,
      text: t('landing.whyChooseUs.experience')
    },
    {
      icon: TrendingUp,
      text: t('landing.whyChooseUs.datadriven')
    },
    {
      icon: Globe,
      text: t('landing.whyChooseUs.coverage')
    },
    {
      icon: Users,
      text: t('landing.whyChooseUs.noStaff')
    },
    {
      icon: CheckCircle,
      text: t('landing.whyChooseUs.results')
    }
  ];

  return (
    <div className="space-y-20">
      {/* What We Do Section */}
      <section ref={whatWeDoRef} id="products" className="py-20 bg-gradient-to-br from-background to-primary/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={whatWeDoVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t('landing.whatWeDo.title')}
            </h2>
            <p className="text-xl text-primary font-semibold mb-4">
              {t('landing.whatWeDo.subtitle')}
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              {t('landing.whatWeDo.description')}
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              {[
                t('landing.whatWeDo.benefit1'),
                t('landing.whatWeDo.benefit2'),
                t('landing.whatWeDo.benefit3')
              ].map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={whatWeDoVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg"
                >
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-green-800 font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whatWeDoVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl max-w-4xl mx-auto"
            >
              <p className="text-lg font-semibold text-foreground">
                {t('landing.whatWeDo.positioning')}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How We Work Section */}
      <section ref={howWeWorkRef} className="py-20 bg-gradient-to-br from-secondary/5 to-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={howWeWorkVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t('landing.howWeWork.title')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={howWeWorkVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-sm font-bold text-muted-foreground mb-2">
                        {t('common.step')} {index + 1}
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-center leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Ecosystem Section */}
      <section ref={ecosystemRef} className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={ecosystemVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t('landing.ecosystem.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {t('landing.ecosystem.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {ecosystemTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={`ecosystem-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={ecosystemVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${tool.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <p className="font-semibold text-foreground leading-relaxed">
                        {tool.title}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ecosystemVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <Badge className="bg-gradient-to-r from-green-500 to-green-400 text-white px-6 py-2 text-lg">
              {t('landing.ecosystem.note')}
            </Badge>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section ref={whyChooseRef} className="py-20 bg-gradient-to-br from-background to-secondary/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={whyChooseVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t('landing.whyChooseUs.title')}
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {whyChooseItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -50 }}
                  animate={whyChooseVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-lg font-medium text-foreground">
                          {item.text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};