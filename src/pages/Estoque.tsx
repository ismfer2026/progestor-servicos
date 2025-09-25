import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, Wrench, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EstoqueItem {
  id: string;
  nome: string;
  sku?: string;
  tipo: string;
  saldo: number;
  saldo_minimo: number;
  custo: number;
  venda: number;
  categoria?: string;
  unidade: string;
  localizacao?: string;
  status: string;
}

interface EstoqueReserva {
  id: string;
  item_id: string;
  quantidade: number;
  data_reserva: string;
  status: string;
  servico_id?: string;
  item?: EstoqueItem;
}

interface EstoqueManutencao {
  id: string;
  item_id: string;
  defeito: string;
  data_entrada: string;
  previsao_retorno?: string;
  status: string;
  item?: EstoqueItem;
}

export default function Estoque() {
  const { user } = useAuth();
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [reservas, setReservas] = useState<EstoqueReserva[]>([]);
  const [manutencoes, setManutencoes] = useState<EstoqueManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewItem, setShowNewItem] = useState(false);
  const [activeTab, setActiveTab] = useState('itens');

  useEffect(() => {
    loadEstoqueData();
  }, [user]);

  const loadEstoqueData = async () => {
    if (!user) return;

    try {
      // Load items
      const { data: itensData, error: itensError } = await supabase
        .from('estoque_itens')
        .select('*')
        .order('nome');

      if (itensError) throw itensError;

      // Load reservations
      const { data: reservasData, error: reservasError } = await supabase
        .from('estoque_reservas')
        .select(`
          *,
          item:estoque_itens(nome, unidade)
        `)
        .eq('status', 'reservado')
        .order('data_reserva');

      if (reservasError) throw reservasError;

      // Load maintenance
      const { data: manutencoesData, error: manutencoesError } = await supabase
        .from('estoque_manutencao')
        .select(`
          *,
          item:estoque_itens(nome, unidade)
        `)
        .eq('status', 'em_manutencao')
        .order('data_entrada');

      if (manutencoesError) throw manutencoesError;

      setItens(itensData || []);
      setReservas(reservasData || []);
      setManutencoes(manutencoesData || []);
    } catch (error) {
      console.error('Error loading estoque data:', error);
      toast.error('Erro ao carregar dados do estoque');
    } finally {
      setLoading(false);
    }
  };

  const filteredItens = itens.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500';
      case 'inativo': return 'bg-red-500';
      case 'baixo_estoque': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'baixo_estoque': return 'Baixo Estoque';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTotalValue = () => {
    return itens.reduce((total, item) => total + (item.saldo * item.custo), 0);
  };

  const getLowStockItems = () => {
    return itens.filter(item => item.saldo <= item.saldo_minimo);
  };

  const categories = [...new Set(itens.map(item => item.categoria).filter(Boolean))];

  const renderItensTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itens.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalValue())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getLowStockItems().length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{manutencoes.length}</div>
          </CardContent>
        </Card>
      </div>

      {getLowStockItems().length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getLowStockItems().length} itens com estoque baixo precisam de atenção.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Itens do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItens.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      {item.localizacao && (
                        <p className="text-sm text-muted-foreground">{item.localizacao}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.sku || '-'}</TableCell>
                  <TableCell>{item.categoria || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className={item.saldo <= item.saldo_minimo ? 'text-yellow-600 font-semibold' : ''}>
                        {item.saldo}
                      </span>
                      <span className="text-muted-foreground">{item.unidade}</span>
                    </div>
                    {item.saldo <= item.saldo_minimo && (
                      <p className="text-xs text-yellow-600">Mín: {item.saldo_minimo}</p>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(item.custo)}</TableCell>
                  <TableCell>{formatCurrency(item.venda)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(item.status)} text-white`}
                    >
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Package className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderReservasTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Itens Reservados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Data da Reserva</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservas.map(reserva => (
              <TableRow key={reserva.id}>
                <TableCell>
                  {reserva.item?.nome || 'Item não encontrado'}
                </TableCell>
                <TableCell>
                  {reserva.quantidade} {reserva.item?.unidade}
                </TableCell>
                <TableCell>
                  {new Date(reserva.data_reserva).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  {reserva.servico_id ? `Serviço #${reserva.servico_id.slice(-8)}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-blue-500 text-white">
                    Reservado
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    Liberar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderManutencaoTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Itens em Manutenção</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Defeito</TableHead>
              <TableHead>Data Entrada</TableHead>
              <TableHead>Previsão Retorno</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manutencoes.map(manutencao => (
              <TableRow key={manutencao.id}>
                <TableCell>
                  {manutencao.item?.nome || 'Item não encontrado'}
                </TableCell>
                <TableCell>{manutencao.defeito}</TableCell>
                <TableCell>
                  {new Date(manutencao.data_entrada).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  {manutencao.previsao_retorno
                    ? new Date(manutencao.previsao_retorno).toLocaleDateString('pt-BR')
                    : 'Não definida'
                  }
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-red-500 text-white">
                    Em Manutenção
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    <Wrench className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">Gerencie seus itens e insumos</p>
        </div>
        <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Item do Estoque</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input placeholder="Nome do item" />
                </div>
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <Input placeholder="Código SKU" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produto">Produto</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="ferramenta">Ferramenta</SelectItem>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Input placeholder="Categoria do item" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Saldo Atual</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo Mínimo</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Custo</label>
                  <Input type="number" placeholder="R$ 0,00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Preço de Venda</label>
                  <Input type="number" placeholder="R$ 0,00" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowNewItem(false)}>
                Cancelar
              </Button>
              <Button>Salvar Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category!}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="itens">Itens e Insumos</TabsTrigger>
          <TabsTrigger value="reservas">Itens Reservados</TabsTrigger>
          <TabsTrigger value="manutencao">Itens em Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="itens" className="mt-6">
          {renderItensTab()}
        </TabsContent>

        <TabsContent value="reservas" className="mt-6">
          {renderReservasTab()}
        </TabsContent>

        <TabsContent value="manutencao" className="mt-6">
          {renderManutencaoTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}