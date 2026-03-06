-- ==============================================================================
-- SCRIPT SQL COMPLETO - PROGESTOR DE SERVIÇOS
-- Recriar todas as tabelas, ENUMs, funções, triggers e políticas RLS
-- ==============================================================================

-- ============================
-- 1. CREATE ENUMS
-- ============================

CREATE TYPE public.app_role AS ENUM (
  'administrador',
  'gerente',
  'lider',
  'colaborador',
  'personalizado'
);

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

-- ============================
-- 2. CREATE UTILITY FUNCTIONS
-- ============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check if user has specific role
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

-- Function to check if user has module access
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

-- Function to get user modules
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

-- Function to count active users by company
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

-- Function to get user company ID
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

-- Function to check if user is main account
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

-- Function to create default funnel stages
CREATE OR REPLACE FUNCTION public.criar_etapas_padrao_funil(p_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO funil_etapas (empresa_id, nome, cor, ordem) VALUES
    (p_empresa_id, 'Novo Lead', '#3B82F6', 1),
    (p_empresa_id, 'Contato Inicial', '#10B981', 2),
    (p_empresa_id, 'Proposta Enviada', '#8B5CF6', 3),
    (p_empresa_id, 'Negociação', '#F59E0B', 4),
    (p_empresa_id, 'Fechado', '#22C55E', 5),
    (p_empresa_id, 'Perdido', '#EF4444', 6);
END;
$$;

-- Function for trigger to create funnel stages on new company
CREATE OR REPLACE FUNCTION public.trigger_criar_etapas_funil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM criar_etapas_padrao_funil(NEW.id);
  RETURN NEW;
END;
$$;

-- Function to handle new user creation in auth
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
  INSERT INTO public.usuarios (id, email, nome, permissao, empresa_id, ativo, primeiro_acesso, conta_principal)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'admin',
    new_empresa_id,
    true,
    true,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 3. CREATE MAIN TABLES
-- ============================

-- Empresas (Companies)
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  email_admin TEXT NOT NULL,
  plano TEXT DEFAULT 'Gratuito' CHECK (plano IN ('Gratuito', '2 colaboradores', '5 colaboradores', 'Ilimitado')),
  cnpj TEXT,
  cep TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  website TEXT,
  logo_url TEXT,
  limite_usuarios INTEGER DEFAULT 2,
  status_pagamento TEXT DEFAULT 'ativo' CHECK (status_pagamento IN ('ativo', 'pendente', 'atrasado', 'cancelado')),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_primo_pagamento TIMESTAMP WITH TIME ZONE,
  data_ultimo_pagamento TIMESTAMP WITH TIME ZONE,
  data_proximo_pagamento DATE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  acesso_vitalicio BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Usuarios (Users)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_completo TEXT,
  permissao TEXT,
  funcao TEXT,
  empresa_id UUID REFERENCES public.empresas(id),
  ativo BOOLEAN DEFAULT true,
  bloqueado BOOLEAN DEFAULT false,
  conta_principal BOOLEAN DEFAULT false,
  cpf_cnpj TEXT UNIQUE,
  telefone_whatsapp TEXT,
  data_cadastro DATE DEFAULT CURRENT_DATE,
  status_conta TEXT DEFAULT 'ativo' CHECK (status_conta IN ('ativo', 'inativo', 'suspenso')),
  ultimo_pagamento DATE,
  proximo_vencimento DATE,
  observacoes TEXT,
  senha_hash TEXT,
  primeiro_acesso BOOLEAN DEFAULT true,
  limite_usuarios_criacao INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clientes (Clients)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  nome TEXT NOT NULL,
  tipo_pessoa TEXT CHECK (tipo_pessoa IN ('Física', 'Jurídica')),
  documento TEXT,
  email TEXT,
  telefone TEXT,
  telefones TEXT[],
  endereco JSONB,
  tags TEXT[],
  fase_crm TEXT,
  observacoes TEXT,
  servico_id UUID,
  valor_estimado NUMERIC,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Servicos (Services)
CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  cliente_id UUID REFERENCES public.clientes(id),
  data DATE,
  periodo TEXT DEFAULT 'manha',
  horario_ini TIME,
  horario_fim TIME,
  local TEXT,
  responsavel_id UUID REFERENCES public.usuarios(id),
  status TEXT DEFAULT 'Aberto',
  observacoes TEXT,
  preco_venda NUMERIC,
  custo_produto NUMERIC,
  custo_mao_obra NUMERIC,
  custo_encargos NUMERIC,
  markup_percent NUMERIC,
  lucro_liquido NUMERIC,
  valor_total NUMERIC DEFAULT 0,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Servico Items (Service Items)
CREATE TABLE IF NOT EXISTS public.servico_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES public.servicos(id),
  empresa_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  quantidade NUMERIC DEFAULT 1,
  valor_unitario NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  valor_total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orcamentos (Quotes)
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  status TEXT,
  servicos JSONB,
  valor_total NUMERIC,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_validade DATE,
  data_servico DATE,
  horario_inicio TIME,
  horario_fim TIME,
  local_servico TEXT,
  observacoes TEXT,
  data_envio TIMESTAMP WITH TIME ZONE,
  pdf_gerado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orcamentos PDF
CREATE TABLE IF NOT EXISTS public.orcamentos_pdf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Contratos (Contracts)
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  numero_contrato TEXT,
  titulo TEXT,
  valor_total NUMERIC,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  data_assinatura TIMESTAMP WITH TIME ZONE,
  status_assinatura TEXT,
  modelo_id UUID,
  modelo_url TEXT,
  pdf_contrato TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Modelos (Templates)
CREATE TABLE IF NOT EXISTS public.modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('orcamento', 'contrato', 'mensagem', 'email')),
  nome TEXT NOT NULL,
  conteudo_template TEXT NOT NULL,
  publico BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  arquivo_docx_url TEXT,
  variaveis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro (Financial)
