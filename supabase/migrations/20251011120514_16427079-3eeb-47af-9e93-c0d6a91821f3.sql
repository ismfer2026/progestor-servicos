-- Add new fields to estoque_itens table for expiry management
ALTER TABLE public.estoque_itens 
ADD COLUMN IF NOT EXISTS validade DATE,
ADD COLUMN IF NOT EXISTS dias_aviso_vencimento INTEGER DEFAULT 7;

COMMENT ON COLUMN public.estoque_itens.validade IS 'Data de validade do item';
COMMENT ON COLUMN public.estoque_itens.dias_aviso_vencimento IS 'Quantos dias antes do vencimento deve gerar alerta';