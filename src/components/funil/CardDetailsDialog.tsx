import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Calendar, DollarSign, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AddTaskDialog } from "./AddTaskDialog";

interface CardDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: any;
}

export function CardDetailsDialog({ open, onOpenChange, card }: CardDetailsDialogProps) {
  const { user } = useAuth();
  const [cliente, setCliente] = useState<any>(null);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [anotacoes, setAnotacoes] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    if (open && card?.cliente_id) {
      loadClienteData();
      loadOrcamentos();
      loadAnotacoes();
      loadMensagens();
      loadTarefas();
    }
  }, [open, card]);

  const loadClienteData = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', card.cliente_id)
        .single();
      
      if (error) throw error;
      setCliente(data);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
    }
  };

  const loadOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('cliente_id', card.cliente_id)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    }
  };

  const loadAnotacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('funil_anotacoes')
        .select('*')
        .eq('card_id', card.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnotacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
    }
  };

  const loadMensagens = async () => {
    try {
      const { data, error } = await supabase
        .from('funil_mensagens')
        .select('*')
        .eq('card_id', card.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const loadTarefas = async () => {
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', user?.empresa_id)
        .eq('cliente_id', card.cliente_id)
        .eq('origem', 'funil')
        .order('data_hora', { ascending: false });
      
      if (error) throw error;
      setTarefas(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{card?.titulo}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informações do Cliente */}
            {cliente && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{cliente.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{cliente.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{cliente.telefones?.[0] || cliente.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">
                      {cliente.endereco ? (
                        <>
                          {cliente.endereco.rua && `${cliente.endereco.rua}, `}
                          {cliente.endereco.numero && `${cliente.endereco.numero} - `}
                          {cliente.endereco.bairro && `${cliente.endereco.bairro}, `}
                          {cliente.endereco.cidade && cliente.endereco.cidade}
                          {cliente.endereco.estado && `/${cliente.endereco.estado}`}
                          {cliente.endereco.cep && ` - CEP: ${cliente.endereco.cep}`}
                        </>
                      ) : '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Valor e Observações */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold text-primary">
                      {card?.valor ? formatCurrency(card.valor) : 'Não definido'}
                    </p>
                  </div>
                  {card?.observacoes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="font-medium">{card.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="orcamentos" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
                <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
                <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
                <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
              </TabsList>

              <TabsContent value="orcamentos" className="space-y-4">
                {orcamentos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum orçamento cadastrado</p>
                  </div>
                ) : (
                  orcamentos.map((orc) => (
                    <Card key={orc.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Orçamento #{orc.id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(orc.criado_em), "PPP", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(orc.valor_total)}</p>
                            <Badge variant={orc.status === 'Aprovado' ? 'default' : 'secondary'}>
                              {orc.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="anotacoes" className="space-y-4">
                {anotacoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma anotação registrada</p>
                  </div>
                ) : (
                  anotacoes.map((anot) => (
                    <Card key={anot.id}>
                      <CardContent className="pt-6">
                        <p className="mb-2">{anot.mensagem}</p>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Usuário</span>
                          <span>{format(new Date(anot.created_at), "PPp", { locale: ptBR })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="mensagens" className="space-y-4">
                {mensagens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma mensagem enviada</p>
                  </div>
                ) : (
                  mensagens.map((msg) => (
                    <Card key={msg.id}>
                      <CardContent className="pt-6">
                        <p className="mb-2">{msg.mensagem}</p>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Usuário</span>
                          <span>{format(new Date(msg.created_at), "PPp", { locale: ptBR })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="tarefas" className="space-y-4">
                {tarefas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma tarefa cadastrada</p>
                  </div>
                ) : (
                  tarefas.map((tarefa) => (
                    <Card key={tarefa.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{tarefa.titulo}</h4>
                            {tarefa.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">{tarefa.descricao}</p>
                            )}
                          </div>
                          <Badge variant={getStatusColor(tarefa.status)}>
                            {getStatusLabel(tarefa.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          📅 {format(new Date(tarefa.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => setShowAddTask(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Registrar Tarefa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        clienteId={card?.cliente_id}
        cardId={card?.id}
        onTaskCreated={() => {
          toast.success('Tarefa registrada com sucesso!');
          loadTarefas();
          setShowAddTask(false);
        }}
      />
    </>
  );
}