CREATE TABLE IF NOT EXISTS public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  contrato_id UUID REFERENCES public.contratos(id),
  tipo TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC NOT NULL,
  categoria TEXT,
  data_venc DATE,
  data_pagto DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro Bancos (Financial - Banks)
CREATE TABLE IF NOT EXISTS public.financeiro_bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  agencia TEXT,
  conta TEXT,
  saldo_inicial NUMERIC DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro Categorias (Financial - Categories)
CREATE TABLE IF NOT EXISTS public.financeiro_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receber', 'pagar', 'ambos')),
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro Centros de Custo (Financial - Cost Centers)
CREATE TABLE IF NOT EXISTS public.financeiro_centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro Movimentacoes (Financial - Transactions)
CREATE TABLE IF NOT EXISTS public.financeiro_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  banco_id UUID REFERENCES public.financeiro_bancos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receber', 'pagar')),
  cliente_id UUID REFERENCES public.clientes(id),
  fornecedor_id TEXT,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente',
  centro_custo TEXT,
  categoria TEXT,
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro Conciliacoes (Financial - Reconciliations)
CREATE TABLE IF NOT EXISTS public.financeiro_conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  banco TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  saldo_inicial NUMERIC DEFAULT 0,
  saldo_final NUMERIC DEFAULT 0,
  total_entradas NUMERIC DEFAULT 0,
  total_saidas NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'em_andamento',
  arquivo_ofx TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro Conciliacoes Itens (Financial - Reconciliation Items)
CREATE TABLE IF NOT EXISTS public.financeiro_conciliacoes_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacao_id UUID NOT NULL REFERENCES public.financeiro_conciliacoes(id) ON DELETE CASCADE,
  movimentacao_id UUID REFERENCES public.financeiro_movimentacoes(id),
  data_transacao DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL,
  conciliado BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financeiro NFS-e (Financial - Service Tax Invoice)
CREATE TABLE IF NOT EXISTS public.financeiro_nfse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  numero_nota TEXT,
  serie TEXT,
  data_emissao DATE NOT NULL,
  data_competencia DATE,
  valor_servico NUMERIC NOT NULL,
  valor_deducoes NUMERIC DEFAULT 0,
  valor_pis NUMERIC DEFAULT 0,
  valor_cofins NUMERIC DEFAULT 0,
  valor_inss NUMERIC DEFAULT 0,
  valor_ir NUMERIC DEFAULT 0,
  valor_csll NUMERIC DEFAULT 0,
  valor_iss NUMERIC DEFAULT 0,
  valor_liquido NUMERIC NOT NULL,
  aliquota_iss NUMERIC DEFAULT 0,
  descricao_servico TEXT NOT NULL,
  codigo_servico TEXT,
  status TEXT DEFAULT 'emitida',
  link_pdf TEXT,
  link_xml TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estoque Itens (Inventory Items)
