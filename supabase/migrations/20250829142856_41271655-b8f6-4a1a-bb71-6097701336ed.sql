-- Create trigger function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, permissao, empresa_id, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'operacional',
    gen_random_uuid(), -- Create a default empresa for now
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

-- Insert missing user profile for existing user
INSERT INTO public.usuarios (id, email, nome, permissao, empresa_id, ativo)
SELECT 
  u.id,
  u.email,
  'Fernando Henrique' as nome,
  'admin' as permissao,
  gen_random_uuid() as empresa_id,
  true as ativo
FROM auth.users u
WHERE u.email = 'fernandohenrriquedeoliveira@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = u.id);

-- Create a default empresa for the user
INSERT INTO public.empresas (id, nome_fantasia, email_admin, plano)
SELECT 
  u.empresa_id,
  'Empresa Padrão' as nome_fantasia,
  u.email as email_admin,
  'Gratuito' as plano
FROM public.usuarios u
WHERE u.email = 'fernandohenrriquedeoliveira@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = u.empresa_id);