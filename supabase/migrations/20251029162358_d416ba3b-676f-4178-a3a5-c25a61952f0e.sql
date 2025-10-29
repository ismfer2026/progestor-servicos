-- Atualizar políticas RLS para permitir UPDATE na tabela empresas
-- Política para permitir que usuários atualizem dados da própria empresa
CREATE POLICY "Users can update their own company"
ON public.empresas FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE id = auth.uid() OR email = (auth.jwt() ->> 'email'::text)
  )
)
WITH CHECK (
  id IN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE id = auth.uid() OR email = (auth.jwt() ->> 'email'::text)
  )
);