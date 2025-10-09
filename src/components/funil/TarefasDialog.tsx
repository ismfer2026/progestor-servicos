import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AddTaskDialog } from "./AddTaskDialog";

interface TarefasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  clienteId?: string;
}

export function TarefasDialog({ open, onOpenChange, cardId, clienteId }: TarefasDialogProps) {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTarefas();
    }
  }, [open, cardId]);

  const loadTarefas = async () => {
    if (!user?.empresa_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('origem', 'funil')
        .order('data_hora', { ascending: false });

      if (error) throw error;

      // Filter tarefas relacionadas a este cliente
      const tarefasFiltradas = data?.filter(t => t.cliente_id === clienteId) || [];
      setTarefas(tarefasFiltradas);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tarefaId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ status: novoStatus })
        .eq('id', tarefaId);

      if (error) throw error;

      toast.success('Status atualizado!');
      loadTarefas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'default';
      case 'em_andamento':
        return 'secondary';
      case 'pendente':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Tarefas
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie todas as tarefas relacionadas a este lead
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tarefas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma tarefa cadastrada</p>
                <p className="text-sm mt-2">Clique em "Nova Tarefa" para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tarefas.map((tarefa) => (
                  <Card key={tarefa.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{tarefa.titulo}</h4>
                          {tarefa.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">{tarefa.descricao}</p>
                          )}
                        </div>
                        <Badge variant={getStatusColor(tarefa.status)}>
                          {getStatusLabel(tarefa.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          📅 {format(new Date(tarefa.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {tarefa.status !== 'concluida' && (
                        <div className="flex gap-2 mt-3">
                          {tarefa.status === 'pendente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(tarefa.id, 'em_andamento')}
                            >
                              Iniciar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStatusChange(tarefa.id, 'concluida')}
                          >
                            Concluir
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        cardId={cardId}
        clienteId={clienteId}
        onTaskCreated={() => {
          setShowAddTask(false);
          loadTarefas();
        }}
      />
    </>
  );
}
