import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Bell, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  data_hora: string;
  data_fim?: string;
  status: string;
  tipo: string;
  cliente?: { nome: string } | null;
  usuario?: { nome: string } | null;
}

export default function Agenda() {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewTask, setShowNewTask] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'timeline'>('month');

  useEffect(() => {
    loadTarefas();
  }, [user]);

  const loadTarefas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          cliente:clientes(nome),
          usuario:usuarios(nome)
        `)
        .order('data_hora');

      if (error) throw error;
      setTarefas(data || []);
    } catch (error) {
      console.error('Error loading tarefas:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  const getTarefasForDate = (date: Date) => {
    return tarefas.filter(tarefa => 
      isSameDay(new Date(tarefa.data_hora), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-500';
      case 'em_andamento': return 'bg-blue-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'em_andamento': return 'Em Andamento';
      case 'cancelado': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  const generateCalendarDays = () => {
    const start = startOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const end = endOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    const days = [];
    
    for (let day = start; day <= end; day = addDays(day, 1)) {
      days.push(new Date(day));
    }
    
    return days;
  };

  const renderMonthView = () => {
    const days = generateCalendarDays();
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-sm text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayTasks = getTarefasForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 border rounded-md ${
                isCurrentMonth ? 'bg-card' : 'bg-muted/30'
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="font-semibold text-sm mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(tarefa => (
                  <div
                    key={tarefa.id}
                    className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                  >
                    {format(new Date(tarefa.data_hora), 'HH:mm')} - {tarefa.titulo}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayTasks.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTarefasForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, -1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, 1))}
            >
              Próximo
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          {dayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tarefa agendada para este dia
            </div>
          ) : (
            dayTasks.map(tarefa => (
              <Card key={tarefa.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{tarefa.titulo}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(tarefa.status)} text-white`}
                    >
                      {getStatusLabel(tarefa.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {format(new Date(tarefa.data_hora), 'HH:mm')}
                      {tarefa.data_fim && ` - ${format(new Date(tarefa.data_fim), 'HH:mm')}`}
                    </div>
                    {tarefa.cliente && (
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {tarefa.cliente.nome}
                      </div>
                    )}
                  </div>
                  {tarefa.descricao && (
                    <p className="mt-2 text-sm">{tarefa.descricao}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus compromissos e tarefas</p>
        </div>
        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input placeholder="Digite o título da tarefa" />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea placeholder="Descreva a tarefa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Horário</label>
                  <Input type="time" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarefa">Tarefa</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewTask(false)}>
                  Cancelar
                </Button>
                <Button>Criar Tarefa</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="day">Dia</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                Próximo
              </Button>
            </div>
          </div>
          {renderMonthView()}
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          {renderDayView()}
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            Visualização em semana em desenvolvimento
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            Visualização em timeline em desenvolvimento
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}