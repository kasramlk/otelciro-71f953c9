-- Create companies/agencies table
CREATE TABLE public.agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'OTA' CHECK (type IN ('OTA', 'Corporate', 'TravelAgent', 'Wholesaler')),
  contact_email TEXT,
  contact_phone TEXT,
  contact_person TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_agreements table
CREATE TABLE public.pricing_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  discount_percent DECIMAL(5,2) DEFAULT 0,
  fixed_rate DECIMAL(10,2),
  allotment INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cashier_sessions table
CREATE TABLE public.cashier_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance DECIMAL(10,2) DEFAULT 0,
  closing_balance DECIMAL(10,2),
  cash_collected DECIMAL(10,2) DEFAULT 0,
  card_collected DECIMAL(10,2) DEFAULT 0,
  other_collected DECIMAL(10,2) DEFAULT 0,
  is_closed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  diff_json JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add agency_id to reservations table
ALTER TABLE public.reservations ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agencies
CREATE POLICY "Users can view organization agencies" 
ON public.agencies 
FOR SELECT 
USING (org_id IN (
  SELECT u.org_id FROM public.users u
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization agencies" 
ON public.agencies 
FOR ALL 
USING (org_id IN (
  SELECT u.org_id FROM public.users u
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for pricing_agreements
CREATE POLICY "Users can view organization pricing agreements" 
ON public.pricing_agreements 
FOR SELECT 
USING (agency_id IN (
  SELECT a.id FROM public.agencies a
  JOIN public.users u ON a.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization pricing agreements" 
ON public.pricing_agreements 
FOR ALL 
USING (agency_id IN (
  SELECT a.id FROM public.agencies a
  JOIN public.users u ON a.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for cashier_sessions
CREATE POLICY "Users can view organization cashier sessions" 
ON public.cashier_sessions 
FOR SELECT 
USING (org_id IN (
  SELECT u.org_id FROM public.users u
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization cashier sessions" 
ON public.cashier_sessions 
FOR ALL 
USING (org_id IN (
  SELECT u.org_id FROM public.users u
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for audit_log
CREATE POLICY "Users can view organization audit log" 
ON public.audit_log 
FOR SELECT 
USING (org_id IN (
  SELECT u.org_id FROM public.users u
  WHERE u.auth_user_id = auth.uid()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_agreements_updated_at
BEFORE UPDATE ON public.pricing_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cashier_sessions_updated_at
BEFORE UPDATE ON public.cashier_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_agencies_org_id ON public.agencies(org_id);
CREATE INDEX idx_agencies_type ON public.agencies(type);
CREATE INDEX idx_pricing_agreements_agency_id ON public.pricing_agreements(agency_id);
CREATE INDEX idx_pricing_agreements_hotel_id ON public.pricing_agreements(hotel_id);
CREATE INDEX idx_cashier_sessions_org_id ON public.cashier_sessions(org_id);
CREATE INDEX idx_cashier_sessions_user_id ON public.cashier_sessions(user_id);
CREATE INDEX idx_cashier_sessions_date ON public.cashier_sessions(session_date);
CREATE INDEX idx_audit_log_org_id ON public.audit_log(org_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX idx_reservations_agency_id ON public.reservations(agency_id);