CREATE TABLE IF NOT EXISTS public.estoque_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  tipo TEXT DEFAULT 'produto',
  nome TEXT NOT NULL,
  sku TEXT,
  descricao TEXT,
  saldo NUMERIC(10,3) DEFAULT 0,
  saldo_minimo NUMERIC(10,3) DEFAULT 0,
  custo NUMERIC(10,2) DEFAULT 0,
  venda NUMERIC(10,2) DEFAULT 0,
  categoria TEXT,
  unidade TEXT DEFAULT 'UN',
  localizacao TEXT,
  status TEXT DEFAULT 'ativo',
  validade DATE,
  dias_aviso_vencimento INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estoque Reservas (Inventory Reservations)
CREATE TABLE IF NOT EXISTS public.estoque_reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.estoque_itens(id),
  servico_id UUID,
  quantidade NUMERIC(10,3) NOT NULL,
  data_reserva DATE NOT NULL,
  data_liberacao DATE,
  status TEXT DEFAULT 'reservado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estoque Manutencao (Inventory Maintenance)
CREATE TABLE IF NOT EXISTS public.estoque_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.estoque_itens(id),
  defeito TEXT NOT NULL,
  data_entrada DATE DEFAULT CURRENT_DATE,
  previsao_retorno DATE,
  data_retorno DATE,
  custo_manutencao NUMERIC(10,2),
  observacoes TEXT,
  status TEXT DEFAULT 'em_manutencao',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estoque Historico (Inventory History)
CREATE TABLE IF NOT EXISTS public.estoque_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.estoque_itens(id),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  tipo_movimentacao TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  motivo TEXT,
  venda_id UUID,
  contrato_id UUID,
  manutencao_id UUID,
  reserva_id UUID,
  valor_custo NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT now(),
  detalhes JSONB
);

-- Servicos Estoque Itens (Services - Inventory Junction)
CREATE TABLE IF NOT EXISTS public.servicos_estoque_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  quantidade NUMERIC DEFAULT 1,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Funil Etapas (Sales Funnel - Stages)
CREATE TABLE IF NOT EXISTS public.funil_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3B82F6',
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Funil Cards (Sales Funnel - Cards)
CREATE TABLE IF NOT EXISTS public.funil_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  orcamento_id UUID REFERENCES public.orcamentos(id),
  etapa_id UUID NOT NULL REFERENCES public.funil_etapas(id),
  responsavel_id UUID REFERENCES public.usuarios(id),
  titulo TEXT NOT NULL,
  valor NUMERIC(10,2),
  data_limite DATE,
  observacoes TEXT,
  servicos JSONB DEFAULT '[]'::jsonb,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Funil Anotacoes (Sales Funnel - Annotations)
CREATE TABLE IF NOT EXISTS public.funil_anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.funil_cards(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Funil Mensagens (Sales Funnel - Messages)
CREATE TABLE IF NOT EXISTS public.funil_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.funil_cards(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tarefas (Tasks)
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID REFERENCES public.clientes(id),
  servico_id UUID REFERENCES public.servicos(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  lembrete BOOLEAN DEFAULT false,
  origem TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pendente',
  tipo TEXT DEFAULT 'tarefa',
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notificacoes (Notifications)
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  data_leitura TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuracoes (Settings)
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  chave TEXT NOT NULL,
  valor JSONB,
  tipo TEXT DEFAULT 'texto',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(empresa_id, chave)
);

-- Logs Envio (Send Logs)
CREATE TABLE IF NOT EXISTS public.logs_envio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  tipo_envio TEXT NOT NULL CHECK (tipo_envio IN ('email', 'whatsapp')),
  destinatario TEXT NOT NULL,
  status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'erro', 'pendente')),
  mensagem_erro TEXT,
  enviado_por UUID REFERENCES public.usuarios(id),
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Colaboradores (Employees)
CREATE TABLE IF NOT EXISTS public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  nome TEXT NOT NULL,
  funcao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles (User - Role Junction)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- User Modulos Acesso (User - Module Access Junction)
