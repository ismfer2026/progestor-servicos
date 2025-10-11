-- Criar tabela para histórico de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.estoque_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  item_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  tipo_movimentacao TEXT NOT NULL, -- 'liberacao_reserva', 'rejeicao_manutencao', 'conclusao_manutencao'
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

-- Enable RLS
ALTER TABLE public.estoque_historico ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage historico from their company
CREATE POLICY "Users can manage estoque_historico from their company"
ON public.estoque_historico
FOR ALL
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_estoque_historico_item_id ON public.estoque_historico(item_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_empresa_id ON public.estoque_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_created_at ON public.estoque_historico(created_at DESC);