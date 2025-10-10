-- Adicionar novos campos na tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS tipo_pessoa text CHECK (tipo_pessoa IN ('Física', 'Jurídica')),
ADD COLUMN IF NOT EXISTS documento text,
ADD COLUMN IF NOT EXISTS telefones text[],
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS servico_id uuid,
ALTER COLUMN endereco TYPE jsonb USING 
  CASE 
    WHEN endereco IS NULL THEN NULL
    WHEN endereco::text LIKE '{%' THEN endereco::jsonb
    ELSE jsonb_build_object('rua', endereco)
  END;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_pessoa ON clientes(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_clientes_fase_crm ON clientes(fase_crm);

-- Adicionar comentários para documentação
COMMENT ON COLUMN clientes.tipo_pessoa IS 'Tipo de pessoa: Física ou Jurídica';
COMMENT ON COLUMN clientes.documento IS 'CPF para Pessoa Física ou CNPJ para Pessoa Jurídica';
COMMENT ON COLUMN clientes.telefones IS 'Array de telefones do cliente';
COMMENT ON COLUMN clientes.endereco IS 'Endereço completo em formato JSON';
COMMENT ON COLUMN clientes.servico_id IS 'Referência ao serviço/produto de interesse';