CREATE TABLE IF NOT EXISTS public.user_modulos_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  modulo modulo_acesso NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, modulo)
);

-- Agenda Servicos (Service Schedule)
CREATE TABLE IF NOT EXISTS public.agenda_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  usuario_id UUID REFERENCES public.usuarios(id),
  cliente_id UUID REFERENCES public.clientes(id),
  data_hora TIMESTAMP WITH TIME ZONE,
  servico TEXT,
  observacao TEXT,
  google_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================
-- 4. CREATE INDEXES
-- ============================

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf_cnpj ON public.usuarios(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_pessoa ON public.clientes(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_clientes_fase_crm ON public.clientes(fase_crm);
CREATE INDEX IF NOT EXISTS idx_servicos_empresa_id ON public.servicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_empresa_id ON public.orcamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON public.orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_empresa_id ON public.contratos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_empresa_id ON public.financeiro(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_itens_empresa_id ON public.estoque_itens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_empresa_id ON public.estoque_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_item_id ON public.estoque_historico(item_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_created_at ON public.estoque_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funil_cards_empresa_id ON public.funil_cards(empresa_id);
CREATE INDEX IF NOT EXISTS idx_funil_etapas_empresa_id ON public.funil_etapas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_id ON public.tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON public.tarefas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_modulos_user_id ON public.user_modulos_acesso(user_id);
CREATE INDEX IF NOT EXISTS idx_empresas_stripe_customer ON public.empresas(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_empresas_email_admin ON public.empresas(email_admin);
CREATE INDEX IF NOT EXISTS idx_servicos_estoque_itens_servico_id ON public.servicos_estoque_itens(servico_id);
CREATE INDEX IF NOT EXISTS idx_servicos_estoque_itens_item_id ON public.servicos_estoque_itens(item_id);

-- ============================
-- 5. ENABLE RLS ON ALL TABLES
-- ============================

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servico_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos_pdf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_conciliacoes_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_estoque_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modulos_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_servicos ENABLE ROW LEVEL SECURITY;

-- ============================
-- 6. CREATE RLS POLICIES
-- ============================

-- Usuarios Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
CREATE POLICY "Users can view their own profile"
  ON public.usuarios FOR SELECT
  USING (
    (auth.uid())::text = (id)::text 
    OR email = (auth.jwt() ->> 'email'::text)
  );

DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.usuarios;
CREATE POLICY "Users can view profiles from their company"
  ON public.usuarios FOR SELECT
  USING (
    empresa_id = public.get_user_empresa_id(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.usuarios;
CREATE POLICY "Users can update their own profile"
  ON public.usuarios FOR UPDATE
  USING (
    (auth.uid())::text = (id)::text 
    OR email = (auth.jwt() ->> 'email'::text)
  );

DROP POLICY IF EXISTS "Main account can manage company users" ON public.usuarios;
CREATE POLICY "Main account can manage company users"
  ON public.usuarios FOR ALL
  USING (
    public.is_conta_principal(auth.uid()) = true
    AND empresa_id = public.get_user_empresa_id(auth.uid())
  );

-- Clientes Policies
DROP POLICY IF EXISTS "Users can view clients from their company" ON public.clientes;
CREATE POLICY "Users can view clients from their company" 
  ON public.clientes FOR SELECT 
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Users can create clients for their company" ON public.clientes;
CREATE POLICY "Users can create clients for their company" 
  ON public.clientes FOR INSERT 
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Users can update clients from their company" ON public.clientes;
CREATE POLICY "Users can update clients from their company" 
  ON public.clientes FOR UPDATE 
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

-- Servicos Policies
DROP POLICY IF EXISTS "Users can view servicos from their company" ON public.servicos;
CREATE POLICY "Users can view servicos from their company" 
  ON public.servicos FOR SELECT 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can manage servicos from their company" ON public.servicos;
CREATE POLICY "Users can manage servicos from their company" 
  ON public.servicos FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Servico Items Policies
DROP POLICY IF EXISTS "Users can manage servico_itens from their company" ON public.servico_itens;
CREATE POLICY "Users can manage servico_itens from their company" 
  ON public.servico_itens FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Orcamentos Policies
DROP POLICY IF EXISTS "Users can view orcamentos from their company" ON public.orcamentos;
CREATE POLICY "Users can view orcamentos from their company" 
  ON public.orcamentos FOR SELECT 
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Users can create orcamentos for their company" ON public.orcamentos;
CREATE POLICY "Users can create orcamentos for their company" 
  ON public.orcamentos FOR INSERT 
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Users can update orcamentos from their company" ON public.orcamentos;
CREATE POLICY "Users can update orcamentos from their company" 
  ON public.orcamentos FOR UPDATE 
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

-- Orcamentos PDF Policies
DROP POLICY IF EXISTS "Users can manage orcamentos_pdf from their company" ON public.orcamentos_pdf;
CREATE POLICY "Users can manage orcamentos_pdf from their company"
  ON public.orcamentos_pdf FOR ALL
  USING (
    orcamento_id IN (
      SELECT id FROM public.orcamentos
      WHERE empresa_id IN (
        SELECT empresa_id FROM public.usuarios
        WHERE id = auth.uid() OR email = auth.jwt()->>'email'
      )
    )
  );

-- Contratos Policies
DROP POLICY IF EXISTS "Users can view contratos from their company" ON public.contratos;
CREATE POLICY "Users can view contratos from their company" 
  ON public.contratos FOR SELECT 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can manage contratos from their company" ON public.contratos;
CREATE POLICY "Users can manage contratos from their company" 
  ON public.contratos FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Modelos Policies
DROP POLICY IF EXISTS "Users can manage modelos from their company" ON public.modelos;
CREATE POLICY "Users can manage modelos from their company" 
  ON public.modelos FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email') OR publico = true);

-- Financeiro Policies
DROP POLICY IF EXISTS "Users can view financeiro from their company" ON public.financeiro;
CREATE POLICY "Users can view financeiro from their company" 
  ON public.financeiro FOR SELECT 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can manage financeiro from their company" ON public.financeiro;
CREATE POLICY "Users can manage financeiro from their company" 
  ON public.financeiro FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Financeiro Bancos Policies
DROP POLICY IF EXISTS "Users can manage bancos from their company" ON public.financeiro_bancos;
CREATE POLICY "Users can manage bancos from their company" 
  ON public.financeiro_bancos FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'));

-- Financeiro Categorias Policies
DROP POLICY IF EXISTS "Users can manage categorias from their company" ON public.financeiro_categorias;
CREATE POLICY "Users can manage categorias from their company" 
  ON public.financeiro_categorias FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'));

-- Financeiro Centros Custo Policies
DROP POLICY IF EXISTS "Users can manage centros_custo from their company" ON public.financeiro_centros_custo;
CREATE POLICY "Users can manage centros_custo from their company" 
  ON public.financeiro_centros_custo FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'));

-- Financeiro Movimentacoes Policies
DROP POLICY IF EXISTS "Users can manage financeiro_movimentacoes from their company" ON public.financeiro_movimentacoes;
CREATE POLICY "Users can manage financeiro_movimentacoes from their company" 
  ON public.financeiro_movimentacoes FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'));

-- Financeiro Conciliacoes Policies
DROP POLICY IF EXISTS "Users can manage conciliacoes from their company" ON public.financeiro_conciliacoes;
CREATE POLICY "Users can manage conciliacoes from their company"
  ON public.financeiro_conciliacoes FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
    )
  );

DROP POLICY IF EXISTS "Users can manage conciliacoes_itens from their company" ON public.financeiro_conciliacoes_itens;
CREATE POLICY "Users can manage conciliacoes_itens from their company"
  ON public.financeiro_conciliacoes_itens FOR ALL
  USING (
    conciliacao_id IN (
      SELECT id FROM public.financeiro_conciliacoes 
      WHERE empresa_id IN (
        SELECT empresa_id FROM public.usuarios 
        WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
      )
    )
  );

-- Financeiro NFS-e Policies
DROP POLICY IF EXISTS "Users can manage nfse from their company" ON public.financeiro_nfse;
CREATE POLICY "Users can manage nfse from their company"
  ON public.financeiro_nfse FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
    )
  );

-- Estoque Itens Policies
DROP POLICY IF EXISTS "Users can manage estoque_itens from their company" ON public.estoque_itens;
CREATE POLICY "Users can manage estoque_itens from their company" 
  ON public.estoque_itens FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'));

-- Estoque Reservas Policies
DROP POLICY IF EXISTS "Users can manage estoque_reservas from their company" ON public.estoque_reservas;
CREATE POLICY "Users can manage estoque_reservas from their company" 
  ON public.estoque_reservas FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'));

-- Estoque Manutencao Policies
DROP POLICY IF EXISTS "Users can manage estoque_manutencao from their company" ON public.estoque_manutencao;
CREATE POLICY "Users can manage estoque_manutencao from their company" 
  ON public.estoque_manutencao FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'));

-- Estoque Historico Policies
DROP POLICY IF EXISTS "Users can manage estoque_historico from their company" ON public.estoque_historico;
CREATE POLICY "Users can manage estoque_historico from their company"
  ON public.estoque_historico FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
    )
  );

-- Servicos Estoque Itens Policies
DROP POLICY IF EXISTS "Users can manage servicos_estoque_itens from their company" ON public.servicos_estoque_itens;
CREATE POLICY "Users can manage servicos_estoque_itens from their company"
  ON public.servicos_estoque_itens FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id = auth.uid() OR email = auth.jwt()->>'email'
    )
  );

