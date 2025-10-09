import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  clienteId?: string;
  onTaskCreated?: () => void;
}

export function AddTaskDialog({ open, onOpenChange, cardId, clienteId, onTaskCreated }: AddTaskDialogProps) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataHora, setDataHora] = useState<Date>();
  const [horario, setHorario] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!titulo || !dataHora || !horario) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Usuário não está associado a uma empresa');
      return;
    }

    setLoading(true);
    try {
      const dateTime = new Date(dataHora);
      const [hours, minutes] = horario.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase
        .from('tarefas')
        .insert([{
          empresa_id: user.empresa_id,
          cliente_id: clienteId,
          usuario_id: user.id,
          titulo,
          descricao,
          data_hora: dateTime.toISOString(),
          tipo: 'tarefa',
          status: 'pendente',
          origem: 'funil'
        }]);

      if (error) throw error;

      toast.success('Tarefa criada com sucesso!');

      setTitulo('');
      setDescricao('');
      setDataHora(undefined);
      setHorario('');
      
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título da tarefa"
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a tarefa"
            />
          </div>
          <div>
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataHora && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataHora ? format(dataHora, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataHora}
                  onSelect={setDataHora}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="horario">Horário *</Label>
            <Input
              id="horario"
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Tarefa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}