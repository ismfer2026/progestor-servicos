-- Add missing columns to orcamentos table for service details
ALTER TABLE orcamentos
ADD COLUMN IF NOT EXISTS data_validade DATE,
ADD COLUMN IF NOT EXISTS data_servico DATE,
ADD COLUMN IF NOT EXISTS horario_inicio TIME,
ADD COLUMN IF NOT EXISTS horario_fim TIME,
ADD COLUMN IF NOT EXISTS local_servico TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;