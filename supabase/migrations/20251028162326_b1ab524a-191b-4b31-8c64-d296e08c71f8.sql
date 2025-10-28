-- Adicionar políticas de storage para o bucket orcamentos-pdf
-- Permitir inserção de PDFs pela edge function (usando service role) e usuários autenticados

-- Política para permitir upload (INSERT)
CREATE POLICY "Permitir upload de PDFs pela empresa"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'orcamentos-pdf' AND
  (storage.foldername(name))[1] = (SELECT empresa_id::text FROM public.usuarios WHERE id = auth.uid())
);

-- Política para permitir leitura (SELECT)
CREATE POLICY "Permitir leitura de PDFs da empresa"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'orcamentos-pdf' AND
  (storage.foldername(name))[1] = (SELECT empresa_id::text FROM public.usuarios WHERE id = auth.uid())
);

-- Política para permitir atualização (UPDATE/UPSERT)
CREATE POLICY "Permitir atualização de PDFs da empresa"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'orcamentos-pdf' AND
  (storage.foldername(name))[1] = (SELECT empresa_id::text FROM public.usuarios WHERE id = auth.uid())
);