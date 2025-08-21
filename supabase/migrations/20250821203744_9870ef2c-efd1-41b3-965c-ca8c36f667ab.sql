-- Add missing foreign key relationships
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_reservation_id 
FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_reservation_id 
FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_reservation_id ON invoices(reservation_id);