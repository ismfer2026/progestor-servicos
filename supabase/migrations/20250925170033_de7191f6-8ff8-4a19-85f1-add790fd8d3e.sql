-- Create funil_etapas table for CRM pipeline stages
CREATE TABLE IF NOT EXISTS public.funil_etapas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3B82F6',
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create funil_cards table for CRM pipeline cards
CREATE TABLE IF NOT EXISTS public.funil_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  cliente_id UUID,
  orcamento_id UUID,
  etapa_id UUID NOT NULL,
  responsavel_id UUID,
  titulo TEXT NOT NULL,
  valor NUMERIC(10,2),
  data_limite DATE,
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tarefas table for agenda and task management
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID,
  servico_id UUID,
  usuario_id UUID,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  lembrete BOOLEAN DEFAULT false,
  origem TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pendente',
  tipo TEXT DEFAULT 'tarefa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create estoque_itens table for inventory management
CREATE TABLE IF NOT EXISTS public.estoque_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create estoque_reservas table for reserved inventory items
CREATE TABLE IF NOT EXISTS public.estoque_reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  item_id UUID NOT NULL,
  servico_id UUID,
  quantidade NUMERIC(10,3) NOT NULL,
  data_reserva DATE NOT NULL,
  data_liberacao DATE,
  status TEXT DEFAULT 'reservado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create estoque_manutencao table for items under maintenance
CREATE TABLE IF NOT EXISTS public.estoque_manutencao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  item_id UUID NOT NULL,
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

-- Create financeiro_movimentacoes table for financial transactions
CREATE TABLE IF NOT EXISTS public.financeiro_movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receber', 'pagar')),
  cliente_id UUID,
  fornecedor_id TEXT,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
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

-- Create modelos table for templates
CREATE TABLE IF NOT EXISTS public.modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('orcamento', 'contrato', 'mensagem', 'email')),
  nome TEXT NOT NULL,
  conteudo_template TEXT NOT NULL,
  publico BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  variaveis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notificacoes table for notifications
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  data_leitura TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create configuracoes table for system settings
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  chave TEXT NOT NULL,
  valor JSONB,
  tipo TEXT DEFAULT 'texto',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(empresa_id, chave)
);

-- Enable RLS on new tables
ALTER TABLE public.funil_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for funil_etapas
CREATE POLICY "Users can manage funil_etapas from their company" ON public.funil_etapas
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for funil_cards
CREATE POLICY "Users can manage funil_cards from their company" ON public.funil_cards
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for tarefas
CREATE POLICY "Users can manage tarefas from their company" ON public.tarefas
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for estoque_itens
CREATE POLICY "Users can manage estoque_itens from their company" ON public.estoque_itens
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for estoque_reservas
CREATE POLICY "Users can manage estoque_reservas from their company" ON public.estoque_reservas
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for estoque_manutencao
CREATE POLICY "Users can manage estoque_manutencao from their company" ON public.estoque_manutencao
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for financeiro_movimentacoes
CREATE POLICY "Users can manage financeiro_movimentacoes from their company" ON public.financeiro_movimentacoes
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for modelos
CREATE POLICY "Users can manage modelos from their company" ON public.modelos
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ) OR publico = true);

-- Create RLS policies for notificacoes
CREATE POLICY "Users can view their own notifications" ON public.notificacoes
  FOR SELECT USING (usuario_id = auth.uid() AND empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Users can update their own notifications" ON public.notificacoes
  FOR UPDATE USING (usuario_id = auth.uid() AND empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create RLS policies for configuracoes
CREATE POLICY "Users can manage configuracoes from their company" ON public.configuracoes
  FOR ALL USING (empresa_id IN (
    SELECT usuarios.empresa_id FROM usuarios 
    WHERE auth.uid()::text = usuarios.id::text OR usuarios.email = auth.jwt() ->> 'email'
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_funil_cards_updated_at
  BEFORE UPDATE ON public.funil_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estoque_itens_updated_at
  BEFORE UPDATE ON public.estoque_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estoque_manutencao_updated_at
  BEFORE UPDATE ON public.estoque_manutencao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financeiro_movimentacoes_updated_at
  BEFORE UPDATE ON public.financeiro_movimentacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modelos_updated_at
  BEFORE UPDATE ON public.modelos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();