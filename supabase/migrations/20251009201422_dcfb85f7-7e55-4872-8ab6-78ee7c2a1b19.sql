-- Adicionar foreign keys para funil_anotacoes e funil_mensagens
ALTER TABLE funil_anotacoes 
ADD CONSTRAINT funil_anotacoes_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE funil_mensagens 
ADD CONSTRAINT funil_mensagens_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Criar função para inserir etapas padrão do funil quando uma empresa é criada
CREATE OR REPLACE FUNCTION public.criar_etapas_padrao_funil(p_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir etapas padrão do funil
  INSERT INTO funil_etapas (empresa_id, nome, cor, ordem) VALUES
    (p_empresa_id, 'Novo Lead', '#3B82F6', 1),
    (p_empresa_id, 'Contato Inicial', '#10B981', 2),
    (p_empresa_id, 'Proposta Enviada', '#8B5CF6', 3),
    (p_empresa_id, 'Negociação', '#F59E0B', 4),
    (p_empresa_id, 'Fechado', '#22C55E', 5),
    (p_empresa_id, 'Perdido', '#EF4444', 6);
END;
$$;

-- Inserir etapas padrão para empresas existentes que não têm etapas
DO $$
DECLARE
  empresa_record RECORD;
BEGIN
  FOR empresa_record IN 
    SELECT DISTINCT e.id 
    FROM empresas e
    LEFT JOIN funil_etapas fe ON e.id = fe.empresa_id
    WHERE fe.id IS NULL
  LOOP
    PERFORM criar_etapas_padrao_funil(empresa_record.id);
  END LOOP;
END $$;

-- Adicionar coluna para armazenar serviços no funil_cards
ALTER TABLE funil_cards 
ADD COLUMN IF NOT EXISTS servicos jsonb DEFAULT '[]'::jsonb;

-- Adicionar trigger para criar etapas padrão quando uma nova empresa é criada
CREATE OR REPLACE FUNCTION public.trigger_criar_etapas_funil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM criar_etapas_padrao_funil(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_nova_empresa_etapas ON empresas;
CREATE TRIGGER trigger_nova_empresa_etapas
AFTER INSERT ON empresas
FOR EACH ROW
EXECUTE FUNCTION trigger_criar_etapas_funil();