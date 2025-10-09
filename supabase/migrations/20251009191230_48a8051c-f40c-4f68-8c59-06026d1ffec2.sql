-- Add categoria and imagem_url to servicos table
ALTER TABLE servicos 
ADD COLUMN IF NOT EXISTS categoria text,
ADD COLUMN IF NOT EXISTS imagem_url text;

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('servico-imagens', 'servico-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service images
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'servico-imagens');

CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'servico-imagens' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their company's service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'servico-imagens' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their company's service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'servico-imagens' 
  AND auth.role() = 'authenticated'
);