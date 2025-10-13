-- Criar tabela para conciliação bancária
CREATE TABLE IF NOT EXISTS public.financeiro_conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  banco TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  saldo_final NUMERIC NOT NULL DEFAULT 0,
  total_entradas NUMERIC NOT NULL DEFAULT 0,
  total_saidas NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  arquivo_ofx TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para itens da conciliação
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

-- Criar tabela para NFS-e
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
  status TEXT NOT NULL DEFAULT 'emitida',
  link_pdf TEXT,
  link_xml TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.financeiro_conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_conciliacoes_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_nfse ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conciliações
CREATE POLICY "Users can manage conciliacoes from their company"
ON public.financeiro_conciliacoes
FOR ALL
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM usuarios 
    WHERE id::text = auth.uid()::text 
    OR email = auth.jwt()->>'email'
  )
);

CREATE POLICY "Users can manage conciliacoes_itens from their company"
ON public.financeiro_conciliacoes_itens
FOR ALL
USING (
  conciliacao_id IN (
    SELECT id 
    FROM financeiro_conciliacoes 
    WHERE empresa_id IN (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id::text = auth.uid()::text 
      OR email = auth.jwt()->>'email'
    )
  )
);

-- Políticas RLS para NFS-e
CREATE POLICY "Users can manage nfse from their company"
ON public.financeiro_nfse
FOR ALL
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM usuarios 
    WHERE id::text = auth.uid()::text 
    OR email = auth.jwt()->>'email'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_conciliacoes_updated_at
BEFORE UPDATE ON public.financeiro_conciliacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfse_updated_at
BEFORE UPDATE ON public.financeiro_nfse
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();