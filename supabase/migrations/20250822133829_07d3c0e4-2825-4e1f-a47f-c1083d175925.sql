-- Create social media content tables for AI Social Media Content Maker

-- Social media accounts table
CREATE TABLE public.social_media_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter')),
  account_name TEXT NOT NULL,
  account_handle TEXT,
  access_token TEXT,
  refresh_token TEXT,
  is_connected BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  account_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, platform, account_handle)
);

-- Brand kits table for hotel branding
CREATE TABLE public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Brand Kit',
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#2563eb',
  secondary_color TEXT NOT NULL DEFAULT '#64748b',
  accent_color TEXT NOT NULL DEFAULT '#dc2626',
  font_primary TEXT NOT NULL DEFAULT 'Inter',
  font_secondary TEXT,
  brand_voice JSONB DEFAULT '{"tone": "professional", "style": "modern", "personality": ["friendly", "trustworthy"]}',
  templates JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content templates table
CREATE TABLE public.content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('promotion', 'event', 'amenity', 'guest_experience', 'seasonal', 'general')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'universal')),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'reel', 'carousel')),
  template_data JSONB NOT NULL DEFAULT '{}',
  ai_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated content table
CREATE TABLE public.social_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.content_templates(id) ON DELETE SET NULL,
  title TEXT,
  caption TEXT NOT NULL,
  hashtags TEXT[],
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter')),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'reel', 'carousel')),
  media_urls TEXT[],
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'archived')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  ai_metadata JSONB DEFAULT '{}',
  pms_data JSONB DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  language TEXT DEFAULT 'en',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content calendar table
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.social_content(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  auto_generated BOOLEAN DEFAULT false,
  ai_suggested BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_needed')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social media analytics table
CREATE TABLE public.social_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.social_content(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_id TEXT,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  bookings_attributed INTEGER DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, platform, analytics_date)
);

-- Content approval workflow table
CREATE TABLE public.content_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.social_content(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  approver_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_needed')),
  comments TEXT,
  revision_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hotel-based access
CREATE POLICY "social_media_accounts_rw" ON public.social_media_accounts
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "brand_kits_rw" ON public.brand_kits
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "content_templates_rw" ON public.content_templates
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "social_content_rw" ON public.social_content
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "content_calendar_rw" ON public.content_calendar
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "social_analytics_rw" ON public.social_analytics
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "content_approvals_rw" ON public.content_approvals
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Add update triggers
CREATE TRIGGER update_social_media_accounts_updated_at
BEFORE UPDATE ON public.social_media_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_kits_updated_at
BEFORE UPDATE ON public.brand_kits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at
BEFORE UPDATE ON public.content_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_content_updated_at
BEFORE UPDATE ON public.social_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at
BEFORE UPDATE ON public.content_calendar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_analytics_updated_at
BEFORE UPDATE ON public.social_analytics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_approvals_updated_at
BEFORE UPDATE ON public.content_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_social_content_hotel_status ON public.social_content(hotel_id, status);
CREATE INDEX idx_social_content_scheduled ON public.social_content(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_content_calendar_date ON public.content_calendar(hotel_id, scheduled_date);
CREATE INDEX idx_social_analytics_date ON public.social_analytics(hotel_id, analytics_date);
CREATE INDEX idx_brand_kits_active ON public.brand_kits(hotel_id) WHERE is_active = true;