import React, { useState, useEffect } from 'react';
import { RefreshCw, Upload, Check, X, FileText, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Conciliacao {
  id: string;
  banco: string;
  data_inicio: string;
  data_fim: string;
  saldo_inicial: number;
  saldo_final: number;
  total_entradas: number;
  total_saidas: number;
  status: string;
  created_at: string;
}

interface ItemConciliacao {
  id: string;
  data_transacao: string;
  descricao: string;
  valor: number;
  tipo: string;
  conciliado: boolean;
  movimentacao_id?: string;
}

export default function Conciliacao() {
  const { user } = useAuth();
  const [conciliacoes, setConciliacoes] = useState<Conciliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConciliacao, setShowNewConciliacao] = useState(false);
  const [selectedConciliacao, setSelectedConciliacao] = useState<Conciliacao | null>(null);
  const [itens, setItens] = useState<ItemConciliacao[]>([]);
  const [newConciliacao, setNewConciliacao] = useState({
    banco: '',
    data_inicio: '',
    data_fim: '',
    saldo_inicial: 0,
    saldo_final: 0
  });

  useEffect(() => {
    loadConciliacoes();
  }, [user]);

  const loadConciliacoes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financeiro_conciliacoes')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConciliacoes(data || []);
    } catch (error) {
      console.error('Error loading conciliacoes:', error);
      toast.error('Erro ao carregar conciliações');
    } finally {
      setLoading(false);
    }
  };

  const loadItensConciliacao = async (conciliacaoId: string) => {
    try {
      const { data, error } = await supabase
        .from('financeiro_conciliacoes_itens')
        .select('*')
        .eq('conciliacao_id', conciliacaoId)
        .order('data_transacao');

      if (error) throw error;
      setItens(data || []);
    } catch (error) {
      console.error('Error loading itens:', error);
      toast.error('Erro ao carregar itens da conciliação');
    }
  };

  const handleCreateConciliacao = async () => {
    if (!user || !newConciliacao.banco || !newConciliacao.data_inicio || !newConciliacao.data_fim) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('financeiro_conciliacoes')
        .insert({
          empresa_id: user.empresa_id,
          banco: newConciliacao.banco,
          data_inicio: newConciliacao.data_inicio,
          data_fim: newConciliacao.data_fim,
          saldo_inicial: newConciliacao.saldo_inicial,
          saldo_final: newConciliacao.saldo_final,
          status: 'em_andamento'
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar movimentações do período
      const { data: movimentacoes, error: movError } = await supabase
        .from('financeiro_movimentacoes')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .gte('data_vencimento', newConciliacao.data_inicio)
        .lte('data_vencimento', newConciliacao.data_fim)
        .eq('status', 'pago');

      if (movError) throw movError;

      // Criar itens de conciliação
      if (movimentacoes && movimentacoes.length > 0) {
        const itensToInsert = movimentacoes.map(mov => ({
          conciliacao_id: data.id,
          movimentacao_id: mov.id,
          data_transacao: mov.data_pagamento || mov.data_vencimento,
          descricao: mov.descricao,
          valor: mov.valor,
          tipo: mov.tipo,
          conciliado: false
        }));

        const { error: itensError } = await supabase
          .from('financeiro_conciliacoes_itens')
          .insert(itensToInsert);

        if (itensError) throw itensError;
      }

      toast.success('Conciliação criada com sucesso!');
      setShowNewConciliacao(false);
      setNewConciliacao({
        banco: '',
        data_inicio: '',
        data_fim: '',
        saldo_inicial: 0,
        saldo_final: 0
      });
      loadConciliacoes();
    } catch (error) {
      console.error('Error creating conciliacao:', error);
      toast.error('Erro ao criar conciliação');
    }
  };

  const handleConciliarItem = async (itemId: string, conciliado: boolean) => {
    try {
      const { error } = await supabase
        .from('financeiro_conciliacoes_itens')
        .update({ conciliado })
        .eq('id', itemId);

      if (error) throw error;

      toast.success(conciliado ? 'Item conciliado' : 'Conciliação removida');
      if (selectedConciliacao) {
        loadItensConciliacao(selectedConciliacao.id);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const handleFinalizarConciliacao = async (conciliacaoId: string) => {
    try {
      const { error } = await supabase
        .from('financeiro_conciliacoes')
        .update({ status: 'concluida' })
        .eq('id', conciliacaoId);

      if (error) throw error;

      toast.success('Conciliação finalizada!');
      setSelectedConciliacao(null);
      loadConciliacoes();
    } catch (error) {
      console.error('Error finalizing conciliacao:', error);
      toast.error('Erro ao finalizar conciliação');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    return status === 'concluida' ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getStatusLabel = (status: string) => {
    return status === 'concluida' ? 'Concluída' : 'Em Andamento';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Conciliação Bancária</h1>
          <p className="text-muted-foreground">Gerencie suas conciliações bancárias</p>
        </div>
        <Button onClick={() => setShowNewConciliacao(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conciliação
        </Button>
      </div>

      {/* Lista de Conciliações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Conciliações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Saldo Inicial</TableHead>
                <TableHead>Saldo Final</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conciliacoes.map(conciliacao => (
                <TableRow key={conciliacao.id}>
                  <TableCell className="font-medium">{conciliacao.banco}</TableCell>
                  <TableCell>
                    {new Date(conciliacao.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(conciliacao.data_fim).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{formatCurrency(conciliacao.saldo_inicial)}</TableCell>
                  <TableCell>{formatCurrency(conciliacao.saldo_final)}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(conciliacao.status)} text-white`}>
                      {getStatusLabel(conciliacao.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedConciliacao(conciliacao);
                        loadItensConciliacao(conciliacao.id);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nova Conciliação */}
      <Dialog open={showNewConciliacao} onOpenChange={setShowNewConciliacao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conciliação Bancária</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Banco *</Label>
              <Input
                placeholder="Nome do banco"
                value={newConciliacao.banco}
                onChange={(e) => setNewConciliacao({...newConciliacao, banco: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={newConciliacao.data_inicio}
                  onChange={(e) => setNewConciliacao({...newConciliacao, data_inicio: e.target.value})}
                />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={newConciliacao.data_fim}
                  onChange={(e) => setNewConciliacao({...newConciliacao, data_fim: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newConciliacao.saldo_inicial}
                  onChange={(e) => setNewConciliacao({...newConciliacao, saldo_inicial: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Saldo Final</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newConciliacao.saldo_final}
                  onChange={(e) => setNewConciliacao({...newConciliacao, saldo_final: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewConciliacao(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateConciliacao}>
                Criar Conciliação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes da Conciliação */}
      <Dialog open={!!selectedConciliacao} onOpenChange={() => setSelectedConciliacao(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Conciliação - {selectedConciliacao?.banco}
            </DialogTitle>
          </DialogHeader>
          {selectedConciliacao && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedConciliacao.saldo_inicial)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Saldo Final</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedConciliacao.saldo_final)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Conciliados</p>
                    <p className="text-2xl font-bold text-green-600">
                      {itens.filter(i => i.conciliado).length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {itens.filter(i => !i.conciliado).length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.data_transacao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>
                        <Badge variant={item.tipo === 'receber' ? 'default' : 'destructive'}>
                          {item.tipo === 'receber' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className={item.tipo === 'receber' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(item.valor)}
                      </TableCell>
                      <TableCell>
                        {item.conciliado ? (
                          <Badge className="bg-green-500 text-white">
                            <Check className="mr-1 h-3 w-3" />
                            Conciliado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-white">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!item.conciliado ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConciliarItem(item.id, true)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Conciliar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConciliarItem(item.id, false)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Desfazer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedConciliacao.status === 'em_andamento' && (
                <div className="flex justify-end">
                  <Button onClick={() => handleFinalizarConciliacao(selectedConciliacao.id)}>
                    Finalizar Conciliação
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}