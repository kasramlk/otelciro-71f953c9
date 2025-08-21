-- Create housekeeping_tasks table
CREATE TABLE public.housekeeping_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id),
  task_type TEXT NOT NULL DEFAULT 'Cleaning',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'InProgress', 'Done')),
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update rooms table to include status
ALTER TABLE public.rooms ADD COLUMN housekeeping_status TEXT NOT NULL DEFAULT 'Clean' CHECK (housekeeping_status IN ('Clean', 'Dirty', 'Inspected', 'OutOfOrder'));

-- Enable RLS on housekeeping_tasks
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for housekeeping_tasks
CREATE POLICY "Users can view organization housekeeping tasks" 
ON public.housekeeping_tasks 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization housekeeping tasks" 
ON public.housekeeping_tasks 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_housekeeping_tasks_updated_at
BEFORE UPDATE ON public.housekeeping_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_housekeeping_tasks_hotel_id ON public.housekeeping_tasks(hotel_id);
CREATE INDEX idx_housekeeping_tasks_room_id ON public.housekeeping_tasks(room_id);
CREATE INDEX idx_housekeeping_tasks_status ON public.housekeeping_tasks(status);
CREATE INDEX idx_housekeeping_tasks_assigned_to ON public.housekeeping_tasks(assigned_to);
CREATE INDEX idx_rooms_housekeeping_status ON public.rooms(housekeeping_status);