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
      'changeRole': 'Change Role',
      'step': 'Step'
    },

    // Navbar
    'navbar': {
      'home': 'Home',
      'dashboard': 'Dashboard',
      'aboutUs': 'About Us',
      'pricing': 'Pricing'
    },

    // Landing Page - Hero
    'landing': {
      'hero': {
        'title': "We Don't Just Give You Tools. We Grow Your Hotel's Revenue.",
        'subtitle': "Your hotel deserves more than software. With our team of experts, we maximize your revenue, reduce your costs, and manage your entire sales strategy — so you don't need to hire sales managers, revenue managers, or social media teams.",
        'cta': "👉 Let's Grow Together",
        'ctaSecondary': 'See Our Process'
      },
      'whatWeDo': {
        'title': 'What We Do',
        'subtitle': "We are your hotel's full sales & revenue partner.",
        'description': 'We work with hotels of every size — from boutique family hotels to large city properties. Our mission is simple:',
        'benefit1': 'Maximize your revenue',
        'benefit2': 'Minimize your costs', 
        'benefit3': "Tailor every strategy to your hotel's unique strengths and your goals",
        'positioning': 'Instead of giving you just a PMS or Channel Manager, we become your sales department.'
      },
      'howWeWork': {
        'title': 'How We Work',
        'step1Title': 'X-Ray Analysis',
        'step1Description': 'We start by analyzing your past data, performance, and current sales channels. Think of it as an X-ray of your business.',
        'step2Title': 'Tailor-Made Strategy',
        'step2Description': 'Every hotel is unique. We create a customized sales and revenue plan based on your capacity, seasonality, and your goals as the owner.',
        'step3Title': 'Clear Roadmap',
        'step3Description': 'We present a 6-month and 1-year roadmap with predicted revenue outcomes and growth targets.',
        'step4Title': 'Ongoing Execution',
        'step4Description': 'Our team of professionals works daily on your behalf, making sure your rooms are always sold at the best price, through the right channels.'
      },
      'ecosystem': {
        'title': 'Our Ecosystem – Free for Our Hotels',
        'subtitle': 'Hotels in our portfolio get access to our full ecosystem at no extra cost:',
        'pms': 'Hotel PMS – Manage your property with ease',
        'channelManager': 'Channel Manager – Connect to OTAs and agencies worldwide',
        'miniGDS': 'Mini-GDS – Access 100+ B2B agencies and distribute your inventory globally',
        'socialKit': 'Social Branding Kit – Professional social media and content creation',
        'note': 'All included free of charge when you partner with us.'
      },
      'whyChooseUs': {
        'title': 'Why Choose Us?',
        'experience': '20+ years of experience in hotel sales & revenue management',
        'datadriven': 'Data-driven strategies — no guesswork',
        'coverage': 'B2C & B2B sales coverage — reach guests directly and through agencies',
        'noStaff': 'No need for sales managers, revenue managers, or marketing staff — we handle it all',
        'results': 'Focus on results: more bookings, higher ADR, better occupancy'
      },
      'promise': {
        'title': 'Our Promise',
        'subtitle': "We don't just consult. We act as your partner.",
        'description': 'With us, you get a professional sales and revenue department at a fraction of the cost, backed by real market data and decades of experience.',
        'goal': 'Our goal is simple: make your hotel owner journey easier, and your business more profitable.'
      }
    },

    // About Section
    'about': {
      'title': 'About Us',
      'subtitle': 'Your trusted revenue growth partner with 20+ years of experience in hospitality',
      'contact': {
        'title': 'Get in Touch',
        'subtitle': 'Ready to grow your hotel revenue? Contact us today.',
        'email': 'Email',
        'phone': 'Phone',
        'location': 'Location',
        'address': 'Turkey & International'
      },
      'business': {
        'title': 'Why Trust Us',
        'experience': 'Years Experience',
        'hotels': 'Hotels Served',
        'support': 'Support',
        'satisfaction': 'Success Rate'
      },
      'form': {
        'title': 'Request Consultation',
        'subtitle': "Fill out the form below and we'll contact you within 24 hours to discuss your hotel's revenue growth strategy.",
        'name': 'Full Name',
        'namePlaceholder': 'Enter your full name',
        'email': 'Email Address',
        'emailPlaceholder': 'Enter your email address',
        'phone': 'Phone Number',
        'phonePlaceholder': 'Enter your phone number',
        'hotelName': 'Hotel Name',
        'hotelNamePlaceholder': 'Enter your hotel name',
        'message': 'Tell us about your hotel',
        'messagePlaceholder': 'Describe your hotel, current challenges, and revenue goals...',
        'submit': 'Send Request',
        'sending': 'Sending...',
        'successMessage': "Thank you! We'll contact you within 24 hours."
      }
    },

    // Pricing Section
    'pricing': {
      'title': 'Revenue Partnership Plans',
      'subtitle': 'Choose the perfect partnership level for your hotel. All plans include our full ecosystem at no extra cost.',
      'popular': 'Most Popular',
      'contactUs': 'Contact Us',
      'starter': {
        'name': 'Revenue Starter',
        'description': 'Perfect for boutique hotels and small properties',
        'price': 'Custom',
        'period': 'Revenue Share',
        'feature1': 'Revenue analysis & optimization',
        'feature2': 'Basic sales strategy',
        'feature3': 'Free PMS & Channel Manager',
        'feature4': 'Email support',
        'feature5': 'Monthly performance reports'
      },
      'professional': {
        'name': 'Revenue Professional',
        'description': 'Ideal for mid-size hotels and growing properties',
        'price': 'Custom',
        'period': 'Revenue Share + Fixed',
        'feature1': 'Complete revenue management',
        'feature2': 'Advanced sales strategy',
        'feature3': 'Full ecosystem access (PMS, CM, Mini-GDS)',
        'feature4': 'Dedicated account manager',
        'feature5': 'Social media management',
        'feature6': '24/7 phone support',
        'feature7': 'Weekly strategy calls'
      },
      'enterprise': {
        'name': 'Revenue Enterprise',
        'description': 'For large hotels and hotel chains',
        'price': 'Custom',
        'period': 'Tailored Agreement',
        'feature1': 'Full revenue partnership',
        'feature2': 'Complete sales department replacement',
        'feature3': 'Custom integrations & tools',
        'feature4': 'Dedicated team of experts',
        'feature5': 'Advanced analytics & forecasting',
        'feature6': 'Multi-property management',
        'feature7': 'Priority support & consulting',
        'feature8': 'Custom reporting dashboard'
      },
      'guarantee': {
        'title': 'Our Revenue Growth Guarantee',
        'description': "We stand behind our results. If we don't increase your revenue within the first 6 months, we'll work for free until we do.",
        'days': 'Day Assessment',
        'support': 'Support',
        'updates': 'Strategy Updates'
      }
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
    },

    // Tools section translations
    'tools': {
      'freeBadge': '100% FREE with Partnership',
      'revolutionaryEcosystem': '🚀 Our Revolutionary Ecosystem',
      'toolsThat': 'Tools That',
      'transformHotels': 'Transform Hotels',
      'subtitle': 'Experience the future of hospitality with our AI-powered suite. Each tool is designed to maximize your revenue, minimize operational costs, and deliver exceptional guest experiences.',
      'partnershipMessage': 'Revenue Partnership = All Tools FREE',
      'ctaButton': 'Experience Our Ecosystem',
      'freeMessage': 'All tools included FREE with our revenue partnership',
      'noExtraCost': 'No setup fees, no monthly costs, no hidden charges. We grow together when your revenue grows.',
      
      'hotelPms': {
        'title': 'Hotel PMS',
        'description': 'Advanced property management system with AI-powered automation, real-time analytics, and seamless guest experience management.'
      },
      'channelManager': {
        'title': 'Channel Manager',
        'description': 'Intelligent distribution management connecting to 500+ OTAs worldwide with dynamic pricing and inventory optimization.'
      },
      'miniGds': {
        'title': 'Mini-GDS',
        'description': 'Global distribution system accessing 100+ B2B agencies with real-time booking engine and commission management.'
      },
      'socialMediaKit': {
        'title': 'Social Media Kit',
        'description': 'AI-powered content creation, automated posting, brand management, and performance analytics across all platforms.'
      },
      'revenueAi': {
        'title': 'Revenue AI',
        'description': 'Machine learning algorithms for demand forecasting, dynamic pricing, and revenue optimization strategies.'
      },
      'analyticsHub': {
        'title': 'Analytics Hub',
        'description': 'Advanced business intelligence dashboard with predictive analytics, KPI tracking, and automated reporting.'
      },
      'guestCrm': {
        'title': 'Guest CRM',
        'description': 'Comprehensive customer relationship management with personalization engine and loyalty program integration.'
      },
      'automationEngine': {
        'title': 'Automation Engine',
        'description': 'Workflow automation for operations, marketing campaigns, guest communications, and business processes.'
      }
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
      'changeRole': 'Rol Değiştir',
      'step': 'Adım'
    },

    // Navbar
    'navbar': {
      'home': 'Ana Sayfa',
      'dashboard': 'Panel',
      'aboutUs': 'Hakkımızda',
      'pricing': 'Fiyatlandırma'
    },

    // Landing Page - Hero
    'landing': {
      'hero': {
        'title': 'Otel programlarının ötesinde, gelirlerinizi artırmaya odaklanıyoruz.',
        'subtitle': 'Oteliniz yazılımdan daha fazlasını hak ediyor. Uzman ekibimizle gelirinizi maksimize ediyor, maliyetlerinizi düşürüyor ve tüm satış stratejinizi yönetiyoruz — satış müdürü, gelir müdürü veya sosyal medya ekibi işe almanıza gerek yok.',
        'cta': '👉 Birlikte Büyüyelim',
        'ctaSecondary': 'Sürecimizi Görün'
      },
      'whatWeDo': {
        'title': 'Ne Yapıyoruz',
        'subtitle': 'Otelinizin satış ve gelir operasyonlarında sizinle birlikte hareket ediyoruz.',
        'description': 'Her büyüklükteki otelle çalışıyoruz — butik aile otellerinden büyük şehir otellerine kadar. Misyonumuz basit:',
        'benefit1': 'Gelirinizi maksimize etmek',
        'benefit2': 'Maliyetlerinizi minimize etmek',
        'benefit3': 'Her stratejiyi otelinizin benzersiz güçlü yanlarına ve hedeflerinize göre uyarlamak',
        'positioning': 'Size sadece PMS veya Kanal Yöneticisi vermek yerine, satış departmanınız oluyoruz.'
      },
      'howWeWork': {
        'title': 'Nasıl Çalışıyoruz',
        'step1Title': 'Röntgen Analizi',
        'step1Description': 'Geçmiş verilerinizi, performansınızı ve mevcut satış kanallarınızı analiz ederek başlıyoruz. Bunu işletmenizin röntgeni olarak düşünün.',
        'step2Title': 'Özel Strateji',
        'step2Description': 'Her otel benzersizdir. Kapasitenize, mevsimselliğinize ve sahip olarak hedeflerinize göre özelleştirilmiş satış ve gelir planı oluşturuyoruz.',
        'step3Title': 'Net Yol Haritası',
        'step3Description': '6 aylık ve 1 yıllık tahmin edilen gelir sonuçları ve büyüme hedefleri ile yol haritası sunuyoruz.',
        'step4Title': 'Sürekli Uygulama',
        'step4Description': 'Profesyonel ekibimiz sizin adınıza günlük çalışır, odalarınızın her zaman en iyi fiyattan, doğru kanallar aracılığıyla satılmasını sağlar.'
      },
      'ecosystem': {
        'title': 'Ekosimsitemiz – Otellerimiz İçin Ücretsiz',
        'subtitle': 'Portföyümüzdeki oteller tam ekosimsitemize hiçbir ek ücret ödemeden erişir:',
        'pms': 'Otel PMS – Mülkünüzü kolayca yönetin',
        'channelManager': 'Kanal Yöneticisi – Dünya çapında OTA\'lar ve acentelerle bağlantı kurun',
        'miniGDS': 'Mini-GDS – 100+ B2B acenteye erişin ve envanterinizi küresel olarak dağıtın',
        'socialKit': 'Sosyal Marka Kiti – Profesyonel sosyal medya ve içerik oluşturma',
        'note': 'Bizimle ortak olduğunuzda hepsi ücretsiz dahil.'
      },
      'whyChooseUs': {
        'title': 'Neden Bizi Seçmelisiniz?',
        'experience': 'Otel satış ve gelir yönetiminde 20+ yıl deneyim',
        'datadriven': 'Veri odaklı stratejiler — tahmin yok',
        'coverage': 'B2C ve B2B satış kapsamı — misafirlere doğrudan ve acenteler aracılığıyla ulaşın',
        'noStaff': 'Satış müdürü, gelir müdürü veya pazarlama personeline gerek yok — hepsini biz hallederiz',
        'results': 'Sonuçlara odaklanma: daha fazla rezervasyon, daha yüksek ADR, daha iyi doluluk'
      },
      'promise': {
        'title': 'Sözümüz',
        'subtitle': 'Sadece danışmanlık yapmıyoruz. Ortağınız olarak hareket ediyoruz.',
        'description': 'Bizimle, gerçek pazar verileri ve onlarca yıllık deneyimle desteklenen profesyonel satış ve gelir departmanını maliyetinin bir kısmıyla elde edersiniz.',
        'goal': 'Hedefimiz basit: otel sahipliği yolculuğunuzu kolaylaştırmak ve işinizi daha karlı hale getirmek.'
      }
    },

    // About Section
    'about': {
      'title': 'Hakkımızda',
      'subtitle': '20+ yıllık deneyimiyle güvenilir gelir artış ortağınız.',
      'contact': {
        'title': 'İletişim',
        'subtitle': 'Otel gelirlerinizi artırmaya hazır mısınız? Hemen bizimle iletişime geçin.',
        'email': 'E-posta',
        'phone': 'Telefon',
        'location': 'Konum',
        'address': 'Türkiye & Uluslararası'
      },
      'business': {
        'title': 'Neden Bize Güvenmelisiniz?',
        'experience': '20+ yıl deneyim',
        'hotels': '500+ otel hizmet verdi',
        'support': '7/24 destek',
        'satisfaction': '%100 başarı oranı'
      },
      'form': {
        'title': 'Danışmanlık Talep Formu',
        'subtitle': 'Aşağıdaki formu doldurun, 24 saat içinde sizinle iletişime geçelim.',
        'name': 'Ad Soyad',
        'namePlaceholder': 'Adınızı ve soyadınızı girin',
        'email': 'E-posta',
        'emailPlaceholder': 'E-posta adresinizi girin',
        'phone': 'Telefon',
        'phonePlaceholder': 'Telefon numaranızı girin',
        'hotelName': 'Otel Adı',
        'hotelNamePlaceholder': 'Otel adınızı girin',
        'message': 'Oteliniz hakkında bilgi verin (mevcut zorluklar ve hedefleriniz…)',
        'messagePlaceholder': 'Otelinizi, mevcut zorlukları ve gelir hedeflerinizi açıklayın...',
        'submit': 'Talep Gönder',
        'sending': 'Gönderiliyor...',
        'successMessage': 'Teşekkürler! 24 saat içinde sizinle iletişime geçeceğiz.'
      }
    },

    // Pricing Section
    'pricing': {
      'title': 'Gelir Ortaklığı Planları',
      'subtitle': 'Oteliniz için mükemmel ortaklık seviyesini seçin. Tüm planlar tam ekosimsitemizi hiçbir ek ücret olmadan içerir.',
      'popular': '(En Popüler)',
      'contactUs': 'İletişime Geç',
      'starter': {
        'name': 'Revenue Starter',
        'description': 'Küçük butik oteller için ideal',
        'price': 'Özel',
        'period': 'Gelir Paylaşımı',
        'feature1': 'Özel gelir paylaşımı',
        'feature2': 'Gelir analizi & optimizasyon',
        'feature3': 'Temel satış stratejisi',
        'feature4': 'Ücretsiz PMS & Channel Manager',
        'feature5': 'E-posta desteği',
        'feature6': 'Aylık performans raporları'
      },
      'professional': {
        'name': 'Revenue Professional',
        'description': '(En Popüler) Orta ölçekli ve büyüyen oteller için',
        'price': 'Özel',
        'period': 'Gelir paylaşımı + sabit ücret',
        'feature1': 'Tam kapsamlı gelir yönetimi',
        'feature2': 'İleri satış stratejisi',
        'feature3': 'Tüm ekosisteme erişim (PMS, CM, Mini-GDS)',
        'feature4': 'Hesap yöneticisi',
        'feature5': 'Sosyal medya yönetimi',
        'feature6': '7/24 telefon desteği',
        'feature7': 'Haftalık strateji görüşmeleri'
      },
      'enterprise': {
        'name': 'Revenue Enterprise',
        'description': 'Büyük oteller & otel zincirleri için',
        'price': 'Özel',
        'period': 'Özel anlaşma',
        'feature1': 'Tam kapsamlı satış departmanı',
        'feature2': 'Özel entegrasyonlar & araçlar',
        'feature3': 'Uzman ekibiniz',
        'feature4': 'Gelişmiş analiz & tahminleme',
        'feature5': 'Çoklu tesis yönetimi',
        'feature6': 'Öncelikli destek',
        'feature7': 'Özel raporlama paneli'
      },
      'guarantee': {
        'title': 'Gelir Artış Garantimiz',
        'description': 'İlk 6 ayda gelirlerinizi artırmazsak, başarılı olana kadar ücretsiz çalışıyoruz.',
        'days': '30 Günlük Değerlendirme',
        'support': '7/24 Destek',
        'updates': 'Sınırsız Strateji Güncellemesi'
      }
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
    },

    // Tools section translations - Turkish
    'tools': {
      'freeBadge': 'Ortaklıkla %100 ÜCRETSİZ',
      'revolutionaryEcosystem': '🚀 Devrim Yaratan Ekosistemimiz',
      'toolsThat': 'Otelleri',
      'transformHotels': 'Dönüştüren Araçlar',
      'subtitle': 'Yapay zeka destekli araçlarımızla turizm sektörünün geleceğini yaşayın. Her araç gelirinizi maksimuma çıkarmak, operasyonel maliyetleri azaltmak ve misafirlerinize unutulmaz deneyimler sunmak için tasarlandı.',
      'partnershipMessage': 'Gelir Ortaklığı = Tüm Araçlar ÜCRETSİZ',
      'ctaButton': 'Ekosistemi Keşfedin',
      'freeMessage': 'Gelir ortaklığımızla tüm araçlar tamamen ücretsiz',
      'noExtraCost': 'Kurulum ücreti yok, aylık maliyet yok, gizli ücret yok. Geliriniz arttığında birlikte büyüyoruz.',
      
      'hotelPms': {
        'title': 'Otel Yönetim Sistemi',
        'description': 'Yapay zeka destekli otomasyon, gerçek zamanlı analitik ve kusursuz misafir deneyimi yönetimi ile gelişmiş otel yönetim sistemi.'
      },
      'channelManager': {
        'title': 'Kanal Yöneticisi',
        'description': 'Dinamik fiyatlandırma ve stok optimizasyonu ile dünya çapında 500+ OTA\'ya bağlanan akıllı dağıtım yönetimi.'
      },
      'miniGds': {
        'title': 'Mini-GDS Sistemi',
        'description': 'Gerçek zamanlı rezervasyon motoru ve komisyon yönetimi ile 100+ B2B acenteye erişim sağlayan küresel dağıtım sistemi.'
      },
      'socialMediaKit': {
        'title': 'Sosyal Medya Kiti',
        'description': 'Tüm platformlarda yapay zeka destekli içerik üretimi, otomatik paylaşım, marka yönetimi ve performans analitiği.'
      },
      'revenueAi': {
        'title': 'Gelir Yapay Zekası',
        'description': 'Talep tahmini, dinamik fiyatlandırma ve gelir optimizasyon stratejileri için makine öğrenmesi algoritmaları.'
      },
      'analyticsHub': {
        'title': 'Analitik Merkezi',
        'description': 'Tahmine dayalı analitik, KPI takibi ve otomatik raporlama ile gelişmiş iş zekası panosu.'
      },
      'guestCrm': {
        'title': 'Misafir CRM',
        'description': 'Kişiselleştirme motoru ve sadakat programı entegrasyonu ile kapsamlı müşteri ilişkileri yönetimi.'
      },
      'automationEngine': {
        'title': 'Otomasyon Motoru',
        'description': 'Operasyonlar, pazarlama kampanyaları, misafir iletişimi ve iş süreçleri için iş akışı otomasyonu.'
      }
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