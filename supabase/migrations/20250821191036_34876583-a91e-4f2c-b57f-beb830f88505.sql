
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage organization agencies" ON agencies;
DROP POLICY IF EXISTS "Users can view organization agencies" ON agencies;
DROP POLICY IF EXISTS "Users can view organization audit log" ON audit_log;
DROP POLICY IF EXISTS "Users can manage organization cashier sessions" ON cashier_sessions;
DROP POLICY IF EXISTS "Users can view organization cashier sessions" ON cashier_sessions;
DROP POLICY IF EXISTS "Users can manage organization daily rates" ON daily_rates;
DROP POLICY IF EXISTS "Users can view organization daily rates" ON daily_rates;
DROP POLICY IF EXISTS "Users can manage organization guests" ON guests;
DROP POLICY IF EXISTS "Users can view organization guests" ON guests;
DROP POLICY IF EXISTS "Users can view organization hotels" ON hotels;
DROP POLICY IF EXISTS "Users can manage organization housekeeping tasks" ON housekeeping_tasks;
DROP POLICY IF EXISTS "Users can view organization housekeeping tasks" ON housekeeping_tasks;
DROP POLICY IF EXISTS "Users can manage organization inventory" ON inventory;
DROP POLICY IF EXISTS "Users can view organization inventory" ON inventory;
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can manage organization pricing agreements" ON pricing_agreements;
DROP POLICY IF EXISTS "Users can view organization pricing agreements" ON pricing_agreements;
DROP POLICY IF EXISTS "Users can manage organization rate plans" ON rate_plans;
DROP POLICY IF EXISTS "Users can view organization rate plans" ON rate_plans;
DROP POLICY IF EXISTS "Users can manage organization reservation charges" ON reservation_charges;
DROP POLICY IF EXISTS "Users can view organization reservation charges" ON reservation_charges;
DROP POLICY IF EXISTS "Users can manage organization reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view organization reservations" ON reservations;
DROP POLICY IF EXISTS "Users can manage organization room types" ON room_types;
DROP POLICY IF EXISTS "Users can view organization room types" ON room_types;
DROP POLICY IF EXISTS "Users can manage organization rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view organization rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view organization users" ON users;

-- Organizations
CREATE POLICY org_select ON organizations
FOR SELECT USING (
  id IN (SELECT org_id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY org_update ON organizations
FOR UPDATE USING (
  id IN (SELECT org_id FROM users WHERE auth_user_id = auth.uid() AND role='Owner')
);

-- Users  
CREATE POLICY users_select ON users
FOR SELECT USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY users_update ON users
FOR UPDATE USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id = auth.uid() AND role='Owner')
);

-- Hotels
CREATE POLICY hotels_select ON hotels
FOR SELECT USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY hotels_update ON hotels
FOR UPDATE USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id = auth.uid() AND role IN ('Owner','Manager'))
);

-- Reservations
CREATE POLICY reservations_rw ON reservations
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON u.org_id = h.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Guests
CREATE POLICY guests_rw ON guests
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON u.org_id = h.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Reservation Charges (Folios)
CREATE POLICY charges_rw ON reservation_charges
FOR ALL USING (
  reservation_id IN (
    SELECT r.id FROM reservations r
    JOIN hotels h ON r.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Rooms & RoomTypes
CREATE POLICY rooms_rw ON rooms
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY roomtypes_rw ON room_types
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Rate Plans / DailyRates / Inventory
CREATE POLICY rateplans_rw ON rate_plans
FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id=u.org_id WHERE u.auth_user_id=auth.uid())
);

CREATE POLICY dailyrates_rw ON daily_rates
FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id=u.org_id WHERE u.auth_user_id=auth.uid())
);

CREATE POLICY inventory_rw ON inventory
FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id=u.org_id WHERE u.auth_user_id=auth.uid())
);

-- Housekeeping Tasks
CREATE POLICY housekeeping_rw ON housekeeping_tasks
FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id=u.org_id WHERE u.auth_user_id=auth.uid())
);

-- Agencies / Pricing Agreements
CREATE POLICY agencies_rw ON agencies
FOR ALL USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id=auth.uid())
);

CREATE POLICY agreements_rw ON pricing_agreements
FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id=u.org_id WHERE u.auth_user_id=auth.uid())
);

-- Cashier Sessions
CREATE POLICY cashier_rw ON cashier_sessions
FOR ALL USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id=auth.uid())
);

-- Audit Log
CREATE POLICY audit_select ON audit_log
FOR SELECT USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id=auth.uid())
);
