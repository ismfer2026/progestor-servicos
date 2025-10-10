-- Adicionar campo de prioridade à tabela tarefas
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));

-- Comentário na coluna
COMMENT ON COLUMN tarefas.prioridade IS 'Prioridade da tarefa: baixa, media, alta, urgente';