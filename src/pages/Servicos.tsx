import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ServicoItem {
  id: string;
  nome: string;
  descricao?: string | null;
  preco_venda?: number | null;
  status?: string | null;
  created_at?: string;
}

export function Servicos() {
  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<ServicoItem | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    custo_produto: '',
    custo_mao_obra: '',
    markup_percent: '50',
  });

  useEffect(() => {
    fetchServicos();
  }, [user]);

  const fetchServicos = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, descricao, preco_venda, status, created_at')
        .eq('empresa_id', user.empresa_id)
        .is('cliente_id', null) // Only fetch catalog items (not service executions)
        .order('nome');

      if (error) {
        console.error('Error fetching servicos:', error);
        toast.error('Erro ao carregar serviços');
      } else {
        setServicos((data || []) as ServicoItem[]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (servico?: ServicoItem) => {
    if (servico) {
      setEditingServico(servico);
      // Fetch full servico details to get cost fields
      const { data } = await supabase
        .from('servicos')
        .select('custo_produto, custo_mao_obra, markup_percent')
        .eq('id', servico.id)
        .single();
      
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao || '',
        custo_produto: data?.custo_produto?.toString() || '0',
        custo_mao_obra: data?.custo_mao_obra?.toString() || '0',
        markup_percent: ((data?.markup_percent || 0.5) * 100).toString(),
      });
    } else {
      setEditingServico(null);
      setFormData({
        nome: '',
        descricao: '',
        custo_produto: '0',
        custo_mao_obra: '0',
        markup_percent: '50',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Erro: usuário não está associado a uma empresa');
      return;
    }

    try {
      const servicoData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        custo_produto: formData.custo_produto ? parseFloat(formData.custo_produto) : 0,
        custo_mao_obra: formData.custo_mao_obra ? parseFloat(formData.custo_mao_obra) : 0,
        markup_percent: formData.markup_percent ? parseFloat(formData.markup_percent) / 100 : 0.5,
        empresa_id: user.empresa_id,
        status: 'Ativo',
      };

      if (editingServico) {
        // Update existing service
        const { error } = await supabase
          .from('servicos')
          .update(servicoData)
          .eq('id', editingServico.id);

        if (error) throw error;
        toast.success('Serviço atualizado com sucesso!');
      } else {
        // Create new service
        const { error } = await supabase
          .from('servicos')
          .insert([servicoData]);

        if (error) throw error;
        toast.success('Serviço cadastrado com sucesso!');
      }

      setModalOpen(false);
      fetchServicos();
    } catch (error) {
      console.error('Error saving servico:', error);
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Serviço excluído com sucesso!');
      fetchServicos();
    } catch (error) {
      console.error('Error deleting servico:', error);
      toast.error('Erro ao excluir serviço');
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredServicos = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catálogo de Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos pela empresa</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Serviços</p>
                <p className="text-2xl font-bold text-foreground">{servicos.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serviços Ativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {servicos.filter(s => s.status === 'Ativo').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preço Médio</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    servicos.reduce((sum, s) => sum + (s.preco_venda || 0), 0) / (servicos.length || 1)
                  )}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell>
                    <div className="font-medium">{servico.nome}</div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="text-sm text-muted-foreground truncate">
                      {servico.descricao || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(servico.preco_venda)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={servico.status === 'Ativo' ? 'default' : 'secondary'}>
                      {servico.status || 'Ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(servico)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(servico.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredServicos.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum serviço encontrado
              </p>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro serviço'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Serviço
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for Create/Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogDescription>
              Cadastre os serviços que sua empresa oferece
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Serviço *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Manutenção de Ar Condicionado"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva os detalhes do serviço..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="custo_produto">Custo do Produto/Material *</Label>
              <Input
                id="custo_produto"
                type="number"
                min="0"
                step="0.01"
                value={formData.custo_produto}
                onChange={(e) => setFormData({ ...formData, custo_produto: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="custo_mao_obra">Custo da Mão de Obra *</Label>
              <Input
                id="custo_mao_obra"
                type="number"
                min="0"
                step="0.01"
                value={formData.custo_mao_obra}
                onChange={(e) => setFormData({ ...formData, custo_mao_obra: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="markup_percent">Margem de Lucro (%)</Label>
              <Input
                id="markup_percent"
                type="number"
                min="0"
                max="1000"
                step="1"
                value={formData.markup_percent}
                onChange={(e) => setFormData({ ...formData, markup_percent: e.target.value })}
                placeholder="50"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Preço de venda será calculado automaticamente: (Custo Total) × (1 + Margem/100)
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingServico ? 'Atualizar' : 'Criar'} Serviço
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
