
-- Create admin user with temporary password (must change at first login)
DO $$
DECLARE
  admin_uid UUID;
  admin_email TEXT := 'michelerossetti07@gmail.com';
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_uid FROM auth.users WHERE email = admin_email;

  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_uid,
      'authenticated',
      'authenticated',
      admin_email,
      crypt('Admin2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Michele Rossetti"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), admin_uid,
      jsonb_build_object('sub', admin_uid::text, 'email', admin_email),
      'email', admin_uid::text,
      now(), now(), now()
    );
  END IF;

  -- Add to admins table
  INSERT INTO public.admins (user_id) VALUES (admin_uid)
  ON CONFLICT (user_id) DO NOTHING;
END $$;
