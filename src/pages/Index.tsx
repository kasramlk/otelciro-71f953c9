import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/landing/HeroSection";
import { BusinessShowcase } from "@/components/landing/BusinessShowcase";
import { Tools3DShowcase } from "@/components/landing/Tools3DShowcase";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { AboutSection } from "@/components/landing/AboutSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TranslationProvider, Language } from "@/hooks/useTranslation";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Cloud, Key, TestTube, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState<Language>('en');
  const [systemStatus, setSystemStatus] = useState({
    database: 'checking',
    edgeFunctions: 'checking',
    apiCredentials: 'checking'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Test system components automatically
  useEffect(() => {
    const testSystemComponents = async () => {
      // Test basic database connectivity
      try {
        const { data, error } = await supabase
          .from('hotels')
          .select('count', { count: 'exact', head: true });
        
        setSystemStatus(prev => ({ 
          ...prev, 
          database: error ? 'error' : 'success' 
        }));
      } catch (error) {
        setSystemStatus(prev => ({ 
          ...prev, 
          database: 'error' 
        }));
      }

      // Edge functions and API credentials not needed anymore
      setSystemStatus(prev => ({ 
        ...prev, 
        edgeFunctions: 'success',
        apiCredentials: 'success' 
      }));
    };

    testSystemComponents();
  }, []);

  const handleExploreClick = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavigation = (section: 'home' | 'dashboard' | 'about' | 'pricing') => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return 'Testing...';
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Hotel Management System</h1>
                <p className="text-muted-foreground">Welcome back, {user.email}</p>
              </div>
              <TabsList className="grid w-fit grid-cols-1">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              </TabsList>
            </div>


            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hotel Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Navigate to your main dashboard for hotel operations.
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <TranslationProvider language={language} setLanguage={setLanguage}>
      <SmoothScroll>
        <div className="min-h-screen">
          <Navbar onNavigate={handleNavigation} />
          <div id="home">
            <HeroSection onExploreClick={handleExploreClick} />
          </div>
          <BusinessShowcase />
          <Tools3DShowcase />
          <AboutSection />
          <PricingSection />
          <CTASection />
          <Footer />
        </div>
      </SmoothScroll>
    </TranslationProvider>
  );
};

export default Index;