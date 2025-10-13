import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Eye, Send } from 'lucide-react';
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

interface NFSe {
  id: string;
  numero_nota?: string;
  serie?: string;
  data_emissao: string;
  valor_servico: number;
  valor_liquido: number;
  descricao_servico: string;
  status: string;
  cliente_id?: string;
  aliquota_iss: number;
  valor_iss: number;
}

interface Cliente {
  id: string;
  nome: string;
  documento?: string;
}

export default function NFSe() {
  const { user } = useAuth();
  const [notas, setNotas] = useState<NFSe[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewNota, setShowNewNota] = useState(false);
  const [newNota, setNewNota] = useState({
    cliente_id: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_competencia: new Date().toISOString().split('T')[0],
    valor_servico: 0,
    descricao_servico: '',
    codigo_servico: '',
    aliquota_iss: 5,
    valor_deducoes: 0,
    valor_pis: 0,
    valor_cofins: 0,
    valor_inss: 0,
    valor_ir: 0,
    valor_csll: 0
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Carregar notas
      const { data: notasData, error: notasError } = await supabase
        .from('financeiro_nfse')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('data_emissao', { ascending: false });

      if (notasError) throw notasError;

      // Carregar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome, documento')
        .eq('empresa_id', user.empresa_id)
        .order('nome');

      if (clientesError) throw clientesError;

      setNotas(notasData || []);
      setClientes(clientesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calculateValorLiquido = () => {
    const valorServico = newNota.valor_servico || 0;
    const iss = (valorServico * (newNota.aliquota_iss / 100));
    const totalDeducoes = (newNota.valor_deducoes || 0) + 
                         (newNota.valor_pis || 0) + 
                         (newNota.valor_cofins || 0) + 
                         (newNota.valor_inss || 0) + 
                         (newNota.valor_ir || 0) + 
                         (newNota.valor_csll || 0) + 
                         iss;
    
    return valorServico - totalDeducoes;
  };

  const handleCreateNota = async () => {
    if (!user || !newNota.cliente_id || !newNota.descricao_servico) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const valorLiquido = calculateValorLiquido();
      const valorISS = newNota.valor_servico * (newNota.aliquota_iss / 100);

      const { error } = await supabase
        .from('financeiro_nfse')
        .insert({
          empresa_id: user.empresa_id,
          cliente_id: newNota.cliente_id,
          data_emissao: newNota.data_emissao,
          data_competencia: newNota.data_competencia,
          valor_servico: newNota.valor_servico,
          descricao_servico: newNota.descricao_servico,
          codigo_servico: newNota.codigo_servico,
          aliquota_iss: newNota.aliquota_iss,
          valor_iss: valorISS,
          valor_deducoes: newNota.valor_deducoes,
          valor_pis: newNota.valor_pis,
          valor_cofins: newNota.valor_cofins,
          valor_inss: newNota.valor_inss,
          valor_ir: newNota.valor_ir,
          valor_csll: newNota.valor_csll,
          valor_liquido: valorLiquido,
          status: 'emitida'
        });

      if (error) throw error;

      toast.success('NFS-e criada com sucesso!');
      setShowNewNota(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating nota:', error);
      toast.error('Erro ao criar NFS-e');
    }
  };

  const resetForm = () => {
    setNewNota({
      cliente_id: '',
      data_emissao: new Date().toISOString().split('T')[0],
      data_competencia: new Date().toISOString().split('T')[0],
      valor_servico: 0,
      descricao_servico: '',
      codigo_servico: '',
      aliquota_iss: 5,
      valor_deducoes: 0,
      valor_pis: 0,
      valor_cofins: 0,
      valor_inss: 0,
      valor_ir: 0,
      valor_csll: 0
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitida': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      case 'rascunho': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'emitida': return 'Emitida';
      case 'cancelada': return 'Cancelada';
      case 'rascunho': return 'Rascunho';
      default: return status;
    }
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
          <h1 className="text-3xl font-bold">NFS-e</h1>
          <p className="text-muted-foreground">Gerenciamento de Notas Fiscais de Serviço Eletrônicas</p>
        </div>
        <Button onClick={() => setShowNewNota(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova NFS-e
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Emitido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(notas.reduce((acc, n) => acc + n.valor_servico, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Líquido Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(notas.reduce((acc, n) => acc + n.valor_liquido, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Bruto</TableHead>
                <TableHead>ISS</TableHead>
                <TableHead>Valor Líquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.map(nota => {
                const cliente = clientes.find(c => c.id === nota.cliente_id);
                return (
                  <TableRow key={nota.id}>
                    <TableCell className="font-medium">{nota.numero_nota || '-'}</TableCell>
                    <TableCell>{new Date(nota.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{cliente?.nome || '-'}</TableCell>
                    <TableCell>{formatCurrency(nota.valor_servico)}</TableCell>
                    <TableCell>{formatCurrency(nota.valor_iss)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(nota.valor_liquido)}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(nota.status)} text-white`}>
                        {getStatusLabel(nota.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nova Nota */}
      <Dialog open={showNewNota} onOpenChange={setShowNewNota}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova NFS-e</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Select value={newNota.cliente_id} onValueChange={(value) => setNewNota({...newNota, cliente_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Código do Serviço</Label>
                <Input
                  placeholder="Ex: 01.01"
                  value={newNota.codigo_servico}
                  onChange={(e) => setNewNota({...newNota, codigo_servico: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Emissão *</Label>
                <Input
                  type="date"
                  value={newNota.data_emissao}
                  onChange={(e) => setNewNota({...newNota, data_emissao: e.target.value})}
                />
              </div>
              <div>
                <Label>Data de Competência</Label>
                <Input
                  type="date"
                  value={newNota.data_competencia}
                  onChange={(e) => setNewNota({...newNota, data_competencia: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Descrição do Serviço *</Label>
              <Textarea
                placeholder="Descreva o serviço prestado..."
                value={newNota.descricao_servico}
                onChange={(e) => setNewNota({...newNota, descricao_servico: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor do Serviço *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={newNota.valor_servico}
                  onChange={(e) => setNewNota({...newNota, valor_servico: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Alíquota ISS (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newNota.aliquota_iss}
                  onChange={(e) => setNewNota({...newNota, aliquota_iss: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Deduções e Impostos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>PIS</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newNota.valor_pis}
                    onChange={(e) => setNewNota({...newNota, valor_pis: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>COFINS</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newNota.valor_cofins}
                    onChange={(e) => setNewNota({...newNota, valor_cofins: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>INSS</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newNota.valor_inss}
                    onChange={(e) => setNewNota({...newNota, valor_inss: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>IR</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newNota.valor_ir}
                    onChange={(e) => setNewNota({...newNota, valor_ir: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>CSLL</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newNota.valor_csll}
                    onChange={(e) => setNewNota({...newNota, valor_csll: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Outras Deduções</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newNota.valor_deducoes}
                    onChange={(e) => setNewNota({...newNota, valor_deducoes: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Líquido:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateValorLiquido())}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewNota(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateNota}>
                Emitir NFS-e
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}