-- Funil Etapas Policies
DROP POLICY IF EXISTS "Users can manage funil_etapas from their company" ON public.funil_etapas;
CREATE POLICY "Users can manage funil_etapas from their company" 
  ON public.funil_etapas FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Funil Cards Policies
DROP POLICY IF EXISTS "Users can manage funil_cards from their company" ON public.funil_cards;
CREATE POLICY "Users can manage funil_cards from their company" 
  ON public.funil_cards FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Funil Anotacoes Policies
DROP POLICY IF EXISTS "Users can manage funil_anotacoes from their company" ON public.funil_anotacoes;
CREATE POLICY "Users can manage funil_anotacoes from their company"
  ON public.funil_anotacoes FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

-- Funil Mensagens Policies
DROP POLICY IF EXISTS "Users can manage funil_mensagens from their company" ON public.funil_mensagens;
CREATE POLICY "Users can manage funil_mensagens from their company"
  ON public.funil_mensagens FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
    )
  );

-- Tarefas Policies
DROP POLICY IF EXISTS "Users can manage tarefas from their company" ON public.tarefas;
CREATE POLICY "Users can manage tarefas from their company" 
  ON public.tarefas FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Notificacoes Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notificacoes;
CREATE POLICY "Users can view their own notifications" 
  ON public.notificacoes FOR SELECT 
  USING (usuario_id = auth.uid() AND empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notificacoes;
CREATE POLICY "Users can update their own notifications" 
  ON public.notificacoes FOR UPDATE 
  USING (usuario_id = auth.uid() AND empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can create notifications for their company" ON public.notificacoes;
CREATE POLICY "Users can create notifications for their company"
  ON public.notificacoes FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
    )
  );

