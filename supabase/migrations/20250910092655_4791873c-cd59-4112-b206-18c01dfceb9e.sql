-- Create agency for otelciro user
DO $$
DECLARE
    user_uuid uuid;
    agency_uuid uuid;
    org_uuid uuid := '550e8400-e29b-41d4-a716-446655440000'; -- Default org ID
BEGIN
    -- Get the user ID for info@otelciro.com
    SELECT auth_user_id INTO user_uuid 
    FROM public.users 
    WHERE email = 'info@otelciro.com'
    LIMIT 1;
    
    -- If user doesn't exist, create it first
    IF user_uuid IS NULL THEN
        -- Create user record first (this would normally be handled by auth trigger)
        INSERT INTO public.users (auth_user_id, email, name, role, org_id)
        SELECT id, email, COALESCE(raw_user_meta_data ->> 'name', email), 'admin', org_uuid
        FROM auth.users 
        WHERE email = 'info@otelciro.com'
        RETURNING auth_user_id INTO user_uuid;
    END IF;
    
    -- Create the agency
    INSERT INTO public.agencies (
        id,
        name,
        type,
        owner_id,
        org_id,
        contact_email,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'otelciro',
        'OTA',
        user_uuid,
        org_uuid,
        'info@otelciro.com',
        true,
        now(),
        now()
    ) RETURNING id INTO agency_uuid;
    
    -- Add the user as owner in agency_users
    INSERT INTO public.agency_users (
        agency_id,
        user_id,
        role,
        is_active,
        joined_at,
        invited_at
    ) VALUES (
        agency_uuid,
        user_uuid,
        'owner',
        true,
        now(),
        now()
    ) ON CONFLICT (agency_id, user_id) DO NOTHING;
    
    -- Create a default profile if it doesn't exist
    INSERT INTO public.profiles (
        id,
        display_name,
        first_name,
        last_name
    ) VALUES (
        user_uuid,
        'Otelciro Admin',
        'Otelciro',
        'Admin'
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Agency "otelciro" created successfully for user info@otelciro.com';
END $$;