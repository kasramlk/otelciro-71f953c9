-- Create a demo organization
INSERT INTO organizations (id, name, billing_email) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Demo Hotels Group', 'billing@demohotels.com');

-- Create sample hotels for the organization
INSERT INTO hotels (id, org_id, name, code, address, city, country, timezone, phone) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Grand Plaza Manhattan', 'GPM001', '123 Broadway Ave', 'New York', 'United States', 'America/New_York', '+1 (555) 123-4567'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Sunset Beach Resort', 'SBR002', '456 Ocean Drive', 'Miami', 'United States', 'America/New_York', '+1 (555) 987-6543'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Royal Westminster Hotel', 'RWH003', '78 Piccadilly Circus', 'London', 'United Kingdom', 'Europe/London', '+44 20 7123 4567'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Edinburgh Castle View', 'ECV004', '15 Royal Mile', 'Edinburgh', 'United Kingdom', 'Europe/London', '+44 131 555 0123'),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Tokyo Imperial Suites', 'TIS005', '2-1-1 Shibuya', 'Tokyo', 'Japan', 'Asia/Tokyo', '+81 3-1234-5678'),
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'Kyoto Zen Garden Hotel', 'KZG006', '123 Gion District', 'Kyoto', 'Japan', 'Asia/Tokyo', '+81 75-567-8901');

-- Create a function to handle new user signup and link to our demo org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@hotel-pms.com' THEN
    INSERT INTO public.users (auth_user_id, email, name, role, org_id)
    VALUES (NEW.id, NEW.email, 'Admin User', 'Owner', '550e8400-e29b-41d4-a716-446655440000');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();