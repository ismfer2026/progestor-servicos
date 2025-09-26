import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageCircle, FileText, Users, DollarSign, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  cliente?: { nome: string };
  responsavel?: { nome: string };
}

export default function FunilVendas() {
  const { user } = useAuth();
  const [etapas, setEtapas] = useState<FunilEtapa[]>([]);
  const [cards, setCards] = useState<FunilCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCard, setShowNewCard] = useState(false);
  const [selectedEtapa, setSelectedEtapa] = useState<string>('');

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

      setEtapas(etapasData || []);
      setCards(cardsData || []);
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

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
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
          <h1 className="text-3xl font-bold">Funil de Vendas</h1>
          <p className="text-muted-foreground">Gerencie suas oportunidades de vendas</p>
        </div>
        <Dialog open={showNewCard} onOpenChange={setShowNewCard}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Card do Funil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input placeholder="Digite o título do card" />
              </div>
              <div>
                <label className="text-sm font-medium">Etapa</label>
                <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map(etapa => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Valor</label>
                <Input type="number" placeholder="R$ 0,00" />
              </div>
              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea placeholder="Observações sobre esta oportunidade" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewCard(false)}>
                  Cancelar
                </Button>
                <Button>Criar Card</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {etapas.map(etapa => (
            <div key={etapa.id} className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <h3 className="font-semibold">{etapa.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getCardsByEtapa(etapa.id).length} cards
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(getTotalValueByEtapa(etapa.id))}
                  </p>
                </div>
              </div>

              <Droppable droppableId={etapa.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[400px] space-y-2"
                  >
                    {getCardsByEtapa(etapa.id).map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="cursor-move hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">{card.titulo}</CardTitle>
                              {card.valor && (
                                <Badge variant="secondary" className="w-fit">
                                  {formatCurrency(card.valor)}
                                </Badge>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0">
                              {card.cliente_id && (
                                <div className="flex items-center space-x-2 mb-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      CL
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                    Cliente #{card.cliente_id.slice(-8)}
                                  </span>
                                </div>
                              )}
                              {card.responsavel_id && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  Resp.: #{card.responsavel_id.slice(-8)}
                                </p>
                              )}
                              <div className="flex justify-between items-center">
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => openWhatsApp('', 'Olá! Gostaria de conversar sobre sua proposta.')}
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
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
    </div>
  );
}