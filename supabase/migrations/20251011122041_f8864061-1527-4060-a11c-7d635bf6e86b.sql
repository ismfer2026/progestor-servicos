-- Create junction table for services and inventory items
CREATE TABLE IF NOT EXISTS public.servicos_estoque_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.servicos_estoque_itens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage servicos_estoque_itens from their company"
ON public.servicos_estoque_itens
FOR ALL
USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE id::text = auth.uid()::text OR email = auth.jwt()->>'email'
  )
);

-- Create index for better performance
CREATE INDEX idx_servicos_estoque_itens_servico_id ON public.servicos_estoque_itens(servico_id);
CREATE INDEX idx_servicos_estoque_itens_item_id ON public.servicos_estoque_itens(item_id);

-- Add trigger for updated_at
CREATE TRIGGER update_servicos_estoque_itens_updated_at
BEFORE UPDATE ON public.servicos_estoque_itens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();