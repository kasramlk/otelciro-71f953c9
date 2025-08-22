import { useState } from "react";
import { EnhancedRoleSelector } from "@/components/auth/EnhancedRoleSelector";
import { EnhancedAuth } from "@/components/auth/EnhancedAuth";
import { TranslationContext, translations, Language } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [role, setRole] = useState<'hotel_manager' | 'travel_agency' | 'admin' | 'social_media' | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const navigate = useNavigate();

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const handleRoleSelect = (selectedRole: 'hotel_manager' | 'travel_agency' | 'admin' | 'social_media') => {
    setRole(selectedRole);
  };

  const handleBackToRoleSelector = () => {
    setRole(null);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {role ? (
        <EnhancedAuth 
          role={role} 
          onBackToRoleSelector={handleBackToRoleSelector}
          onBackToHome={handleBackToHome}
        />
      ) : (
        <EnhancedRoleSelector 
          onRoleSelect={handleRoleSelect}
          onBackToHome={handleBackToHome}
        />
      )}
    </TranslationContext.Provider>
  );
};

export default Auth;