-- Configuracoes Policies
DROP POLICY IF EXISTS "Users can manage configuracoes from their company" ON public.configuracoes;
CREATE POLICY "Users can manage configuracoes from their company" 
  ON public.configuracoes FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Logs Envio Policies
DROP POLICY IF EXISTS "Users can view logs_envio from their company" ON public.logs_envio;
CREATE POLICY "Users can view logs_envio from their company" 
  ON public.logs_envio FOR SELECT 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can create logs_envio for their company" ON public.logs_envio;
CREATE POLICY "Users can create logs_envio for their company" 
  ON public.logs_envio FOR INSERT 
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can update logs_envio from their company" ON public.logs_envio;
CREATE POLICY "Users can update logs_envio from their company" 
  ON public.logs_envio FOR UPDATE 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- Colaboradores Policies
DROP POLICY IF EXISTS "Users can manage colaboradores from their company" ON public.colaboradores;
CREATE POLICY "Users can manage colaboradores from their company" 
  ON public.colaboradores FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE usuarios.id::text = auth.uid()::text OR usuarios.email = auth.jwt() ->> 'email'::text));

-- User Roles Policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
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

DROP POLICY IF EXISTS "Main account can manage roles" ON public.user_roles;
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

-- User Modulos Acesso Policies
DROP POLICY IF EXISTS "Users can view their own module access" ON public.user_modulos_acesso;
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

