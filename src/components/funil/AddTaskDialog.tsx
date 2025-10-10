import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!titulo || !dataHora || !horarioInicio || !horarioFim) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Usuário não está associado a uma empresa');
      return;
    }

    // Validar se horário de início é antes do horário de fim
    if (horarioInicio >= horarioFim) {
      toast.error('O horário de início deve ser anterior ao horário de fim');
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe uma tarefa no mesmo horário
      const dataInicio = new Date(dataHora);
      const [hoursInicio, minutesInicio] = horarioInicio.split(':');
      dataInicio.setHours(parseInt(hoursInicio), parseInt(minutesInicio));

      const dataFim = new Date(dataHora);
      const [hoursFim, minutesFim] = horarioFim.split(':');
      dataFim.setHours(parseInt(hoursFim), parseInt(minutesFim));

      // Verificar conflitos de horário
      const { data: tarefasExistentes } = await supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .gte('data_hora', dataInicio.toISOString())
        .lte('data_fim', dataFim.toISOString());

      if (tarefasExistentes && tarefasExistentes.length > 0) {
        toast.error('Já existe uma tarefa agendada neste horário');
        return;
      }

      const { error } = await supabase
        .from('tarefas')
        .insert([{
          empresa_id: user.empresa_id,
          cliente_id: clienteId,
          usuario_id: user.id,
          titulo,
          descricao,
          data_hora: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          prioridade,
          tipo: 'tarefa',
          status: 'pendente',
          origem: 'funil'
        }]);

      if (error) throw error;

      toast.success('Tarefa criada com sucesso!');

      setTitulo('');
      setDescricao('');
      setDataHora(undefined);
      setHorarioInicio('');
      setHorarioFim('');
      setPrioridade('media');
      
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="horarioInicio">Horário Início *</Label>
              <Input
                id="horarioInicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="horarioFim">Horário Fim *</Label>
              <Input
                id="horarioFim"
                type="time"
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="prioridade">Prioridade *</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
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