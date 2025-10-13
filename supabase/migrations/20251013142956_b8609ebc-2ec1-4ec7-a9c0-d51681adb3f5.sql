-- Adicionar política para permitir inserção de notificações
CREATE POLICY "Users can create notifications for their company"
ON notificacoes
FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM usuarios 
    WHERE id::text = auth.uid()::text 
    OR email = auth.jwt()->>'email'
  )
);