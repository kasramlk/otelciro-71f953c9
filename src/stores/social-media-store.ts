import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface SocialMediaAccount {
  id: string;
  hotel_id: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter';
  account_name: string;
  account_handle?: string;
  is_connected: boolean;
  is_active: boolean;
}

interface BrandKit {
  id: string;
  hotel_id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary?: string;
  brand_voice: {
    tone: string;
    style: string;
    personality: string[];
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SocialContent {
  id: string;
  hotel_id: string;
  title?: string;
  caption: string;
  hashtags: string[];
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter';
  content_type: 'post' | 'story' | 'reel' | 'carousel';
  media_urls: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';
  scheduled_for?: string;
  published_at?: string;
  language: string;
  created_at: string;
  updated_at: string;
}

interface SocialMediaStore {
  // State
  accounts: SocialMediaAccount[];
  brandKits: BrandKit[];
  content: SocialContent[];
  currentBrandKit: BrandKit | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAccounts: (hotelId: string) => Promise<void>;
  fetchBrandKits: (hotelId: string) => Promise<void>;
  fetchContent: (hotelId: string) => Promise<void>;
  createBrandKit: (brandKit: Omit<BrandKit, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBrandKit: (id: string, updates: Partial<BrandKit>) => Promise<void>;
  setCurrentBrandKit: (brandKit: BrandKit | null) => void;
  createContent: (content: Omit<SocialContent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateContent: (id: string, updates: Partial<SocialContent>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  connectAccount: (account: Omit<SocialMediaAccount, 'id'>) => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Demo data seeding
  seedDemoData: (hotelId: string) => Promise<void>;
  resetDemoData: (hotelId: string) => Promise<void>;
}

export const useSocialMediaStore = create<SocialMediaStore>()(
  persist(
    (set, get) => ({
  // Initial state
  accounts: [],
  brandKits: [],
  content: [],
  currentBrandKit: null,
  loading: false,
  error: null,

  // Actions
  fetchAccounts: async (hotelId: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true);

      if (error) throw error;
      const accounts = (data || []).map(item => ({
        ...item,
        platform: item.platform as 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter'
      }));
      set({ accounts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchBrandKits: async (hotelId: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const brandKits = (data || []).map(item => ({
        ...item,
        brand_voice: typeof item.brand_voice === 'object' 
          ? item.brand_voice as { tone: string; style: string; personality: string[] }
          : { tone: 'professional', style: 'modern', personality: ['friendly'] }
      }));
      set({ 
        brandKits, 
        currentBrandKit: brandKits.length > 0 ? brandKits[0] : null,
        loading: false 
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchContent: async (hotelId: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('social_content')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const content = (data || []).map(item => ({
        ...item,
        platform: item.platform as 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter',
        content_type: item.content_type as 'post' | 'story' | 'reel' | 'carousel',
        status: item.status as 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'
      }));
      set({ content, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createBrandKit: async (brandKit) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('brand_kits')
        .insert([brandKit])
        .select()
        .single();

      if (error) throw error;
      const newBrandKit = {
        ...data,
        brand_voice: typeof data.brand_voice === 'object' 
          ? data.brand_voice as { tone: string; style: string; personality: string[] }
          : { tone: 'professional', style: 'modern', personality: ['friendly'] }
      };
      set(state => ({ 
        brandKits: [newBrandKit, ...state.brandKits],
        currentBrandKit: newBrandKit,
        loading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateBrandKit: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('brand_kits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updatedBrandKit = {
        ...data,
        brand_voice: typeof data.brand_voice === 'object' 
          ? data.brand_voice as { tone: string; style: string; personality: string[] }
          : { tone: 'professional', style: 'modern', personality: ['friendly'] }
      };
      set(state => ({
        brandKits: state.brandKits.map(kit => kit.id === id ? updatedBrandKit : kit),
        currentBrandKit: state.currentBrandKit?.id === id ? updatedBrandKit : state.currentBrandKit,
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  setCurrentBrandKit: (brandKit) => {
    set({ currentBrandKit: brandKit });
  },

  createContent: async (content) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('social_content')
        .insert([content])
        .select()
        .single();

      if (error) throw error;
      const newContent = {
        ...data,
        platform: data.platform as 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter',
        content_type: data.content_type as 'post' | 'story' | 'reel' | 'carousel',
        status: data.status as 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'
      };
      set(state => ({ 
        content: [newContent, ...state.content],
        loading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateContent: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('social_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updatedContent = {
        ...data,
        platform: data.platform as 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter',
        content_type: data.content_type as 'post' | 'story' | 'reel' | 'carousel',
        status: data.status as 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'
      };
      set(state => ({
        content: state.content.map(item => item.id === id ? updatedContent : item),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteContent: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('social_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        content: state.content.filter(item => item.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  connectAccount: async (account) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('social_media_accounts')
        .insert([{ ...account, is_connected: true }])
        .select()
        .single();

      if (error) throw error;
      const newAccount = {
        ...data,
        platform: data.platform as 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter'
      };
      set(state => ({ 
        accounts: [...state.accounts, newAccount],
        loading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  disconnectAccount: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('social_media_accounts')
        .update({ is_connected: false, is_active: false })
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        accounts: state.accounts.filter(account => account.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  // Demo data seeding
  seedDemoData: async (hotelId: string) => {
    try {
      set({ loading: true, error: null });

      // Create demo brand kit
      const demoBrandKit: Omit<BrandKit, 'id' | 'created_at' | 'updated_at'> = {
        hotel_id: hotelId,
        name: 'Hotel Brand Kit',
        logo_url: '/lovable-uploads/27a5c254-db11-4fe2-927e-a659f46eb769.png',
        primary_color: '#1d4ed8',
        secondary_color: '#0ea5e9',
        accent_color: '#3b82f6',
        font_primary: 'Inter',
        font_secondary: 'Playfair Display',
        brand_voice: {
          tone: 'Boutique Luxury',
          style: 'Sophisticated & Welcoming',
          personality: ['Professional', 'Warm', 'Elegant']
        },
        is_active: true
      };

      // Create demo accounts
      const demoAccounts = [
        {
          hotel_id: hotelId,
          platform: 'instagram' as const,
          account_name: '@yourhotel',
          account_handle: 'yourhotel',
          is_connected: false,
          is_active: true
        },
        {
          hotel_id: hotelId,
          platform: 'facebook' as const,
          account_name: 'Your Hotel Page',
          account_handle: 'yourhotel',
          is_connected: false,
          is_active: true
        },
        {
          hotel_id: hotelId,
          platform: 'linkedin' as const,
          account_name: 'Your Hotel Company',
          account_handle: 'your-hotel',
          is_connected: false,
          is_active: true
        }
      ];

      // Create demo content
      const demoContent: Omit<SocialContent, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          hotel_id: hotelId,
          title: 'Stunning Sunset Views',
          caption: 'Watch the perfect sunset from our rooftop terrace 🌅 Book your stay and experience luxury like never before.',
          hashtags: ['#sunset', '#luxury', '#hotel', '#rooftop', '#views'],
          platform: 'instagram',
          content_type: 'post',
          media_urls: [],
          status: 'draft',
          language: 'en'
        },
        {
          hotel_id: hotelId,
          title: 'Weekend Special Offer',
          caption: 'Special weekend offer - 20% off luxury suites! Perfect for a romantic getaway or family vacation.',
          hashtags: ['#weekend', '#offer', '#luxury', '#suites', '#discount'],
          platform: 'facebook',
          content_type: 'post',
          media_urls: [],
          status: 'scheduled',
          scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          language: 'en'
        },
        {
          hotel_id: hotelId,
          title: 'Culinary Excellence',
          caption: 'Behind the scenes: Our chef preparing tonight\'s special menu with fresh, local ingredients.',
          hashtags: ['#culinary', '#chef', '#fresh', '#local', '#menu'],
          platform: 'instagram',
          content_type: 'reel',
          media_urls: [],
          status: 'scheduled',
          scheduled_for: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          language: 'en'
        },
        {
          hotel_id: hotelId,
          title: 'Guest Testimonial',
          caption: 'Another happy guest! "The service was exceptional and the views were breathtaking." Thank you for choosing us!',
          hashtags: ['#testimonial', '#happy', '#guest', '#service', '#exceptional'],
          platform: 'linkedin',
          content_type: 'post',
          media_urls: [],
          status: 'draft',
          language: 'en'
        },
        {
          hotel_id: hotelId,
          title: 'Spa Day Special',
          caption: 'Treat yourself to a relaxing spa day. Our wellness packages include massage, facial, and access to our thermal pools.',
          hashtags: ['#spa', '#wellness', '#relaxation', '#massage', '#thermal'],
          platform: 'facebook',
          content_type: 'post',
          media_urls: [],
          status: 'scheduled',
          scheduled_for: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          language: 'en'
        },
        {
          hotel_id: hotelId,
          title: 'Team Appreciation',
          caption: 'Our amazing team makes every stay special. Meet our front desk manager who has been with us for 5 years!',
          hashtags: ['#team', '#staff', '#appreciation', '#service', '#experience'],
          platform: 'instagram',
          content_type: 'post',
          media_urls: [],
          status: 'draft',
          language: 'en'
        }
      ];

      // Insert demo data (in a real app, this would be done via Supabase)
      // For now, we'll just set it in the store
      set(state => ({
        brandKits: [{ 
          ...demoBrandKit, 
          id: `demo-brand-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        currentBrandKit: { 
          ...demoBrandKit, 
          id: `demo-brand-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        accounts: demoAccounts.map((acc, i) => ({ 
          ...acc, 
          id: `demo-account-${i}-${Date.now()}`
        })),
        content: demoContent.map((content, i) => ({
          ...content,
          id: `demo-content-${i}-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        loading: false
      }));

    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to seed demo data', loading: false });
    }
  },

  resetDemoData: async (hotelId: string) => {
    set({ 
      accounts: [],
      brandKits: [],
      content: [],
      currentBrandKit: null,
      loading: false,
      error: null
    });
    
    // Re-seed demo data
    get().seedDemoData(hotelId);
  }
}),
{
  name: 'sm:social-media-store',
  partialize: (state) => ({
    accounts: state.accounts,
    brandKits: state.brandKits,
    content: state.content,
    currentBrandKit: state.currentBrandKit
  })
}
));