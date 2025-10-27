-- Adicionar campos do Stripe na tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS acesso_vitalicio boolean DEFAULT false;

-- Marcar os dois usuários existentes com acesso vitalício
UPDATE public.empresas 
SET acesso_vitalicio = true 
WHERE email_admin = 'fernandohenrriquedeoliveira@gmail.com';

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_empresas_stripe_customer 
ON public.empresas(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_empresas_email_admin 
ON public.empresas(email_admin);