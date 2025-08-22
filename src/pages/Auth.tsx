import { useState } from "react";
import { EnhancedRoleSelector } from "@/components/auth/EnhancedRoleSelector";
import { EnhancedAuth } from "@/components/auth/EnhancedAuth";
import { TranslationProvider, Language } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [role, setRole] = useState<'hotel_manager' | 'travel_agency' | 'admin' | 'social_media' | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const navigate = useNavigate();

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
    <TranslationProvider language={language} setLanguage={setLanguage}>
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
    </TranslationProvider>
  );
};

export default Auth;