-- Create bucket for orcamentos PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos-pdf', 'orcamentos-pdf', false);

-- Create table to track PDF files
CREATE TABLE public.orcamentos_pdf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orcamentos_pdf ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orcamentos_pdf
CREATE POLICY "Users can manage orcamentos_pdf from their company"
ON public.orcamentos_pdf
FOR ALL
USING (
  orcamento_id IN (
    SELECT id FROM public.orcamentos
    WHERE empresa_id IN (
      SELECT empresa_id FROM public.usuarios
      WHERE id = auth.uid() OR email = auth.jwt()->>'email'
    )
  )
);

-- Storage policies for orcamentos-pdf bucket
CREATE POLICY "Users can upload PDFs for their company"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'orcamentos-pdf' AND
  (storage.foldername(name))[1] IN (
    SELECT empresa_id::text FROM public.usuarios
    WHERE id = auth.uid() OR email = auth.jwt()->>'email'
  )
);

CREATE POLICY "Users can read PDFs from their company"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'orcamentos-pdf' AND
  (storage.foldername(name))[1] IN (
    SELECT empresa_id::text FROM public.usuarios
    WHERE id = auth.uid() OR email = auth.jwt()->>'email'
  )
);

CREATE POLICY "Users can delete PDFs from their company"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'orcamentos-pdf' AND
  (storage.foldername(name))[1] IN (
    SELECT empresa_id::text FROM public.usuarios
    WHERE id = auth.uid() OR email = auth.jwt()->>'email'
  )
);