import { useState, createContext, useContext, ReactNode } from 'react';

export type Language = 'en' | 'tr';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Common
    'common': {
      'email': 'Email',
      'password': 'Password',
      'fullName': 'Full Name',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'back': 'Back',
      'continue': 'Continue',
      'getStarted': 'Get Started',
      'signIn': 'Sign In',
      'signUp': 'Sign Up',
      'createAccount': 'Create Account',
      'changeRole': 'Change Role'
    },
    
    // Auth Page
    'auth': {
      'title': 'Welcome to OtelCiro',
      'subtitle': 'AI-Powered Hospitality Ecosystem',
      'description': 'Transform your hotel operations with intelligent automation',
      'selectRole': 'Select your role to access the appropriate dashboard',
      'signingIn': 'Signing in...',
      'creatingAccount': 'Creating account...',
      'fillAllFields': 'Please fill in all fields',
      'checkEmail': 'Please check your email to confirm your account',
      'continueWithGoogle': 'Continue with Google',
      'continueWithFacebook': 'Continue with Facebook',
      'continueWithLinkedIn': 'Continue with LinkedIn',
      'orContinueWithEmail': 'Or continue with email',
      'alreadyHaveAccount': 'Already have an account?',
      'dontHaveAccount': "Don't have an account?",
      'forgotPassword': 'Forgot your password?'
    },
    
    // Role Selector
    'roles': {
      'hotel_manager': {
        'title': 'Hotel Manager',
        'description': 'Manage your property, reservations, and operations',
        'portal': 'Hotel Manager Portal',
        'access': 'Access your Property Management System',
        'features': {
          '0': 'Smart Revenue Optimization',
          '1': 'Predictive Analytics Dashboard',
          '2': 'Automated Guest Preferences',
          '3': 'Real-time Demand Forecasting'
        }
      },
      'travel_agency': {
        'title': 'Travel Agency',
        'description': 'Search, book and manage hotel inventory',
        'portal': 'Travel Agency Portal',
        'access': 'Search and book hotel inventory',
        'features': {
          '0': 'Mini-GDS Search Engine',
          '1': 'Real-time Booking System',
          '2': 'Negotiated Rate Management',
          '3': 'Commission Tracking'
        }
      },
      'admin': {
        'title': 'System Admin',
        'description': 'Manage platform users and global settings',
        'portal': 'System Admin Portal',
        'access': 'Manage platform users and settings',
        'features': {
          '0': 'User Management Dashboard',
          '1': 'Global Platform Settings',
          '2': 'Advanced Analytics',
          '3': 'System Monitoring'
        }
      },
      'social_media': {
        'title': 'Social Media Kit',
        'description': 'AI-powered social media management platform',
        'portal': 'Social Media Kit Platform',
        'access': 'AI-powered social media management',
        'features': {
          '0': 'AI Content Generation',
          '1': 'Social Calendar Management',
          '2': 'Auto-Publishing System',
          '3': 'Analytics & ROI Tracking'
        },
        'badge': 'NEW'
      }
    },
    
    // Form Labels
    'form': {
      'hotelName': 'Hotel/Organization Name',
      'agencyName': 'Agency Name',
      'selectRole': 'Select your role'
    },
    
    // Platform Features
    'platform': {
      'multiTenant': 'Multi-tenant SaaS',
      'realTimeARI': 'Real-time ARI',
      'aiPowered': 'AI-powered',
      'trustedBy': 'Trusted by leading hotel chains worldwide'
    }
  },
  tr: {
    // Common
    'common': {
      'email': 'E-posta',
      'password': 'Şifre',
      'fullName': 'Ad Soyad',
      'loading': 'Yükleniyor...',
      'error': 'Hata',
      'success': 'Başarılı',
      'back': 'Geri',
      'continue': 'Devam Et',
      'getStarted': 'Başlayın',
      'signIn': 'Giriş Yap',
      'signUp': 'Kaydol',
      'createAccount': 'Hesap Oluştur',
      'changeRole': 'Rol Değiştir'
    },
    
    // Auth Page
    'auth': {
      'title': "OtelCiro'ya Hoş Geldiniz",
      'subtitle': 'AI-Destekli Konaklama Ekosistemi',
      'description': 'Otel operasyonlarınızı akıllı otomasyon ile dönüştürün',
      'selectRole': 'Uygun panele erişmek için rolünüzü seçin',
      'signingIn': 'Giriş yapılıyor...',
      'creatingAccount': 'Hesap oluşturuluyor...',
      'fillAllFields': 'Lütfen tüm alanları doldurun',
      'checkEmail': 'Hesabınızı onaylamak için lütfen e-postanızı kontrol edin',
      'continueWithGoogle': 'Google ile devam et',
      'continueWithFacebook': 'Facebook ile devam et',
      'continueWithLinkedIn': 'LinkedIn ile devam et',
      'orContinueWithEmail': 'Veya e-posta ile devam et',
      'alreadyHaveAccount': 'Zaten hesabınız var mı?',
      'dontHaveAccount': 'Hesabınız yok mu?',
      'forgotPassword': 'Şifrenizi mi unuttunuz?'
    },
    
    // Role Selector
    'roles': {
      'hotel_manager': {
        'title': 'Otel Müdürü',
        'description': 'Oteli, rezervasyonları ve operasyonları yönetin',
        'portal': 'Otel Müdürü Paneli',
        'access': 'Mülk Yönetim Sisteminize erişin',
        'features': {
          '0': 'Akıllı Gelir Optimizasyonu',
          '1': 'Tahmine Dayalı Analitik Panosu',
          '2': 'Otomatik Misafir Tercihleri',
          '3': 'Gerçek Zamanlı Talep Tahmini'
        }
      },
      'travel_agency': {
        'title': 'Seyahat Acentesi',
        'description': 'Otel envanterini arayın, rezerve edin ve yönetin',
        'portal': 'Seyahat Acentesi Paneli',
        'access': 'Otel envanterini arayın ve rezerve edin',
        'features': {
          '0': 'Mini-GDS Arama Motoru',
          '1': 'Gerçek Zamanlı Rezervasyon Sistemi',
          '2': 'Müzakere Edilmiş Fiyat Yönetimi',
          '3': 'Komisyon Takibi'
        }
      },
      'admin': {
        'title': 'Sistem Yöneticisi',
        'description': 'Platform kullanıcılarını ve genel ayarları yönetin',
        'portal': 'Sistem Yöneticisi Paneli',
        'access': 'Platform kullanıcılarını ve ayarları yönetin',
        'features': {
          '0': 'Kullanıcı Yönetim Panosu',
          '1': 'Genel Platform Ayarları',
          '2': 'Gelişmiş Analitik',
          '3': 'Sistem İzleme'
        }
      },
      'social_media': {
        'title': 'Sosyal Medya Kiti',
        'description': 'AI-destekli sosyal medya yönetim platformu',
        'portal': 'Sosyal Medya Kit Platformu',
        'access': 'AI-destekli sosyal medya yönetimi',
        'features': {
          '0': 'AI İçerik Üretimi',
          '1': 'Sosyal Takvim Yönetimi',
          '2': 'Otomatik Yayınlama Sistemi',
          '3': 'Analitik & ROI Takibi'
        },
        'badge': 'YENİ'
      }
    },
    
    // Form Labels
    'form': {
      'hotelName': 'Otel/Organizasyon Adı',
      'agencyName': 'Acente Adı',
      'selectRole': 'Rolünüzü seçin'
    },
    
    // Platform Features
    'platform': {
      'multiTenant': 'Çok Kiracılı SaaS',
      'realTimeARI': 'Gerçek Zamanlı ARI',
      'aiPowered': 'AI-destekli',
      'trustedBy': 'Önde gelen otel zincirlerinin güvendiği platform'
    }
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children, language, setLanguage }: { 
  children: ReactNode; 
  language: Language; 
  setLanguage: (lang: Language) => void; 
}) => {
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

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export { TranslationContext, translations };