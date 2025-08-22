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
    'roles.hotelManager.title': 'Hotel Manager',
    'roles.hotelManager.description': 'Manage your property, reservations, and operations',
    'roles.hotelManager.portal': 'Hotel Manager Portal',
    'roles.hotelManager.access': 'Access your Property Management System',
    'roles.hotelManager.features.0': 'Smart Revenue Optimization',
    'roles.hotelManager.features.1': 'Predictive Analytics Dashboard',
    'roles.hotelManager.features.2': 'Automated Guest Preferences',
    'roles.hotelManager.features.3': 'Real-time Demand Forecasting',
    
    'roles.travelAgency.title': 'Travel Agency', 
    'roles.travelAgency.description': 'Search, book and manage hotel inventory',
    'roles.travelAgency.portal': 'Travel Agency Portal',
    'roles.travelAgency.access': 'Search and book hotel inventory',
    'roles.travelAgency.features.0': 'Mini-GDS Search Engine',
    'roles.travelAgency.features.1': 'Real-time Booking System',
    'roles.travelAgency.features.2': 'Negotiated Rate Management',
    'roles.travelAgency.features.3': 'Commission Tracking',
    
    'roles.admin.title': 'System Admin',
    'roles.admin.description': 'Manage platform users and global settings',
    'roles.admin.portal': 'System Admin Portal',
    'roles.admin.access': 'Manage platform users and settings',
    'roles.admin.features.0': 'User Management Dashboard',
    'roles.admin.features.1': 'Global Platform Settings',
    'roles.admin.features.2': 'Advanced Analytics',
    'roles.admin.features.3': 'System Monitoring',
    
    'roles.socialMedia.title': 'Social Media Kit',
    'roles.socialMedia.description': 'AI-powered social media management platform', 
    'roles.socialMedia.portal': 'Social Media Kit Platform',
    'roles.socialMedia.access': 'AI-powered social media management',
    'roles.socialMedia.features.0': 'AI Content Generation',
    'roles.socialMedia.features.1': 'Social Calendar Management',
    'roles.socialMedia.features.2': 'Auto-Publishing System',
    'roles.socialMedia.features.3': 'Analytics & ROI Tracking',
    'roles.socialMedia.badge': 'NEW',
    
    // Form Labels
    'form.hotelName': 'Hotel/Organization Name',
    'form.agencyName': 'Agency Name',
    'form.selectRole': 'Select your role',
    
    // Platform Features
    'platform.multiTenant': 'Multi-tenant SaaS',
    'platform.realTimeARI': 'Real-time ARI',
    'platform.aiPowered': 'AI-powered',
    'platform.trustedBy': 'Trusted by leading hotel chains worldwide'
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
    'roles.hotelManager.title': 'Otel Müdürü',
    'roles.hotelManager.description': 'Oteli, rezervasyonları ve operasyonları yönetin',
    'roles.hotelManager.portal': 'Otel Müdürü Paneli',
    'roles.hotelManager.access': 'Mülk Yönetim Sisteminize erişin',
    'roles.hotelManager.features.0': 'Akıllı Gelir Optimizasyonu',
    'roles.hotelManager.features.1': 'Tahmine Dayalı Analitik Panosu',
    'roles.hotelManager.features.2': 'Otomatik Misafir Tercihleri',
    'roles.hotelManager.features.3': 'Gerçek Zamanlı Talep Tahmini',
    
    'roles.travelAgency.title': 'Seyahat Acentesi',
    'roles.travelAgency.description': 'Otel envanterini arayın, rezerve edin ve yönetin',
    'roles.travelAgency.portal': 'Seyahat Acentesi Paneli',
    'roles.travelAgency.access': 'Otel envanterini arayın ve rezerve edin',
    'roles.travelAgency.features.0': 'Mini-GDS Arama Motoru',
    'roles.travelAgency.features.1': 'Gerçek Zamanlı Rezervasyon Sistemi',
    'roles.travelAgency.features.2': 'Müzakere Edilmiş Fiyat Yönetimi',
    'roles.travelAgency.features.3': 'Komisyon Takibi',
    
    'roles.admin.title': 'Sistem Yöneticisi',
    'roles.admin.description': 'Platform kullanıcılarını ve genel ayarları yönetin',
    'roles.admin.portal': 'Sistem Yöneticisi Paneli',
    'roles.admin.access': 'Platform kullanıcılarını ve ayarları yönetin',
    'roles.admin.features.0': 'Kullanıcı Yönetim Panosu',
    'roles.admin.features.1': 'Genel Platform Ayarları',
    'roles.admin.features.2': 'Gelişmiş Analitik',
    'roles.admin.features.3': 'Sistem İzleme',
    
    'roles.socialMedia.title': 'Sosyal Medya Kiti',
    'roles.socialMedia.description': 'AI-destekli sosyal medya yönetim platformu',
    'roles.socialMedia.portal': 'Sosyal Medya Kit Platformu', 
    'roles.socialMedia.access': 'AI-destekli sosyal medya yönetimi',
    'roles.socialMedia.features.0': 'AI İçerik Üretimi',
    'roles.socialMedia.features.1': 'Sosyal Takvim Yönetimi',
    'roles.socialMedia.features.2': 'Otomatik Yayınlama Sistemi',
    'roles.socialMedia.features.3': 'Analitik & ROI Takibi',
    'roles.socialMedia.badge': 'YENİ',
    
    // Form Labels
    'form.hotelName': 'Otel/Organizasyon Adı',
    'form.agencyName': 'Acente Adı',
    'form.selectRole': 'Rolünüzü seçin',
    
    // Platform Features
    'platform.multiTenant': 'Çok Kiracılı SaaS',
    'platform.realTimeARI': 'Gerçek Zamanlı ARI',
    'platform.aiPowered': 'AI-destekli',
    'platform.trustedBy': 'Önde gelen otel zincirlerinin güvendiği platform'
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    // Fallback hook when used outside provider
    const [language, setLanguage] = useState<Language>('en');
    const t = (key: string): string => {
      return translations[language][key as keyof typeof translations['en']] || key;
    };
    return { language, setLanguage, t };
  }
  return context;
};

export { TranslationContext, translations };