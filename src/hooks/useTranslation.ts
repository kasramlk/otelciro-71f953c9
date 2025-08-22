import { useState, createContext, useContext } from 'react';

export type Language = 'en' | 'tr';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Common
    'common.email': 'Email',
    'common.password': 'Password',
    'common.fullName': 'Full Name',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.back': 'Back',
    'common.continue': 'Continue',
    'common.getStarted': 'Get Started',
    'common.signIn': 'Sign In',
    'common.signUp': 'Sign Up',
    'common.createAccount': 'Create Account',
    'common.changeRole': 'Change Role',
    
    // Auth Page
    'auth.title': 'Welcome to OtelCiro',
    'auth.subtitle': 'AI-Powered Hospitality Ecosystem',
    'auth.description': 'Transform your hotel operations with intelligent automation',
    'auth.selectRole': 'Select your role to access the appropriate dashboard',
    'auth.signingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.fillAllFields': 'Please fill in all fields',
    'auth.checkEmail': 'Please check your email to confirm your account',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.continueWithFacebook': 'Continue with Facebook',
    'auth.continueWithLinkedIn': 'Continue with LinkedIn',
    'auth.orContinueWithEmail': 'Or continue with email',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.forgotPassword': 'Forgot your password?',
    
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
    'common.email': 'E-posta',
    'common.password': 'Şifre',
    'common.fullName': 'Ad Soyad',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.back': 'Geri',
    'common.continue': 'Devam Et',
    'common.getStarted': 'Başlayın',
    'common.signIn': 'Giriş Yap',
    'common.signUp': 'Kaydol',
    'common.createAccount': 'Hesap Oluştur',
    'common.changeRole': 'Rol Değiştir',
    
    // Auth Page
    'auth.title': "OtelCiro'ya Hoş Geldiniz",
    'auth.subtitle': 'AI-Destekli Konaklama Ekosistemi',
    'auth.description': 'Otel operasyonlarınızı akıllı otomasyon ile dönüştürün',
    'auth.selectRole': 'Uygun panele erişmek için rolünüzü seçin',
    'auth.signingIn': 'Giriş yapılıyor...',
    'auth.creatingAccount': 'Hesap oluşturuluyor...',
    'auth.fillAllFields': 'Lütfen tüm alanları doldurun',
    'auth.checkEmail': 'Hesabınızı onaylamak için lütfen e-postanızı kontrol edin',
    'auth.continueWithGoogle': 'Google ile devam et',
    'auth.continueWithFacebook': 'Facebook ile devam et',
    'auth.continueWithLinkedIn': 'LinkedIn ile devam et',
    'auth.orContinueWithEmail': 'Veya e-posta ile devam et',
    'auth.alreadyHaveAccount': 'Zaten hesabınız var mı?',
    'auth.dontHaveAccount': 'Hesabınız yok mu?',
    'auth.forgotPassword': 'Şifrenizi mi unuttunuz?',
    
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

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    // Fallback hook when used outside provider
    const [language, setLanguage] = useState<Language>('en');
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
    return { language, setLanguage, t };
  }
  return context;
};

export { TranslationContext, translations };