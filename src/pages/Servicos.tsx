import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, Upload, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ServicoItem {
  id: string;
  nome: string;
  descricao?: string | null;
  preco_venda?: number | null;
  status?: string | null;
  categoria?: string | null;
  imagem_url?: string | null;
  custo_produto?: number | null;
  custo_mao_obra?: number | null;
  markup_percent?: number | null;
  created_at?: string;
}

interface EstoqueItem {
  id: string;
  nome: string;
  saldo: number;
  unidade: string;
}

interface ServicoEstoqueItem {
  item_id: string;
  quantidade: number;
  item?: EstoqueItem;
}

export function Servicos() {
  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<ServicoItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user } = useAuth();
  const [estoqueItems, setEstoqueItems] = useState<EstoqueItem[]>([]);
  const [selectedEstoqueItems, setSelectedEstoqueItems] = useState<ServicoEstoqueItem[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    custo_produto: '',
    custo_mao_obra: '',
    markup_percent: '50',
    categoria: '',
    imagem_url: '',
    status: 'Ativo'
  });

  useEffect(() => {
    fetchServicos();
    fetchEstoqueItems();
    fetchCategorias();
  }, [user]);

  const fetchEstoqueItems = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('estoque_itens')
        .select('id, nome, saldo, unidade')
        .eq('empresa_id', user.empresa_id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setEstoqueItems(data || []);
    } catch (error) {
      console.error('Error fetching estoque items:', error);
    }
  };

  const fetchCategorias = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'categorias_servicos')
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.valor && Array.isArray(data.valor)) {
        const categoriasArray = data.valor
          .filter((item): item is { nome: string; cor: string } => 
            typeof item === 'object' && item !== null && 'nome' in item
          )
          .map(item => item.nome);
        setCategorias(categoriasArray);
      }
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  };

  const fetchServicos = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
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
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao || '',
        custo_produto: servico.custo_produto?.toString() || '0',
        custo_mao_obra: servico.custo_mao_obra?.toString() || '0',
        markup_percent: ((servico.markup_percent || 0.5) * 100).toString(),
        categoria: servico.categoria || '',
        imagem_url: servico.imagem_url || '',
        status: servico.status || 'Ativo'
      });

      // Fetch existing estoque items for this service
      const { data } = await supabase
        .from('servicos_estoque_itens')
        .select('item_id, quantidade, estoque_itens(id, nome, saldo, unidade)')
        .eq('servico_id', servico.id);

      if (data) {
        setSelectedEstoqueItems(
          data.map((item: any) => ({
            item_id: item.item_id,
            quantidade: item.quantidade,
            item: item.estoque_itens
          }))
        );
      }
    } else {
      setEditingServico(null);
      setSelectedEstoqueItems([]);
      setFormData({
        nome: '',
        descricao: '',
        custo_produto: '0',
        custo_mao_obra: '0',
        markup_percent: '50',
        categoria: '',
        imagem_url: '',
        status: 'Ativo'
      });
    }
    setModalOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.empresa_id) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.empresa_id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('servico-imagens')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('servico-imagens')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, imagem_url: publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Nome do serviço/produto é obrigatório');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Erro: usuário não está associado a uma empresa');
      return;
    }

    try {
      const custoTotal = parseFloat(formData.custo_produto || '0') + parseFloat(formData.custo_mao_obra || '0');
      const markup = parseFloat(formData.markup_percent || '0') / 100;
      const precoVenda = custoTotal * (1 + markup);

      const servicoData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        custo_produto: parseFloat(formData.custo_produto || '0'),
        custo_mao_obra: parseFloat(formData.custo_mao_obra || '0'),
        markup_percent: markup,
        categoria: formData.categoria || null,
        imagem_url: formData.imagem_url || null,
        status: formData.status,
        empresa_id: user.empresa_id,
      };

      let servicoId = editingServico?.id;

      if (editingServico) {
        // Update existing service
        const { error } = await supabase
          .from('servicos')
          .update(servicoData)
          .eq('id', editingServico.id);

        if (error) throw error;

        // Delete existing estoque items
        await supabase
          .from('servicos_estoque_itens')
          .delete()
          .eq('servico_id', editingServico.id);

        toast.success('Serviço/Produto atualizado com sucesso!');
      } else {
        // Create new service
        const { data, error } = await supabase
          .from('servicos')
          .insert([servicoData])
          .select()
          .single();

        if (error) throw error;
        servicoId = data.id;
        toast.success('Serviço/Produto cadastrado com sucesso!');
      }

      // Insert estoque items
      if (selectedEstoqueItems.length > 0 && servicoId) {
        const estoqueData = selectedEstoqueItems.map(item => ({
          servico_id: servicoId,
          item_id: item.item_id,
          quantidade: item.quantidade,
          empresa_id: user.empresa_id
        }));

        const { error } = await supabase
          .from('servicos_estoque_itens')
          .insert(estoqueData);

        if (error) throw error;
      }

      setModalOpen(false);
      fetchServicos();
    } catch (error) {
      console.error('Error saving servico:', error);
      toast.error('Erro ao salvar serviço/produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço/produto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Serviço/Produto excluído com sucesso!');
      fetchServicos();
    } catch (error) {
      console.error('Error deleting servico:', error);
      toast.error('Erro ao excluir serviço/produto');
    }
  };

  const addEstoqueItem = () => {
    setSelectedEstoqueItems([...selectedEstoqueItems, { item_id: '', quantidade: 1 }]);
  };

  const removeEstoqueItem = (index: number) => {
    setSelectedEstoqueItems(selectedEstoqueItems.filter((_, i) => i !== index));
  };

  const updateEstoqueItem = (index: number, field: 'item_id' | 'quantidade', value: string | number) => {
    const updated = [...selectedEstoqueItems];
    if (field === 'item_id') {
      const item = estoqueItems.find(i => i.id === value);
      updated[index] = { ...updated[index], item_id: value as string, item };
    } else {
      updated[index] = { ...updated[index], quantidade: value as number };
    }
    setSelectedEstoqueItems(updated);
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate real-time service value
  const custoTotal = parseFloat(formData.custo_produto || '0') + parseFloat(formData.custo_mao_obra || '0');
  const markup = parseFloat(formData.markup_percent || '0') / 100;
  const precoVendaCalculado = custoTotal * (1 + markup);
  const lucroCalculado = precoVendaCalculado - custoTotal;

  const filteredServicos = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total value of all services
  const valorTotalServicos = servicos.reduce((sum, s) => sum + (s.preco_venda || 0), 0);

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
          <h1 className="text-3xl font-bold text-foreground">Catálogo de Serviços e Produtos</h1>
          <p className="text-muted-foreground">Adicione e gerencie os serviços e produtos que sua empresa oferece.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Serviço/Produto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Serviços/Produtos</p>
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
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
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
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(valorTotalServicos)}
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
              placeholder="Buscar por nome, descrição ou categoria..."
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
                <TableHead>Imagem</TableHead>
                <TableHead>Nome do Serviço/Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell>
                    {servico.imagem_url ? (
                      <img src={servico.imagem_url} alt={servico.nome} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{servico.nome}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {servico.categoria || '-'}
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
                Nenhum serviço/produto encontrado
              </p>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro serviço/produto'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Serviço/Produto
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for Create/Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingServico ? 'Editar Serviço/Produto' : 'Novo Serviço/Produto'}
            </DialogTitle>
            <DialogDescription>
              Cadastre os serviços e produtos que sua empresa oferece
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div>
              <Label htmlFor="nome">Nome do Serviço/Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Manutenção de Ar Condicionado"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              {categorias.length > 0 ? (
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat, index) => (
                      <SelectItem key={index} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Nenhuma categoria cadastrada. Configure em{' '}
                  <Link to="/configuracoes" className="text-primary hover:underline">
                    Configurações &gt; Categorias
                  </Link>
                </div>
              )}
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
              <Label htmlFor="imagem">Imagem do Serviço/Produto</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="imagem"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <span className="text-sm text-muted-foreground">Enviando...</span>}
              </div>
              {formData.imagem_url && (
                <img src={formData.imagem_url} alt="Preview" className="w-32 h-32 object-cover rounded-md mt-2" />
              )}
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="status">Serviço/Produto Ativo</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Serviços/Produtos inativos não aparecerão para seleção em novos orçamentos
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.status === 'Ativo'}
                  onCheckedChange={(checked) => setFormData({...formData, status: checked ? 'Ativo' : 'Inativo'})}
                />
              </div>
            </div>

            {/* Estoque Items Selection */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Itens do Estoque</Label>
                <Button type="button" size="sm" variant="outline" onClick={addEstoqueItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Vincule os itens do estoque que serão utilizados neste serviço/produto
              </p>
              
              {selectedEstoqueItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`item-${index}`}>Item</Label>
                    <Select
                      value={item.item_id}
                      onValueChange={(value) => updateEstoqueItem(index, 'item_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item" />
                      </SelectTrigger>
                      <SelectContent>
                        {estoqueItems.map((estoqueItem) => (
                          <SelectItem key={estoqueItem.id} value={estoqueItem.id}>
                            {estoqueItem.nome} (Saldo: {estoqueItem.saldo} {estoqueItem.unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`quantidade-${index}`}>Quantidade</Label>
                    <Input
                      id={`quantidade-${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) => updateEstoqueItem(index, 'quantidade', parseFloat(e.target.value))}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeEstoqueItem(index)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {selectedEstoqueItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum item vinculado
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="custo_produto">Custo do Produto/Material (R$)</Label>
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
              <Label htmlFor="custo_mao_obra">Custo da Mão de Obra (R$)</Label>
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
            </div>

            {/* Cálculo em tempo real */}
            <div className="border-t pt-4 mt-4 bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Cálculo do Valor do Serviço</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo Total:</span>
                  <span className="font-medium">{formatCurrency(custoTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margem de Lucro ({formData.markup_percent}%):</span>
                  <span className="font-medium">{formatCurrency(lucroCalculado)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Valor do Serviço:</span>
                  <span className="text-primary">{formatCurrency(precoVendaCalculado)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingServico ? 'Atualizar' : 'Criar'} Serviço/Produto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}