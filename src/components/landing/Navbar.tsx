import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/auth/LanguageSwitcher";
import otelciroLogo from "@/assets/otelciro-logo.png";

interface NavbarProps {
  onNavigate: (section: 'home' | 'dashboard' | 'about' | 'pricing') => void;
}

export const Navbar = ({ onNavigate }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (section: 'home' | 'dashboard' | 'about' | 'pricing') => {
    if (section === 'home') {
      scrollToTop();
    } else if (section === 'dashboard') {
      window.location.href = '/auth';
    } else {
      onNavigate(section);
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavigation('home')}
          >
            <img src={otelciroLogo} alt="OtelCiro" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">OtelCiro</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Button
              variant="ghost"
              onClick={() => handleNavigation('home')}
              className="hover:text-primary"
            >
              {t('navbar.home')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleNavigation('dashboard')}
              className="hover:text-primary"
            >
              {t('navbar.dashboard')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleNavigation('about')}
              className="hover:text-primary"
            >
              {t('navbar.aboutUs')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleNavigation('pricing')}
              className="hover:text-primary"
            >
              {t('navbar.pricing')}
            </Button>
          </div>

          {/* Language Switcher & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-border"
          >
            <div className="flex flex-col space-y-4 pt-4">
              <Button
                variant="ghost"
                onClick={() => handleNavigation('home')}
                className="justify-start hover:text-primary"
              >
                {t('navbar.home')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation('dashboard')}
                className="justify-start hover:text-primary"
              >
                {t('navbar.dashboard')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation('about')}
                className="justify-start hover:text-primary"
              >
                {t('navbar.aboutUs')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation('pricing')}
                className="justify-start hover:text-primary"
              >
                {t('navbar.pricing')}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};