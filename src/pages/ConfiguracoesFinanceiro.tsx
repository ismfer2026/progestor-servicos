import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ConfiguracoesFinanceiro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bancos, setBancos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBancoDialog, setShowBancoDialog] = useState(false);
  const [showCategoriaDialog, setShowCategoriaDialog] = useState(false);
  const [showCentroCustoDialog, setShowCentroCustoDialog] = useState(false);

  const [bancoForm, setBancoForm] = useState({ nome: '', codigo: '', agencia: '', conta: '', saldo_inicial: 0 });
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', tipo: 'ambos', cor: '#3B82F6' });
  const [centroCustoForm, setCentroCustoForm] = useState({ nome: '', codigo: '', descricao: '' });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [bancosRes, categoriasRes, centrosCustoRes] = await Promise.all([
        supabase.from('financeiro_bancos').select('*').eq('empresa_id', user.empresa_id).eq('ativo', true),
        supabase.from('financeiro_categorias').select('*').eq('empresa_id', user.empresa_id).eq('ativo', true),
        supabase.from('financeiro_centros_custo').select('*').eq('empresa_id', user.empresa_id).eq('ativo', true)
      ]);

      if (bancosRes.error) throw bancosRes.error;
      if (categoriasRes.error) throw categoriasRes.error;
      if (centrosCustoRes.error) throw centrosCustoRes.error;

      setBancos(bancosRes.data || []);
      setCategorias(categoriasRes.data || []);
      setCentrosCusto(centrosCustoRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanco = async () => {
    if (!user || !bancoForm.nome) {
      toast.error('Preencha o nome do banco');
      return;
    }

    try {
      const { error } = await supabase.from('financeiro_bancos').insert({
        empresa_id: user.empresa_id,
        ...bancoForm
      });

      if (error) throw error;

      toast.success('Banco cadastrado com sucesso!');
      setBancoForm({ nome: '', codigo: '', agencia: '', conta: '', saldo_inicial: 0 });
      setShowBancoDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving banco:', error);
      toast.error('Erro ao salvar banco');
    }
  };

  const handleSaveCategoria = async () => {
    if (!user || !categoriaForm.nome) {
      toast.error('Preencha o nome da categoria');
      return;
    }

    try {
      const { error } = await supabase.from('financeiro_categorias').insert({
        empresa_id: user.empresa_id,
        ...categoriaForm
      });

      if (error) throw error;

      toast.success('Categoria cadastrada com sucesso!');
      setCategoriaForm({ nome: '', tipo: 'ambos', cor: '#3B82F6' });
      setShowCategoriaDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleSaveCentroCusto = async () => {
    if (!user || !centroCustoForm.nome) {
      toast.error('Preencha o nome do centro de custo');
      return;
    }

    try {
      const { error } = await supabase.from('financeiro_centros_custo').insert({
        empresa_id: user.empresa_id,
        ...centroCustoForm
      });

      if (error) throw error;

      toast.success('Centro de custo cadastrado com sucesso!');
      setCentroCustoForm({ nome: '', codigo: '', descricao: '' });
      setShowCentroCustoDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving centro custo:', error);
      toast.error('Erro ao salvar centro de custo');
    }
  };

  const handleDelete = async (table: 'financeiro_bancos' | 'financeiro_categorias' | 'financeiro_centros_custo', id: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Item removido com sucesso!');
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao remover item');
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => navigate('/financeiro')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold mt-2">Configurações Financeiras</h1>
          <p className="text-muted-foreground">Configure bancos, categorias e centros de custo</p>
        </div>
      </div>

      <Tabs defaultValue="bancos">
        <TabsList>
          <TabsTrigger value="bancos">Bancos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="centros-custo">Centros de Custo</TabsTrigger>
        </TabsList>

        <TabsContent value="bancos">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bancos Cadastrados</CardTitle>
                <Dialog open={showBancoDialog} onOpenChange={setShowBancoDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Banco
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Banco</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nome do Banco</label>
                        <Input
                          value={bancoForm.nome}
                          onChange={(e) => setBancoForm({ ...bancoForm, nome: e.target.value })}
                          placeholder="Ex: Banco do Brasil"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Código</label>
                        <Input
                          value={bancoForm.codigo}
                          onChange={(e) => setBancoForm({ ...bancoForm, codigo: e.target.value })}
                          placeholder="Ex: 001"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Agência</label>
                        <Input
                          value={bancoForm.agencia}
                          onChange={(e) => setBancoForm({ ...bancoForm, agencia: e.target.value })}
                          placeholder="Ex: 1234-5"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Conta</label>
                        <Input
                          value={bancoForm.conta}
                          onChange={(e) => setBancoForm({ ...bancoForm, conta: e.target.value })}
                          placeholder="Ex: 12345-6"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Saldo Inicial</label>
                        <Input
                          type="number"
                          value={bancoForm.saldo_inicial}
                          onChange={(e) => setBancoForm({ ...bancoForm, saldo_inicial: parseFloat(e.target.value) })}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowBancoDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveBanco}>Salvar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Agência</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Saldo Inicial</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bancos.map((banco) => (
                    <TableRow key={banco.id}>
                      <TableCell className="font-medium">{banco.nome}</TableCell>
                      <TableCell>{banco.codigo}</TableCell>
                      <TableCell>{banco.agencia}</TableCell>
                      <TableCell>{banco.conta}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(banco.saldo_inicial)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete('financeiro_bancos', banco.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Categorias Cadastradas</CardTitle>
                <Dialog open={showCategoriaDialog} onOpenChange={setShowCategoriaDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nome da Categoria</label>
                        <Input
                          value={categoriaForm.nome}
                          onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                          placeholder="Ex: Vendas"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tipo</label>
                        <Select value={categoriaForm.tipo} onValueChange={(v) => setCategoriaForm({ ...categoriaForm, tipo: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="receber">A Receber</SelectItem>
                            <SelectItem value="pagar">A Pagar</SelectItem>
                            <SelectItem value="ambos">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Cor</label>
                        <Input
                          type="color"
                          value={categoriaForm.cor}
                          onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCategoriaDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveCategoria}>Salvar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cat.tipo === 'receber' ? 'A Receber' : cat.tipo === 'pagar' ? 'A Pagar' : 'Ambos'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: cat.cor }}></div>
                          {cat.cor}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete('financeiro_categorias', cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centros-custo">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Centros de Custo Cadastrados</CardTitle>
                <Dialog open={showCentroCustoDialog} onOpenChange={setShowCentroCustoDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Centro de Custo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Centro de Custo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                          value={centroCustoForm.nome}
                          onChange={(e) => setCentroCustoForm({ ...centroCustoForm, nome: e.target.value })}
                          placeholder="Ex: Administrativo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Código</label>
                        <Input
                          value={centroCustoForm.codigo}
                          onChange={(e) => setCentroCustoForm({ ...centroCustoForm, codigo: e.target.value })}
                          placeholder="Ex: ADM"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Descrição</label>
                        <Textarea
                          value={centroCustoForm.descricao}
                          onChange={(e) => setCentroCustoForm({ ...centroCustoForm, descricao: e.target.value })}
                          placeholder="Descrição do centro de custo"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCentroCustoDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveCentroCusto}>Salvar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centrosCusto.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-medium">{cc.nome}</TableCell>
                      <TableCell>{cc.codigo}</TableCell>
                      <TableCell>{cc.descricao}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete('financeiro_centros_custo', cc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}