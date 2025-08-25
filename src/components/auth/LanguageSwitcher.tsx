import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe } from "lucide-react";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-50"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLanguage}
        className="bg-background/80 backdrop-blur-sm border-border hover:bg-accent/10 transition-all duration-300 group"
      >
        <Globe className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
        <span className="font-semibold">
          {language === 'en' ? 'TR' : 'EN'}
        </span>
      </Button>
    </motion.div>
  );
};