-- Criar função security definer para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id
  FROM public.usuarios
  WHERE id = _user_id
  LIMIT 1
$$;

-- Criar função para verificar se usuário é conta principal
CREATE OR REPLACE FUNCTION public.is_conta_principal(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conta_principal
  FROM public.usuarios
  WHERE id = _user_id
  LIMIT 1
$$;

-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Main account can manage company users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.usuarios;

-- Criar novas políticas usando as funções security definer
CREATE POLICY "Users can view their own profile"
ON public.usuarios
FOR SELECT
USING (
  (auth.uid())::text = (id)::text 
  OR email = (auth.jwt() ->> 'email'::text)
);

CREATE POLICY "Users can view profiles from their company"
ON public.usuarios
FOR SELECT
USING (
  empresa_id = public.get_user_empresa_id(auth.uid())
);

CREATE POLICY "Users can update their own profile"
ON public.usuarios
FOR UPDATE
USING (
  (auth.uid())::text = (id)::text 
  OR email = (auth.jwt() ->> 'email'::text)
);

CREATE POLICY "Main account can manage company users"
ON public.usuarios
FOR ALL
USING (
  public.is_conta_principal(auth.uid()) = true
  AND empresa_id = public.get_user_empresa_id(auth.uid())
);