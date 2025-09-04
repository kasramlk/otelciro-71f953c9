-- Grant admin role to the current authenticated user (using proper approach)
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get the current authenticated user ID
    SELECT auth.uid() INTO current_user_id;
    
    -- Only proceed if we have a valid user
    IF current_user_id IS NOT NULL THEN
        -- Insert or update user record in users table
        INSERT INTO users (auth_user_id, email, name, role, org_id)
        SELECT 
            current_user_id, 
            u.email, 
            COALESCE(u.raw_user_meta_data ->> 'name', u.email), 
            'admin',
            '550e8400-e29b-41d4-a716-446655440000'
        FROM auth.users u 
        WHERE u.id = current_user_id
        ON CONFLICT (auth_user_id) DO UPDATE SET role = 'admin';
        
        -- Insert admin role record
        INSERT INTO user_roles (user_id, role) 
        VALUES (current_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role granted to user: %', current_user_id;
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END $$;