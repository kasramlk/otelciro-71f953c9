import { useState } from "react";
import { EnhancedRoleSelector } from "@/components/auth/EnhancedRoleSelector";
import { EnhancedAuth } from "@/components/auth/EnhancedAuth";
import { TranslationContext, translations, Language } from "@/hooks/useTranslation";

const Auth = () => {
  const [role, setRole] = useState<'hotel_manager' | 'travel_agency' | 'admin' | 'social_media' | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const handleRoleSelect = (selectedRole: 'hotel_manager' | 'travel_agency' | 'admin' | 'social_media') => {
    setRole(selectedRole);
  };

  const handleBackToRoleSelector = () => {
    setRole(null);
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {role ? (
        <EnhancedAuth 
          role={role} 
          onBackToRoleSelector={handleBackToRoleSelector} 
        />
      ) : (
        <EnhancedRoleSelector onRoleSelect={handleRoleSelect} />
      )}
    </TranslationContext.Provider>
  );
};

export default Auth;