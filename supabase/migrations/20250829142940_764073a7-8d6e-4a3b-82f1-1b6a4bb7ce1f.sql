-- Create trigger function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_empresa_id uuid;
BEGIN
  -- Create a new empresa first
  INSERT INTO public.empresas (id, nome_fantasia, email_admin, plano)
  VALUES (gen_random_uuid(), 'Empresa Padrão', NEW.email, 'Gratuito')
  RETURNING id INTO new_empresa_id;
  
  -- Then create the user profile
  INSERT INTO public.usuarios (id, email, nome, permissao, empresa_id, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'admin',
    new_empresa_id,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to execute the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix existing user by creating empresa first then updating user
DO $$
DECLARE
  new_empresa_id uuid;
  existing_user_id uuid;
BEGIN
  -- Get the existing user ID
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'fernandohenrriquedeoliveira@gmail.com';
  
  IF existing_user_id IS NOT NULL THEN
    -- Create empresa for existing user
    INSERT INTO public.empresas (id, nome_fantasia, email_admin, plano)
    VALUES (gen_random_uuid(), 'Empresa Padrão', 'fernandohenrriquedeoliveira@gmail.com', 'Gratuito')
    RETURNING id INTO new_empresa_id;
    
    -- Create user profile
    INSERT INTO public.usuarios (id, email, nome, permissao, empresa_id, ativo)
    VALUES (existing_user_id, 'fernandohenrriquedeoliveira@gmail.com', 'Fernando Henrique', 'admin', new_empresa_id, true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;