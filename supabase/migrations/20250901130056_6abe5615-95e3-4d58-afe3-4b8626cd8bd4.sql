-- Fix the function search_path issue by adding the correct security definer settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
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
$function$;