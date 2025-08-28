-- Enable RLS on all main tables
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_servicos ENABLE ROW LEVEL SECURITY;

-- RLS policies for usuarios table (allow users to read their own profile)
CREATE POLICY "Users can view their own profile" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid()::text = id::text OR email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own profile" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid()::text = id::text OR email = auth.jwt() ->> 'email');

-- RLS policies for empresas table
CREATE POLICY "Users can view their company" 
ON public.empresas 
FOR SELECT 
USING (
  id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

-- RLS policies for clientes table
CREATE POLICY "Users can view clients from their company" 
ON public.clientes 
FOR SELECT 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can create clients for their company" 
ON public.clientes 
FOR INSERT 
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can update clients from their company" 
ON public.clientes 
FOR UPDATE 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

-- Similar policies for other tables
CREATE POLICY "Users can view orcamentos from their company" 
ON public.orcamentos 
FOR SELECT 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can create orcamentos for their company" 
ON public.orcamentos 
FOR INSERT 
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can update orcamentos from their company" 
ON public.orcamentos 
FOR UPDATE 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'
  )
);

-- Apply similar policies to other tables
CREATE POLICY "Users can view servicos from their company" 
ON public.servicos FOR SELECT 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can manage servicos from their company" 
ON public.servicos FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can view contratos from their company" 
ON public.contratos FOR SELECT 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can manage contratos from their company" 
ON public.contratos FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can view financeiro from their company" 
ON public.financeiro FOR SELECT 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can manage financeiro from their company" 
ON public.financeiro FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can view agenda_servicos from their company" 
ON public.agenda_servicos FOR SELECT 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can manage agenda_servicos from their company" 
ON public.agenda_servicos FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE auth.uid()::text = id::text OR email = auth.jwt() ->> 'email'));