import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import otelciroLogo from "@/assets/otelciro-logo.png";
import { 
  Facebook, 
  Linkedin, 
  Mail, 
  ArrowLeft,
  Sparkles,
  Shield,
  Globe,
  Eye,
  EyeOff
} from "lucide-react";

interface EnhancedAuthProps {
  role: 'hotel_manager' | 'travel_agency' | 'admin' | 'social_media';
  onBackToRoleSelector: () => void;
}

export const EnhancedAuth = ({ role, onBackToRoleSelector }: EnhancedAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const userRole = session.user.user_metadata?.role || role;
        if (userRole === 'travel_agency') {
          navigate("/agency");
        } else if (userRole === 'admin') {
          navigate("/admin");
        } else if (userRole === 'social_media') {
          navigate("/social-media");
        } else {
          navigate("/dashboard");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, role]);

  const signUp = async () => {
    if (!email || !password || !name || !orgName) {
      toast({
        title: t('common.error'),
        description: t('auth.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
            org_name: orgName,
            role: role,
            first_name: name.split(' ')[0] || '',
            last_name: name.split(' ').slice(1).join(' ') || ''
          }
        }
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('auth.checkEmail'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    if (!email || !password) {
      toast({
        title: t('common.error'),
        description: t('auth.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithSocial = async (provider: 'google' | 'facebook' | 'linkedin_oidc') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            role: role
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleGradient = () => {
    switch (role) {
      case 'hotel_manager': return 'from-primary to-primary-light';
      case 'travel_agency': return 'from-secondary to-secondary-light';
      case 'admin': return 'from-purple-500 to-purple-400';
      case 'social_media': return 'from-accent to-accent-light';
      default: return 'from-primary to-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <LanguageSwitcher />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <Button 
              variant="ghost" 
              onClick={onBackToRoleSelector}
              className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.changeRole')}
            </Button>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <Card className="glass backdrop-blur-md bg-white/10 border-white/20 shadow-2xl">
              <CardHeader className="text-center space-y-6 pb-8">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex justify-center"
                >
                  <img 
                    src={otelciroLogo} 
                    alt="OtelCiro.com" 
                    className="h-12 w-auto drop-shadow-lg"
                  />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="space-y-2"
                >
                  <CardTitle className="text-2xl font-bold text-white">
                    {t(`roles.${role}.portal`)}
                  </CardTitle>
                  <CardDescription className="text-white/80 text-base">
                    {t(`roles.${role}.access`)}
                  </CardDescription>
                </motion.div>

                {/* Role Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getRoleGradient()} text-white text-sm font-medium shadow-lg`}
                >
                  <Sparkles className="h-4 w-4" />
                  {t(`roles.${role}.title`)}
                  {role === 'social_media' && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {t('roles.socialMedia.badge')}
                    </span>
                  )}
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-sm">
                      <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/20">
                        {t('common.signIn')}
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">
                        {t('common.signUp')}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="signin" className="space-y-6 mt-6">
                      {/* Social Login Buttons */}
                      {role === 'hotel_manager' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 1 }}
                          className="space-y-3"
                        >
                          <Button
                            variant="outline"
                            onClick={() => signInWithSocial('google')}
                            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            disabled={loading}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {t('auth.continueWithGoogle')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => signInWithSocial('facebook')}
                            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            disabled={loading}
                          >
                            <Facebook className="w-4 h-4 mr-2" />
                            {t('auth.continueWithFacebook')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => signInWithSocial('linkedin_oidc')}
                            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            disabled={loading}
                          >
                            <Linkedin className="w-4 h-4 mr-2" />
                            {t('auth.continueWithLinkedIn')}
                          </Button>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <Separator className="w-full border-white/20" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-transparent px-2 text-white/70">
                                {t('auth.orContinueWithEmail')}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Email/Password Form */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                        className="space-y-4"
                      >
                        <Input
                          type="email"
                          placeholder={t('common.email')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm"
                        />
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('common.password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-white/60" />
                            ) : (
                              <Eye className="h-4 w-4 text-white/60" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.4 }}
                      >
                        <Button 
                          onClick={signIn} 
                          className={`w-full bg-gradient-to-r ${getRoleGradient()} hover:shadow-xl transition-all duration-300 border-0 text-white font-semibold py-3`}
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t('auth.signingIn')}
                            </div>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              {t('common.signIn')}
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </TabsContent>
                    
                    <TabsContent value="signup" className="space-y-4 mt-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1 }}
                        className="space-y-4"
                      >
                        <Input
                          type="text"
                          placeholder={t('common.fullName')}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm"
                        />
                        <Input
                          type="text"
                          placeholder={role === 'travel_agency' ? t('form.agencyName') : t('form.hotelName')}
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm"
                        />
                        <Input
                          type="email"
                          placeholder={t('common.email')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm"
                        />
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('common.password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-white/60" />
                            ) : (
                              <Eye className="h-4 w-4 text-white/60" />
                            )}
                          </Button>
                        </div>
                        
                        <Select value={role} disabled>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder={t('form.selectRole')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hotel_manager">{t('roles.hotelManager.title')}</SelectItem>
                            <SelectItem value="travel_agency">{t('roles.travelAgency.title')}</SelectItem>
                            <SelectItem value="admin">{t('roles.admin.title')}</SelectItem>
                            <SelectItem value="social_media">{t('roles.socialMedia.title')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                      >
                        <Button 
                          onClick={signUp} 
                          className={`w-full bg-gradient-to-r ${getRoleGradient()} hover:shadow-xl transition-all duration-300 border-0 text-white font-semibold py-3`}
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t('auth.creatingAccount')}
                            </div>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              {t('common.createAccount')}
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </motion.div>

                {/* Security Notice */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                  className="flex items-center justify-center gap-2 text-white/60 text-xs"
                >
                  <Globe className="h-3 w-3" />
                  <span>Secured with enterprise-grade encryption</span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};