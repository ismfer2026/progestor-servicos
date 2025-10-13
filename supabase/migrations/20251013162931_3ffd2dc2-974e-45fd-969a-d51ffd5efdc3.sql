-- Criar tabela de bancos
CREATE TABLE IF NOT EXISTS public.financeiro_bancos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Criar tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS public.financeiro_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receber', 'pagar', 'ambos')),
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de centros de custo
CREATE TABLE IF NOT EXISTS public.financeiro_centros_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financeiro_bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_centros_custo ENABLE ROW LEVEL SECURITY;

-- Policies para bancos
CREATE POLICY "Users can manage bancos from their company" 
ON public.financeiro_bancos 
FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuarios 
  WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
));

-- Policies para categorias
CREATE POLICY "Users can manage categorias from their company" 
ON public.financeiro_categorias 
FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuarios 
  WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
));

-- Policies para centros de custo
CREATE POLICY "Users can manage centros_custo from their company" 
ON public.financeiro_centros_custo 
FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuarios 
  WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
));

-- Triggers para updated_at
CREATE TRIGGER update_financeiro_bancos_updated_at
BEFORE UPDATE ON public.financeiro_bancos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financeiro_categorias_updated_at
BEFORE UPDATE ON public.financeiro_categorias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financeiro_centros_custo_updated_at
BEFORE UPDATE ON public.financeiro_centros_custo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna banco_id na tabela financeiro_movimentacoes
ALTER TABLE public.financeiro_movimentacoes
ADD COLUMN IF NOT EXISTS banco_id UUID REFERENCES public.financeiro_bancos(id);