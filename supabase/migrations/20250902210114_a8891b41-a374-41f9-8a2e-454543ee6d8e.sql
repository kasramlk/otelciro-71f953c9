-- Add current user as admin to user_roles table without ON CONFLICT
INSERT INTO user_roles (user_id, role) 
VALUES ('d0512e42-9072-4b6a-a483-4b9d87dfb353', 'admin');