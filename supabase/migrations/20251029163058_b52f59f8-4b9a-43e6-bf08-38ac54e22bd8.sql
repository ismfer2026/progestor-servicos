-- Habilitar a política DELETE para orçamentos
CREATE POLICY "Users can delete orcamentos from their company"
ON public.orcamentos FOR DELETE
TO authenticated
USING (
  empresa_id IN (
    SELECT usuarios.empresa_id
    FROM usuarios
    WHERE (auth.uid()::text = usuarios.id::text) OR (usuarios.email = (auth.jwt() ->> 'email'::text))
  )
);