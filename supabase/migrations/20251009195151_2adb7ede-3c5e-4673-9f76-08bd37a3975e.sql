-- Create table for funil annotations
CREATE TABLE IF NOT EXISTS public.funil_anotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.funil_cards(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for funil WhatsApp messages
CREATE TABLE IF NOT EXISTS public.funil_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.funil_cards(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  mensagem TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on funil_anotacoes
ALTER TABLE public.funil_anotacoes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on funil_mensagens
ALTER TABLE public.funil_mensagens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for funil_anotacoes
CREATE POLICY "Users can manage funil_anotacoes from their company"
ON public.funil_anotacoes
FOR ALL
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

-- Create RLS policies for funil_mensagens
CREATE POLICY "Users can manage funil_mensagens from their company"
ON public.funil_mensagens
FOR ALL
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);