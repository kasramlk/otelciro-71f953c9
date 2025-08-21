-- Create digital_keys table for mobile/digital key management
CREATE TABLE public.digital_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID NOT NULL,
    reservation_id UUID NOT NULL,
    room_id UUID NOT NULL,
    hotel_id UUID NOT NULL,
    key_code TEXT NOT NULL,
    key_type TEXT NOT NULL DEFAULT 'QR' CHECK (key_type IN ('QR', 'NFC', 'PIN')),
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    access_log JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_requests table for in-stay guest services
CREATE TABLE public.service_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID NOT NULL,
    reservation_id UUID NOT NULL,
    hotel_id UUID NOT NULL,
    room_number TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('Housekeeping', 'Room Service', 'Concierge', 'Maintenance', 'Spa', 'Transport')),
    service_category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Acknowledged', 'In Progress', 'Completed', 'Cancelled')),
    requested_time TIMESTAMP WITH TIME ZONE,
    assigned_to UUID,
    estimated_cost NUMERIC DEFAULT 0,
    actual_cost NUMERIC,
    notes TEXT,
    guest_rating INTEGER CHECK (guest_rating >= 1 AND guest_rating <= 5),
    guest_feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guest_interactions table for logging all guest touchpoints
CREATE TABLE public.guest_interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID NOT NULL,
    hotel_id UUID NOT NULL,
    reservation_id UUID,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('Chat', 'Voice', 'Kiosk', 'Mobile', 'Email', 'SMS', 'WhatsApp')),
    interaction_source TEXT NOT NULL,
    content TEXT,
    ai_response TEXT,
    staff_response TEXT,
    sentiment_score NUMERIC,
    intent_detected TEXT,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    escalated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create e_invoices table for digital invoicing
CREATE TABLE public.e_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    guest_id UUID NOT NULL,
    hotel_id UUID NOT NULL,
    e_invoice_type TEXT NOT NULL CHECK (e_invoice_type IN ('e-arsiv', 'e-fatura', 'standard')),
    document_number TEXT NOT NULL,
    tax_office TEXT,
    tax_number TEXT,
    invoice_date DATE NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC DEFAULT 1,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    digital_signature TEXT,
    xml_content TEXT,
    pdf_url TEXT,
    email_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'failed')),
    compliance_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.digital_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "digital_keys_rw" ON public.digital_keys
FOR ALL USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "service_requests_rw" ON public.service_requests
FOR ALL USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "guest_interactions_rw" ON public.guest_interactions
FOR ALL USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "e_invoices_rw" ON public.e_invoices
FOR ALL USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_digital_keys_reservation ON public.digital_keys(reservation_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status, hotel_id);
CREATE INDEX idx_guest_interactions_type ON public.guest_interactions(interaction_type, hotel_id);
CREATE INDEX idx_e_invoices_status ON public.e_invoices(status, hotel_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_e_invoices_updated_at
    BEFORE UPDATE ON public.e_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();