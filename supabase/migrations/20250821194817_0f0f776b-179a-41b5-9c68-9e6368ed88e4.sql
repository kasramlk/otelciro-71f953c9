-- Enhanced database schema for OtelCiro All-in-One Platform

-- Guest CRM tables
CREATE TABLE public.guest_loyalty_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  program_name TEXT NOT NULL,
  tier_structure JSONB NOT NULL DEFAULT '{}',
  point_value NUMERIC NOT NULL DEFAULT 0.01,
  redemption_rules JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.guest_loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL,
  program_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'bonus')),
  points INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.guest_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms', 'whatsapp', 'push', 'in_app')),
  template_id UUID,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.guest_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL,
  category TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(guest_id, category, preference_key)
);

-- Operations Management tables
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  hire_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  hourly_rate NUMERIC,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.staff_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  department TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  room_id UUID,
  equipment_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL,
  reported_by UUID,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  images JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  room_id UUID,
  equipment_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'broken', 'retired')),
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Finance & Revenue Management tables
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('guest', 'company', 'agency')),
  entity_id UUID NOT NULL,
  reservation_id UUID,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  invoice_id UUID,
  reservation_id UUID,
  payment_method TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'partial', 'full', 'refund')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC DEFAULT 1,
  amount_in_base_currency NUMERIC NOT NULL,
  gateway_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI & Revenue Management tables
CREATE TABLE public.competitor_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_room_type TEXT NOT NULL,
  our_room_type_id UUID NOT NULL,
  date DATE NOT NULL,
  rate NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  availability_status TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL
);

CREATE TABLE public.demand_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('occupancy', 'adr', 'revpar', 'demand')),
  predicted_value NUMERIC NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  factors JSONB DEFAULT '{}',
  model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_type_id, forecast_date, forecast_type)
);

CREATE TABLE public.market_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('conference', 'concert', 'sports', 'holiday', 'festival', 'trade_show')),
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  expected_impact TEXT CHECK (expected_impact IN ('low', 'medium', 'high')),
  demand_multiplier NUMERIC DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('occupancy_based', 'demand_based', 'competitor_based', 'event_based')),
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agency and GDS Enhancement tables
CREATE TABLE public.agency_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('negotiated_rate', 'net_rate', 'commission', 'package')),
  rate_details JSONB NOT NULL DEFAULT '{}',
  commission_rate NUMERIC,
  booking_terms JSONB DEFAULT '{}',
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.booking_holds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  guest_name TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  rate_quoted NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Communication & Automation tables
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('pre_arrival', 'check_in', 'in_stay', 'check_out', 'post_stay', 'marketing', 'service_recovery')),
  communication_channel TEXT NOT NULL CHECK (communication_channel IN ('email', 'sms', 'whatsapp', 'push')),
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  trigger_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.guest_loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Guest CRM tables
CREATE POLICY "loyalty_programs_rw" ON public.guest_loyalty_programs
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "loyalty_transactions_rw" ON public.guest_loyalty_transactions
FOR ALL USING (guest_id IN (
  SELECT g.id FROM guests g JOIN hotels h ON g.hotel_id = h.id
  JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "communications_rw" ON public.guest_communications
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "preferences_rw" ON public.guest_preferences
FOR ALL USING (guest_id IN (
  SELECT g.id FROM guests g JOIN hotels h ON g.hotel_id = h.id
  JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid()
));

-- RLS Policies for Operations tables
CREATE POLICY "staff_rw" ON public.staff
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "schedules_rw" ON public.staff_schedules
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "maintenance_rw" ON public.maintenance_requests
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "equipment_rw" ON public.equipment
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- RLS Policies for Finance tables
CREATE POLICY "invoices_rw" ON public.invoices
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "invoice_items_rw" ON public.invoice_line_items
FOR ALL USING (invoice_id IN (
  SELECT i.id FROM invoices i JOIN hotels h ON i.hotel_id = h.id
  JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "payments_rw" ON public.payments
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- RLS Policies for AI tables
CREATE POLICY "competitor_rates_rw" ON public.competitor_rates
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "forecasts_rw" ON public.demand_forecasts
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "events_read" ON public.market_events FOR SELECT USING (true);

CREATE POLICY "pricing_rules_rw" ON public.pricing_rules
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- RLS Policies for Agency tables
CREATE POLICY "contracts_rw" ON public.agency_contracts
FOR ALL USING (
  agency_id IN (SELECT a.id FROM agencies a JOIN users u ON a.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
  OR hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "holds_rw" ON public.booking_holds
FOR ALL USING (
  agency_id IN (SELECT a.id FROM agencies a JOIN users u ON a.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
  OR hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "templates_rw" ON public.message_templates
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Create update triggers for tables with updated_at
CREATE TRIGGER update_loyalty_programs_updated_at
BEFORE UPDATE ON public.guest_loyalty_programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
BEFORE UPDATE ON public.guest_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.staff_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.agency_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holds_updated_at
BEFORE UPDATE ON public.booking_holds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for demo purposes
INSERT INTO public.guest_loyalty_programs (hotel_id, program_name, tier_structure, point_value) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Elite Rewards', '{"tiers": ["Bronze", "Silver", "Gold", "Platinum"], "benefits": {"Bronze": "5% discount", "Silver": "10% discount + late checkout", "Gold": "15% discount + room upgrade", "Platinum": "20% discount + premium perks"}}', 0.01);

INSERT INTO public.market_events (name, description, event_type, location, start_date, end_date, expected_impact, demand_multiplier) VALUES
('Istanbul Fashion Week', 'Major fashion event attracting international visitors', 'fashion', 'Istanbul, Turkey', '2024-03-15', '2024-03-22', 'high', 1.8),
('Tech Conference Istanbul', 'Annual technology conference', 'conference', 'Istanbul, Turkey', '2024-04-10', '2024-04-12', 'medium', 1.4),
('Summer Music Festival', 'Large outdoor music festival', 'festival', 'Antalya, Turkey', '2024-07-20', '2024-07-22', 'high', 2.1);

INSERT INTO public.message_templates (hotel_id, template_name, template_type, communication_channel, subject, content) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Welcome Pre-Arrival', 'pre_arrival', 'email', 'Welcome to {{hotel_name}} - Your Stay Details', 'Dear {{guest_name}}, We are excited to welcome you to {{hotel_name}} on {{check_in_date}}. Your reservation details: Room: {{room_type}}, Nights: {{nights}}, Rate: {{rate}}. We look forward to making your stay memorable!');

-- Add indexes for performance
CREATE INDEX idx_loyalty_transactions_guest_id ON public.guest_loyalty_transactions(guest_id);
CREATE INDEX idx_communications_guest_id ON public.guest_communications(guest_id);
CREATE INDEX idx_preferences_guest_id ON public.guest_preferences(guest_id);
CREATE INDEX idx_staff_hotel_id ON public.staff(hotel_id);
CREATE INDEX idx_schedules_date ON public.staff_schedules(shift_date);
CREATE INDEX idx_maintenance_hotel_room ON public.maintenance_requests(hotel_id, room_id);
CREATE INDEX idx_invoices_entity ON public.invoices(entity_type, entity_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_competitor_rates_date ON public.competitor_rates(hotel_id, date);
CREATE INDEX idx_forecasts_date ON public.demand_forecasts(hotel_id, forecast_date);
CREATE INDEX idx_events_dates ON public.market_events(start_date, end_date);
CREATE INDEX idx_contracts_agency_hotel ON public.agency_contracts(agency_id, hotel_id);
CREATE INDEX idx_holds_dates ON public.booking_holds(check_in, check_out);