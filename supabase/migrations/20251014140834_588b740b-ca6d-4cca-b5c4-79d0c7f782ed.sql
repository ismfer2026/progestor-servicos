-- Add data_fim column to contratos table
ALTER TABLE contratos 
ADD COLUMN data_fim timestamp with time zone;