-- Create trigger function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, permissao, empresa_id, ativo, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'operacional',
    gen_random_uuid(), -- Create a default empresa for now
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to execute the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert missing user profile for existing user
INSERT INTO public.usuarios (id, email, nome, permissao, empresa_id, ativo, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'Fernando Henrique' as nome,
  'admin' as permissao,
  gen_random_uuid() as empresa_id,
  true as ativo,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email = 'fernandohenrriquedeoliveira@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = u.id);

-- Create a default empresa for the user
INSERT INTO public.empresas (id, nome, created_at, updated_at)
SELECT 
  u.empresa_id,
  'Empresa Padrão' as nome,
  NOW() as created_at,
  NOW() as updated_at
FROM public.usuarios u
WHERE u.email = 'fernandohenrriquedeoliveira@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = u.empresa_id);