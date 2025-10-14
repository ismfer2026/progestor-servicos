-- Create table for colaboradores
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  funcao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage colaboradores from their company" 
ON public.colaboradores 
FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id 
  FROM usuarios 
  WHERE (usuarios.id::text = auth.uid()::text OR usuarios.email = (auth.jwt() ->> 'email'::text))
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_colaboradores_updated_at
BEFORE UPDATE ON public.colaboradores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();