import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText, StickyNote, Settings, UserPlus, TrendingUp, Calendar, CheckSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CardDetailsDialog } from '@/components/funil/CardDetailsDialog';
import { AddTaskDialog } from '@/components/funil/AddTaskDialog';
import { WhatsAppDialog } from '@/components/funil/WhatsAppDialog';
import { AnotacaoDialog } from '@/components/funil/AnotacaoDialog';
import { ConfigurarEtapasDialog } from '@/components/funil/ConfigurarEtapasDialog';
import { NovoLeadDialog } from '@/components/funil/NovoLeadDialog';

interface FunilEtapa {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

interface FunilCard {
  id: string;
  titulo: string;
  valor?: number;
  etapa_id: string;
  cliente_id?: string;
  responsavel_id?: string;
  observacoes?: string;
  data_limite?: string;
  orcamento_id?: string;
  created_at?: string;
  servicos?: any[];
}

export default function FunilVendas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [etapas, setEtapas] = useState<FunilEtapa[]>([]);
  const [cards, setCards] = useState<FunilCard[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs state
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showAnotacao, setShowAnotacao] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showConfigurarEtapas, setShowConfigurarEtapas] = useState(false);
  const [showNovoLead, setShowNovoLead] = useState(false);

  useEffect(() => {
    loadFunilData();
  }, [user]);

  const loadFunilData = async () => {
    if (!user) return;

    try {
      // Load etapas
      const { data: etapasData, error: etapasError } = await supabase
        .from('funil_etapas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('ordem');

      if (etapasError) throw etapasError;

      // Load cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('funil_cards')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('ordem');

      if (cardsError) throw cardsError;

      // Load all clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', user.empresa_id);

      if (clientesError) throw clientesError;

      setEtapas(etapasData || []);
      setCards(cardsData as FunilCard[] || []);
      setClientes(clientesData || []);
    } catch (error) {
      console.error('Error loading funil data:', error);
      toast.error('Erro ao carregar dados do funil');
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      try {
        await supabase
          .from('funil_cards')
          .update({ etapa_id: destination.droppableId })
          .eq('id', draggableId);

        // Update local state
        setCards(prev => prev.map(card => 
          card.id === draggableId 
            ? { ...card, etapa_id: destination.droppableId }
            : card
        ));

        toast.success('Card movido com sucesso!');
      } catch (error) {
        console.error('Error updating card:', error);
        toast.error('Erro ao mover card');
      }
    }
  };

  const getCardsByEtapa = (etapaId: string) => {
    return cards.filter(card => card.etapa_id === etapaId);
  };

  const getTotalValueByEtapa = (etapaId: string) => {
    const etapaCards = getCardsByEtapa(etapaId);
    return etapaCards.reduce((total, card) => total + (card.valor || 0), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setShowCardDetails(true);
  };

  const handleWhatsAppClick = (card: any) => {
    setSelectedCard(card);
    setShowWhatsApp(true);
  };

  const handleAnotacaoClick = (card: any) => {
    setSelectedCard(card);
    setShowAnotacao(true);
  };

  const handleAddTaskClick = (card: any) => {
    setSelectedCard(card);
    setShowAddTask(true);
  };

  const handleOrcamentoClick = (card: any) => {
    if (card.cliente_id) {
      navigate(`/novo-orcamento?cliente_id=${card.cliente_id}`);
    } else {
      toast.error('Este card não possui um cliente associado');
    }
  };

  const getClienteTelefone = (card: any) => {
    const cliente = clientes.find(c => c.id === card.cliente_id);
    return cliente?.telefone;
  };

  const getClienteNome = (card: any) => {
    const cliente = clientes.find(c => c.id === card.cliente_id);
    return cliente?.nome;
  };

  const getClienteCodigo = (card: any) => {
    const cliente = clientes.find(c => c.id === card.cliente_id);
    return cliente?.id?.substring(0, 8).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getServicosFromCard = (card: any) => {
    if (card.servicos && Array.isArray(card.servicos)) {
      return card.servicos;
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Funil de Vendas</h1>
            <p className="text-muted-foreground">Arraste e solte as oportunidades para organizar seu fluxo de vendas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfigurarEtapas(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar Etapas
          </Button>
          <Button onClick={() => setShowNovoLead(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar Novo Lead
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {etapas.map(etapa => (
            <div key={etapa.id} className="space-y-3">
              <div className="flex flex-col p-4 rounded-lg border-2 bg-card shadow-sm" style={{ borderTopColor: etapa.cor, borderTopWidth: '4px' }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-base">{etapa.nome}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {getCardsByEtapa(etapa.id).length}
                  </Badge>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {formatCurrency(getTotalValueByEtapa(etapa.id))}
                </div>
              </div>

              <Droppable droppableId={etapa.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[500px] space-y-3 p-2 rounded-lg bg-muted/30"
                  >
                    {getCardsByEtapa(etapa.id).map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="cursor-move hover:shadow-lg transition-all bg-card rounded-xl p-4 space-y-3"
                          >
                            {/* Header com código e badge de orçamento */}
                            <div className="flex justify-between items-start">
                              <span 
                                className="text-base font-semibold text-primary cursor-pointer hover:underline"
                                onClick={() => handleCardClick(card)}
                              >
                                #{getClienteCodigo(card)}
                              </span>
                              {card.orcamento_id && (
                                <Badge variant="secondary" className="text-xs">
                                  Orçamento
                                </Badge>
                              )}
                            </div>

                            {/* Nome do cliente */}
                            {getClienteNome(card) && (
                              <p className="text-sm text-foreground/80 font-medium">
                                {getClienteNome(card)}
                              </p>
                            )}

                            {/* Serviços */}
                            {getServicosFromCard(card).length > 0 && (
                              <div className="space-y-1">
                                {getServicosFromCard(card).map((servico: any, idx: number) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    • {servico.nome}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Valor da negociação */}
                            {card.valor && (
                              <div className="text-xl font-bold text-foreground">
                                {formatCurrency(card.valor)}
                              </div>
                            )}

                            {/* Data de criação */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(card.created_at)}</span>
                            </div>

                            {/* Botões de ação */}
                            <div className="space-y-2 pt-2 border-t">
                              {/* Linha 1: WhatsApp e Orçamento */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWhatsAppClick(card);
                                  }}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  WhatsApp
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrcamentoClick(card);
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Orçamento
                                </Button>
                              </div>
                              
                              {/* Linha 2: Anotações e Tarefas */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnotacaoClick(card);
                                  }}
                                >
                                  <StickyNote className="h-3 w-3 mr-1" />
                                  Anotação
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddTaskClick(card);
                                  }}
                                >
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  Tarefa
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Dialogs */}
      {selectedCard && (
        <>
          <CardDetailsDialog
            open={showCardDetails}
            onOpenChange={setShowCardDetails}
            card={selectedCard}
          />
          <WhatsAppDialog
            open={showWhatsApp}
            onOpenChange={setShowWhatsApp}
            telefone={getClienteTelefone(selectedCard)}
            cardId={selectedCard.id}
          />
          <AnotacaoDialog
            open={showAnotacao}
            onOpenChange={setShowAnotacao}
            cardId={selectedCard.id}
            onSaved={loadFunilData}
          />
          <AddTaskDialog
            open={showAddTask}
            onOpenChange={setShowAddTask}
            cardId={selectedCard.id}
            onTaskCreated={loadFunilData}
          />
        </>
      )}

      <ConfigurarEtapasDialog
        open={showConfigurarEtapas}
        onOpenChange={setShowConfigurarEtapas}
        onEtapasChanged={loadFunilData}
      />

      <NovoLeadDialog
        open={showNovoLead}
        onOpenChange={setShowNovoLead}
        etapas={etapas}
        onLeadCreated={loadFunilData}
      />
    </div>
  );
}