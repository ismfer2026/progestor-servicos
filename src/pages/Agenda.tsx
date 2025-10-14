import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Bell, Users, MapPin, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddTaskDialog } from '@/components/funil/AddTaskDialog';
import { CardDetailsDialog } from '@/components/funil/CardDetailsDialog';

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  data_hora: string;
  data_fim?: string;
  status: string;
  tipo: string;
  prioridade?: string;
  cliente_id?: string;
  usuario_id?: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
}

export default function Agenda() {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewTask, setShowNewTask] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'timeline'>('month');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showCardDetails, setShowCardDetails] = useState(false);

  useEffect(() => {
    loadTarefas();
    loadClientes();
    loadEtapas();
  }, [user]);

  const loadTarefas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
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

  const loadClientes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .eq('empresa_id', user.empresa_id);

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const loadEtapas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setEtapas(data || []);
    } catch (error) {
      console.error('Error loading etapas:', error);
    }
  };

  const getTarefasForDate = (date: Date) => {
    return tarefas.filter(tarefa => 
      isSameDay(new Date(tarefa.data_hora), date)
    );
  };

  const getClienteById = (clienteId?: string) => {
    if (!clienteId) return null;
    return clientes.find(c => c.id === clienteId);
  };

  const handleCardClick = async (tarefa: Tarefa) => {
    if (!tarefa.cliente_id) return;

    try {
      // Buscar o card do funil relacionado a esta tarefa
      const { data: cards, error } = await supabase
        .from('funil_cards')
        .select('*')
        .eq('empresa_id', user?.empresa_id)
        .eq('cliente_id', tarefa.cliente_id)
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading card:', error);
        return;
      }

      if (cards) {
        setSelectedCard(cards);
        setShowCardDetails(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
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

  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case 'urgente': return 'bg-purple-500';
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPrioridadeLabel = (prioridade?: string) => {
    switch (prioridade) {
      case 'urgente': return 'Urgente';
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return 'Média';
    }
  };

  const handleCancelarTarefa = async (tarefaId: string, e?: React.MouseEvent) => {
    console.log('Cancelando tarefa:', tarefaId);
    if (e) {
      e.stopPropagation();
    }

    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ status: 'cancelado' })
        .eq('id', tarefaId);

      if (error) {
        console.error('Erro ao cancelar:', error);
        throw error;
      }

      console.log('Tarefa cancelada com sucesso');
      toast.success('Tarefa cancelada com sucesso!');
      loadTarefas();
    } catch (error) {
      console.error('Error canceling task:', error);
      toast.error('Erro ao cancelar tarefa');
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
                <TooltipProvider>
                  {dayTasks.slice(0, 3).map(tarefa => (
                    <Tooltip key={tarefa.id}>
                      <TooltipTrigger asChild>
                        <div className="relative group">
                          <div
                            className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 pr-6"
                            onClick={() => handleCardClick(tarefa)}
                          >
                            {format(new Date(tarefa.data_hora), 'HH:mm')} - {tarefa.titulo}
                          </div>
                          {tarefa.status !== 'cancelado' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-0 top-0 h-full w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleCancelarTarefa(tarefa.id, e)}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{tarefa.titulo}</p>
                          {tarefa.descricao && (
                            <p className="text-xs text-muted-foreground">{tarefa.descricao}</p>
                          )}
                          <p className="text-xs">
                            <span className="font-medium">Horário:</span> {format(new Date(tarefa.data_hora), 'HH:mm')} - {tarefa.data_fim ? format(new Date(tarefa.data_fim), 'HH:mm') : '--'}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Status:</span> {getStatusLabel(tarefa.status)}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Prioridade:</span> {getPrioridadeLabel(tarefa.prioridade)}
                          </p>
                          {tarefa.cliente_id && (
                            <p className="text-xs">
                              <span className="font-medium">Cliente:</span> {getClienteById(tarefa.cliente_id)?.nome || 'Não especificado'}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
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

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {format(weekStart, "d", { locale: ptBR })} - {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
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
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              Próxima
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const dayTasks = getTarefasForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={day.toISOString()} className="space-y-2">
                <div className={`text-center p-2 rounded-md ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="font-semibold text-sm">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </div>
                <div className="space-y-1">
                  {dayTasks.map(tarefa => {
                    const cliente = getClienteById(tarefa.cliente_id);
                    return (
                      <Card 
                        key={tarefa.id} 
                        className="p-2 cursor-pointer hover:shadow-md transition-shadow group relative"
                        onClick={() => handleCardClick(tarefa)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{format(new Date(tarefa.data_hora), 'HH:mm')}</span>
                            <div className="flex items-center gap-1">
                              <Badge className={`${getPrioridadeColor(tarefa.prioridade)} text-white text-[10px] px-1`}>
                                {getPrioridadeLabel(tarefa.prioridade)}
                              </Badge>
                              {tarefa.status !== 'cancelado' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => handleCancelarTarefa(tarefa.id, e)}
                                >
                                  <X className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs font-semibold truncate">{tarefa.titulo}</p>
                          {cliente && (
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground truncate">{cliente.nome}</p>
                              {cliente.telefone && (
                                <p className="text-[10px] text-muted-foreground">{cliente.telefone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
            dayTasks.map(tarefa => {
              const cliente = getClienteById(tarefa.cliente_id);
              return (
                <Card 
                  key={tarefa.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => handleCardClick(tarefa)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{tarefa.titulo}</CardTitle>
                      <div className="flex gap-2 items-center">
                        <Badge className={`${getPrioridadeColor(tarefa.prioridade)} text-white`}>
                          {getPrioridadeLabel(tarefa.prioridade)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(tarefa.status)} text-white`}
                        >
                          {getStatusLabel(tarefa.status)}
                        </Badge>
                        {tarefa.status !== 'cancelado' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleCancelarTarefa(tarefa.id, e)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          {format(new Date(tarefa.data_hora), 'HH:mm')}
                          {tarefa.data_fim && ` - ${format(new Date(tarefa.data_fim), 'HH:mm')}`}
                        </div>
                      </div>
                      {cliente && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            {cliente.telefone && (
                              <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {tarefa.descricao && (
                        <p className="mt-2 text-sm">{tarefa.descricao}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
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
              onClick={() => setCurrentDate(new Date())}
            >
              Hoje
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

        <div className="border rounded-lg overflow-hidden">
          {hours.map(hour => {
            const hourTasks = dayTasks.filter(tarefa => {
              const taskHour = new Date(tarefa.data_hora).getHours();
              return taskHour === hour;
            });

            return (
              <div key={hour} className="flex border-b last:border-b-0">
                <div className="w-20 flex-shrink-0 p-3 bg-muted text-sm font-medium text-center border-r">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2 min-h-[60px]">
                  {hourTasks.map(tarefa => {
                    const cliente = getClienteById(tarefa.cliente_id);
                    return (
                      <Card 
                        key={tarefa.id} 
                        className="mb-2 p-3 cursor-pointer hover:shadow-md transition-shadow group"
                        onClick={() => handleCardClick(tarefa)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                {format(new Date(tarefa.data_hora), 'HH:mm')}
                                {tarefa.data_fim && ` - ${format(new Date(tarefa.data_fim), 'HH:mm')}`}
                              </span>
                              <Badge className={`${getPrioridadeColor(tarefa.prioridade)} text-white text-xs`}>
                                {getPrioridadeLabel(tarefa.prioridade)}
                              </Badge>
                            </div>
                            <p className="font-semibold text-sm">{tarefa.titulo}</p>
                            {cliente && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{cliente.nome}</span>
                                {cliente.telefone && <span>• {cliente.telefone}</span>}
                              </div>
                            )}
                            {tarefa.descricao && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{tarefa.descricao}</p>
                            )}
                          </div>
                          {tarefa.status !== 'cancelado' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleCancelarTarefa(tarefa.id, e)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
        <Button onClick={() => setShowNewTask(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
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
          {renderWeekView()}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          {renderTimelineView()}
        </TabsContent>
      </Tabs>

      {/* Dialog de nova tarefa */}
      <AddTaskDialog
        open={showNewTask}
        onOpenChange={setShowNewTask}
        cardId=""
        onTaskCreated={() => {
          loadTarefas();
          loadClientes();
        }}
      />

      {/* Dialog de detalhes do card */}
      {selectedCard && (
        <CardDetailsDialog
          open={showCardDetails}
          onOpenChange={setShowCardDetails}
          card={selectedCard}
        />
      )}
    </div>
  );
}