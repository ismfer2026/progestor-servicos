-- Adicionar campo para limite de usuários que cada usuário pode criar
ALTER TABLE public.usuarios 
ADD COLUMN limite_usuarios_criacao integer DEFAULT 0;

COMMENT ON COLUMN public.usuarios.limite_usuarios_criacao IS 'Quantidade de usuários que este usuário pode criar. 0 = sem permissão, -1 = ilimitado';