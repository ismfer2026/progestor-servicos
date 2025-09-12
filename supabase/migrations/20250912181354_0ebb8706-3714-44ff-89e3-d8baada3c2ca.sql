-- Alterar tabela servicos para incluir campos de execução de serviços
ALTER TABLE public.servicos 
ADD COLUMN IF NOT EXISTS cliente_id UUID,
ADD COLUMN IF NOT EXISTS data DATE,
ADD COLUMN IF NOT EXISTS periodo TEXT DEFAULT 'manha',
ADD COLUMN IF NOT EXISTS horario_ini TIME,
ADD COLUMN IF NOT EXISTS horario_fim TIME,
ADD COLUMN IF NOT EXISTS local TEXT,
ADD COLUMN IF NOT EXISTS responsavel_id UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aberto',
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar trigger para updated_at na tabela servicos
CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON public.servicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela servico_itens para itens vinculados aos serviços
CREATE TABLE IF NOT EXISTS public.servico_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servico_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on servico_itens
ALTER TABLE public.servico_itens ENABLE ROW LEVEL SECURITY;

-- Policies for servico_itens
CREATE POLICY "Users can manage servico_itens from their company" 
ON public.servico_itens 
FOR ALL 
USING (empresa_id IN ( SELECT usuarios.empresa_id
   FROM usuarios
  WHERE (((auth.uid())::text = (usuarios.id)::text) OR (usuarios.email = (auth.jwt() ->> 'email'::text)))));

-- Trigger para updated_at na tabela servico_itens
CREATE TRIGGER update_servico_itens_updated_at
BEFORE UPDATE ON public.servico_itens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();