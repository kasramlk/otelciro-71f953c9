import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import otelciroLogo from "@/assets/otelciro-logo.png";
import { 
  Building2, 
  Plane, 
  Shield, 
  Megaphone,
  Globe,
  Calendar,
  TrendingUp,
  Brain,
  BarChart3,
  Users,
  Target,
  Zap,
  Home,
  ArrowLeft
} from "lucide-react";

interface EnhancedRoleSelectorProps {
  onRoleSelect: (role: 'hotel_manager' | 'travel_agency' | 'admin' | 'social_media') => void;
  onBackToHome?: () => void;
}

const roleIcons = {
  hotel_manager: Building2,
  travel_agency: Plane,
  admin: Shield,
  social_media: Megaphone
};

const roleGradients = {
  hotel_manager: 'from-primary to-primary-light',
  travel_agency: 'from-secondary to-secondary-light', 
  admin: 'from-purple-500 to-purple-400',
  social_media: 'from-accent to-accent-light'
};

const roleBorders = {
  hotel_manager: 'border-primary/30 hover:border-primary/50',
  travel_agency: 'border-secondary/30 hover:border-secondary/50',
  admin: 'border-purple-400/30 hover:border-purple-400/50',
  social_media: 'border-accent/30 hover:border-accent/50'
};

export const EnhancedRoleSelector = ({ onRoleSelect, onBackToHome }: EnhancedRoleSelectorProps) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { t } = useTranslation();

  const roles = [
    'hotel_manager',
    'travel_agency', 
    'admin',
    'social_media'
  ] as const;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setTimeout(() => {
      onRoleSelect(roleId as any);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-glow/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <LanguageSwitcher />

      {/* Back to Home Button */}
      {onBackToHome && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed top-6 left-6 z-50"
        >
          <Button
            variant="outline"
            onClick={onBackToHome}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <Home className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </motion.div>
      )}

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex items-center justify-center mb-10"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-accent-light/30 blur-xl rounded-full animate-pulse-glow" />
                <img 
                  src={otelciroLogo} 
                  alt="OtelCiro.com" 
                  className="relative h-28 md:h-36 w-auto drop-shadow-2xl filter brightness-110 hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>

            {/* Headlines */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                {t('auth.title')}
              </h1>
              <h2 className="text-2xl md:text-3xl text-accent font-semibold">
                {t('auth.subtitle')}
              </h2>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                {t('auth.description')}
              </p>
            </motion.div>

            {/* Platform Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-8 mt-8 text-white/80"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                <span>{t('platform.multiTenant')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                <span>{t('platform.realTimeARI')}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span>{t('platform.aiPowered')}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Role Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"
          >
            {roles.map((role, index) => {
              const Icon = roleIcons[role];
              const isSelected = selectedRole === role;
              
              return (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected ? 'scale-105' : ''
                  }`}
                >
                  <Card 
                    className={`glass h-full border-2 transition-all duration-500 hover:shadow-2xl backdrop-blur-sm bg-white/10 ${
                      isSelected 
                        ? 'border-accent shadow-2xl shadow-accent/25' 
                        : `${roleBorders[role]} shadow-lg`
                    }`}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <CardHeader className="text-center relative">
                      {/* Badge for new features */}
                      {role === 'social_media' && (
                        <Badge className="absolute -top-2 -right-2 bg-accent text-primary font-bold animate-pulse">
                          {t('roles.social_media.badge')}
                        </Badge>
                      )}
                      
                      {/* Icon */}
                      <div className={`mx-auto w-18 h-18 rounded-2xl bg-gradient-to-r ${roleGradients[role]} flex items-center justify-center mb-6 shadow-lg`}>
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      
                      <CardTitle className="text-2xl text-white mb-3">
                        {t(`roles.${role}.title`)}
                      </CardTitle>
                      <CardDescription className="text-white/80 text-base leading-relaxed">
                        {t(`roles.${role}.description`)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* AI Features */}
                      <div className="space-y-3">
                        {[0, 1, 2, 3].map((featureIndex) => (
                          <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 1 + index * 0.1 + featureIndex * 0.05 }}
                            className="flex items-center gap-3 text-white/90 group"
                          >
                            {featureIndex === 0 && <Brain className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />}
                            {featureIndex === 1 && <BarChart3 className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />}
                            {featureIndex === 2 && <Users className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />}
                            {featureIndex === 3 && <Zap className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />}
                            <span className="text-sm font-medium">
                              {t(`roles.${role}.features.${featureIndex}`)}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <Button 
                        className={`w-full bg-gradient-to-r ${roleGradients[role]} hover:shadow-xl transition-all duration-300 group border-0 text-white font-semibold py-3`}
                        disabled={isSelected}
                      >
                        {isSelected ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <Target className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                            {t(`roles.${role}.title`)}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Bottom Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="text-center"
          >
            <p className="text-white/70 text-lg">
              {t('auth.selectRole')}
            </p>
            <p className="text-white/50 text-sm mt-2">
              {t('platform.trustedBy')}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};