-- Create reservation_charges table for folio management
CREATE TABLE public.reservation_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('Charge', 'Payment')),
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  voided_at TIMESTAMP WITH TIME ZONE,
  voided_by UUID REFERENCES public.users(id),
  void_reason TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reservation_charges
ALTER TABLE public.reservation_charges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reservation_charges
CREATE POLICY "Users can view organization reservation charges" 
ON public.reservation_charges 
FOR SELECT 
USING (reservation_id IN (
  SELECT r.id FROM public.reservations r
  JOIN public.hotels h ON r.hotel_id = h.id
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization reservation charges" 
ON public.reservation_charges 
FOR ALL 
USING (reservation_id IN (
  SELECT r.id FROM public.reservations r
  JOIN public.hotels h ON r.hotel_id = h.id
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reservation_charges_updated_at
BEFORE UPDATE ON public.reservation_charges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_reservation_charges_reservation_id ON public.reservation_charges(reservation_id);
CREATE INDEX idx_reservation_charges_posted_at ON public.reservation_charges(posted_at);
CREATE INDEX idx_reservation_charges_type ON public.reservation_charges(type);