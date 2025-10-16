-- Criar enum para roles/funções
CREATE TYPE public.app_role AS ENUM (
  'administrador',
  'gerente',
  'lider',
  'colaborador',
  'personalizado'
);

-- Criar enum para módulos de acesso
CREATE TYPE public.modulo_acesso AS ENUM (
  'dashboard',
  'orcamentos',
  'servicos',
  'funil_vendas',
  'agenda',
  'clientes',
  'estoque',
  'financeiro',
  'contratos',
  'relatorios',
  'configuracoes',
  'vendas'
);

-- Adicionar novos campos à tabela usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nome_completo TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS telefone_whatsapp TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT UNIQUE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS data_cadastro DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS status_conta TEXT DEFAULT 'ativo' CHECK (status_conta IN ('ativo', 'inativo', 'suspenso'));
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_pagamento DATE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS proximo_vencimento DATE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS conta_principal BOOLEAN DEFAULT false;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true;

-- Atualizar campo funcao para usar o enum
ALTER TABLE public.usuarios ALTER COLUMN funcao TYPE TEXT;

-- Criar tabela de roles/permissões por usuário
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Criar tabela de módulos de acesso por usuário
CREATE TABLE IF NOT EXISTS public.user_modulos_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  modulo modulo_acesso NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, modulo)
);

-- Adicionar campos de plano à tabela empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS limite_usuarios INTEGER DEFAULT 2;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_proximo_pagamento DATE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_ultimo_pagamento DATE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'ativo' CHECK (status_pagamento IN ('ativo', 'pendente', 'atrasado', 'cancelado'));

-- Atualizar plano da empresa para incluir os novos valores
ALTER TABLE public.empresas DROP CONSTRAINT IF EXISTS empresas_plano_check;
ALTER TABLE public.empresas ADD CONSTRAINT empresas_plano_check 
  CHECK (plano IN ('Gratuito', '2 colaboradores', '5 colaboradores', 'Ilimitado'));

-- Função para verificar se usuário tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário tem acesso a um módulo
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id UUID, _modulo modulo_acesso)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_modulos_acesso
    WHERE user_id = _user_id
      AND modulo = _modulo
  )
$$;

-- Função para obter todos os módulos de um usuário
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id UUID)
RETURNS SETOF modulo_acesso
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT modulo
  FROM public.user_modulos_acesso
  WHERE user_id = _user_id
$$;

-- Função para contar usuários ativos por empresa
CREATE OR REPLACE FUNCTION public.count_active_users(_empresa_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.usuarios
  WHERE empresa_id = _empresa_id
    AND status_conta = 'ativo'
    AND ativo = true
$$;

-- Enable RLS nas novas tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modulos_acesso ENABLE ROW LEVEL SECURITY;

-- Policies para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND empresa_id IN (
          SELECT empresa_id FROM public.usuarios WHERE id = user_roles.user_id
        )
        AND conta_principal = true
    )
  );

CREATE POLICY "Main account can manage roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND conta_principal = true
        AND empresa_id IN (
          SELECT empresa_id FROM public.usuarios WHERE id = user_roles.user_id
        )
    )
  );

-- Policies para user_modulos_acesso
CREATE POLICY "Users can view their own module access"
  ON public.user_modulos_acesso FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND empresa_id IN (
          SELECT empresa_id FROM public.usuarios WHERE id = user_modulos_acesso.user_id
        )
        AND conta_principal = true
    )
  );

CREATE POLICY "Main account can manage module access"
  ON public.user_modulos_acesso FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND conta_principal = true
        AND empresa_id IN (
          SELECT empresa_id FROM public.usuarios WHERE id = user_modulos_acesso.user_id
        )
    )
  );

-- Atualizar policy de visualização de usuários para incluir usuários da mesma empresa
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
CREATE POLICY "Users can view profiles from their company"
  ON public.usuarios FOR SELECT
  USING (
    (auth.uid())::text = (id)::text OR
    email = (auth.jwt() ->> 'email'::text) OR
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios
      WHERE (auth.uid())::text = (id)::text OR email = (auth.jwt() ->> 'email'::text)
    )
  );

-- Policy para conta principal gerenciar usuários
CREATE POLICY "Main account can manage company users"
  ON public.usuarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios AS u
      WHERE u.id = auth.uid()
        AND u.conta_principal = true
        AND u.empresa_id = usuarios.empresa_id
    )
  );

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf_cnpj ON public.usuarios(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_modulos_user_id ON public.user_modulos_acesso(user_id);