DROP POLICY IF EXISTS "Main account can manage module access" ON public.user_modulos_acesso;
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

-- Agenda Servicos Policies
DROP POLICY IF EXISTS "Users can view agenda_servicos from their company" ON public.agenda_servicos;
CREATE POLICY "Users can view agenda_servicos from their company" 
  ON public.agenda_servicos FOR SELECT 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can manage agenda_servicos from their company" ON public.agenda_servicos;
CREATE POLICY "Users can manage agenda_servicos from their company" 
  ON public.agenda_servicos FOR ALL 
  USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

-- ============================
-- 7. CREATE TRIGGERS FOR TIMESTAMPS
-- ============================

DROP TRIGGER IF EXISTS update_servicos_updated_at ON public.servicos;
CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_servico_itens_updated_at ON public.servico_itens;
CREATE TRIGGER update_servico_itens_updated_at
  BEFORE UPDATE ON public.servico_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orcamentos_updated_at ON public.orcamentos;
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contratos_updated_at ON public.contratos;
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_modelos_updated_at ON public.modelos;
CREATE TRIGGER update_modelos_updated_at
  BEFORE UPDATE ON public.modelos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financeiro_movimentacoes_updated_at ON public.financeiro_movimentacoes;
CREATE TRIGGER update_financeiro_movimentacoes_updated_at
  BEFORE UPDATE ON public.financeiro_movimentacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_estoque_itens_updated_at ON public.estoque_itens;
CREATE TRIGGER update_estoque_itens_updated_at
  BEFORE UPDATE ON public.estoque_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_estoque_manutencao_updated_at ON public.estoque_manutencao;
CREATE TRIGGER update_estoque_manutencao_updated_at
  BEFORE UPDATE ON public.estoque_manutencao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funil_cards_updated_at ON public.funil_cards;
CREATE TRIGGER update_funil_cards_updated_at
  BEFORE UPDATE ON public.funil_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tarefas_updated_at ON public.tarefas;
CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracoes_updated_at ON public.configuracoes;
CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_logs_envio_updated_at ON public.logs_envio;
CREATE TRIGGER update_logs_envio_updated_at
  BEFORE UPDATE ON public.logs_envio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;
CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financeiro_bancos_updated_at ON public.financeiro_bancos;
CREATE TRIGGER update_financeiro_bancos_updated_at
  BEFORE UPDATE ON public.financeiro_bancos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financeiro_categorias_updated_at ON public.financeiro_categorias;
CREATE TRIGGER update_financeiro_categorias_updated_at
  BEFORE UPDATE ON public.financeiro_categorias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financeiro_centros_custo_updated_at ON public.financeiro_centros_custo;
CREATE TRIGGER update_financeiro_centros_custo_updated_at
  BEFORE UPDATE ON public.financeiro_centros_custo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financeiro_conciliacoes_updated_at ON public.financeiro_conciliacoes;
CREATE TRIGGER update_financeiro_conciliacoes_updated_at
  BEFORE UPDATE ON public.financeiro_conciliacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nfse_updated_at ON public.financeiro_nfse;
CREATE TRIGGER update_nfse_updated_at
  BEFORE UPDATE ON public.financeiro_nfse
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_servicos_estoque_itens_updated_at ON public.servicos_estoque_itens;
CREATE TRIGGER update_servicos_estoque_itens_updated_at
  BEFORE UPDATE ON public.servicos_estoque_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create funnel stages on new company
DROP TRIGGER IF EXISTS trigger_nova_empresa_etapas ON public.empresas;
CREATE TRIGGER trigger_nova_empresa_etapas
  AFTER INSERT ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_criar_etapas_funil();

-- Trigger to handle new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================
-- 8. SCRIPT COMPLETE
-- ============================

-- Verify the setup
SELECT 'Database schema created successfully!' AS status;
