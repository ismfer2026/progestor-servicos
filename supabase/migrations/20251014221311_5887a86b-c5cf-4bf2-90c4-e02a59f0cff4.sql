-- Criar bucket para armazenar modelos de contratos em .docx
INSERT INTO storage.buckets (id, name, public)
VALUES ('modelos-contratos', 'modelos-contratos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies para o bucket modelos-contratos
CREATE POLICY "Usuários podem visualizar modelos da sua empresa"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'modelos-contratos' AND
  auth.uid() IN (
    SELECT id FROM usuarios 
    WHERE empresa_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Usuários podem fazer upload de modelos para sua empresa"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'modelos-contratos' AND
  auth.uid() IN (
    SELECT id FROM usuarios 
    WHERE empresa_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Usuários podem deletar modelos da sua empresa"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'modelos-contratos' AND
  auth.uid() IN (
    SELECT id FROM usuarios 
    WHERE empresa_id::text = (storage.foldername(name))[1]
  )
);

-- Adicionar coluna para armazenar a URL do arquivo .docx original
ALTER TABLE modelos ADD COLUMN IF NOT EXISTS arquivo_docx_url text;

-- Adicionar comentário explicativo
COMMENT ON COLUMN modelos.arquivo_docx_url IS 'URL do arquivo .docx original armazenado no Storage';