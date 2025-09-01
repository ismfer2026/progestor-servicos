-- Create logs_envio table for tracking email/WhatsApp sends
CREATE TABLE public.logs_envio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  tipo_envio TEXT NOT NULL CHECK (tipo_envio IN ('email', 'whatsapp')),
  destinatario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'erro', 'pendente')),
  mensagem_erro TEXT,
  enviado_por UUID,
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.logs_envio ENABLE ROW LEVEL SECURITY;

-- Create policies for logs_envio
CREATE POLICY "Users can view logs_envio from their company" 
ON public.logs_envio 
FOR SELECT 
USING (empresa_id IN (
  SELECT usuarios.empresa_id
  FROM usuarios
  WHERE ((auth.uid())::text = (usuarios.id)::text) OR (usuarios.email = (auth.jwt() ->> 'email'::text))
));

CREATE POLICY "Users can create logs_envio for their company" 
ON public.logs_envio 
FOR INSERT 
WITH CHECK (empresa_id IN (
  SELECT usuarios.empresa_id
  FROM usuarios
  WHERE ((auth.uid())::text = (usuarios.id)::text) OR (usuarios.email = (auth.jwt() ->> 'email'::text))
));

CREATE POLICY "Users can update logs_envio from their company" 
ON public.logs_envio 
FOR UPDATE 
USING (empresa_id IN (
  SELECT usuarios.empresa_id
  FROM usuarios
  WHERE ((auth.uid())::text = (usuarios.id)::text) OR (usuarios.email = (auth.jwt() ->> 'email'::text))
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_logs_envio_updated_at
BEFORE UPDATE ON public.logs_envio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();