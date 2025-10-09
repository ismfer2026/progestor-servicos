-- Atualizar função de criar etapas padrão do funil
CREATE OR REPLACE FUNCTION public.criar_etapas_padrao_funil(p_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Deletar etapas antigas se existirem
  DELETE FROM funil_etapas WHERE empresa_id = p_empresa_id;
  
  -- Inserir novas etapas padrão do funil
  INSERT INTO funil_etapas (empresa_id, nome, cor, ordem) VALUES
    (p_empresa_id, 'Novo Lead', '#3B82F6', 1),
    (p_empresa_id, 'Contato Inicial', '#10B981', 2),
    (p_empresa_id, 'Orçamento Enviado', '#8B5CF6', 3),
    (p_empresa_id, 'Negociação', '#F59E0B', 4),
    (p_empresa_id, 'Contrato Enviado', '#06B6D4', 5),
    (p_empresa_id, 'Fechado', '#22C55E', 6),
    (p_empresa_id, 'Perdido', '#EF4444', 7);
END;
$function$;

-- Recriar as etapas para todas as empresas existentes
DO $$
DECLARE
  empresa_record RECORD;
BEGIN
  FOR empresa_record IN SELECT id FROM empresas LOOP
    PERFORM criar_etapas_padrao_funil(empresa_record.id);
  END LOOP;
END $$;