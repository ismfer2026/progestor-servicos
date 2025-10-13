import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Upload, FileText, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addDays, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import Conciliacao from './Conciliacao';
import NFSe from './NFSe';

interface FinanceiroMovimentacao {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  categoria?: string;
  centro_custo?: string;
  forma_pagamento?: string;
  cliente_id?: string;
  banco_id?: string;
}

export default function Financeiro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [movimentacoes, setMovimentacoes] = useState<FinanceiroMovimentacao[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Form states
  const [formTipo, setFormTipo] = useState('receber');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formDataVencimento, setFormDataVencimento] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formCentroCusto, setFormCentroCusto] = useState('');
  const [formFormaPagamento, setFormFormaPagamento] = useState('');
  const [formBanco, setFormBanco] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');
  
  // Multiple installments
  const [formParcelas, setFormParcelas] = useState(1);
  const [formTipoParcelas, setFormTipoParcelas] = useState<'dias' | 'mes'>('mes');
  const [formDiaFixo, setFormDiaFixo] = useState('');
  const [formIntervalo, setFormIntervalo] = useState(30);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [movimentacoesRes, bancosRes, categoriasRes, centrosCustoRes] = await Promise.all([
        supabase.from('financeiro_movimentacoes').select('*').eq('empresa_id', user.empresa_id).order('data_vencimento'),
        supabase.from('financeiro_bancos').select('*').eq('empresa_id', user.empresa_id).eq('ativo', true),
        supabase.from('financeiro_categorias').select('*').eq('empresa_id', user.empresa_id).eq('ativo', true),
        supabase.from('financeiro_centros_custo').select('*').eq('empresa_id', user.empresa_id).eq('ativo', true)
      ]);

      if (movimentacoesRes.error) throw movimentacoesRes.error;
      if (bancosRes.error) throw bancosRes.error;
      if (categoriasRes.error) throw categoriasRes.error;
      if (centrosCustoRes.error) throw centrosCustoRes.error;

      setMovimentacoes(movimentacoesRes.data || []);
      setBancos(bancosRes.data || []);
      setCategorias(categoriasRes.data || []);
      setCentrosCusto(centrosCustoRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMovimento = async () => {
    if (!user || !formDescricao || !formValor || !formDataVencimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const parcelas: any[] = [];
      const valorParcela = parseFloat(formValor) / formParcelas;

      for (let i = 0; i < formParcelas; i++) {
        let dataVencimento: Date;
        
        if (formTipoParcelas === 'mes' && formDiaFixo) {
          const baseDate = new Date(formDataVencimento);
          dataVencimento = addMonths(baseDate, i);
          dataVencimento.setDate(parseInt(formDiaFixo));
        } else if (formTipoParcelas === 'dias') {
          dataVencimento = addDays(new Date(formDataVencimento), i * formIntervalo);
        } else {
          dataVencimento = addMonths(new Date(formDataVencimento), i);
        }

        parcelas.push({
          empresa_id: user.empresa_id,
          tipo: formTipo,
          descricao: formParcelas > 1 ? `${formDescricao} (${i + 1}/${formParcelas})` : formDescricao,
          valor: valorParcela,
          data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
          categoria: formCategoria || null,
          centro_custo: formCentroCusto || null,
          forma_pagamento: formFormaPagamento || null,
          banco_id: formBanco || null,
          observacoes: formObservacoes || null,
          status: 'pendente'
        });
      }

      const { error } = await supabase.from('financeiro_movimentacoes').insert(parcelas);

      if (error) throw error;

      toast.success(`${formParcelas > 1 ? formParcelas + ' movimentações' : 'Movimentação'} criada com sucesso!`);
      resetForm();
      setShowNewMovement(false);
      loadData();
    } catch (error) {
      console.error('Error saving movimento:', error);
      toast.error('Erro ao salvar movimentação');
    }
  };

  const resetForm = () => {
    setFormTipo('receber');
    setFormDescricao('');
    setFormValor('');
    setFormDataVencimento('');
    setFormCategoria('');
    setFormCentroCusto('');
    setFormFormaPagamento('');
    setFormBanco('');
    setFormObservacoes('');
    setFormParcelas(1);
    setFormDiaFixo('');
    setFormIntervalo(30);
  };

  const filteredMovimentacoes = movimentacoes.filter(mov => {
    const matchesSearch = mov.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || mov.status === selectedStatus;
    const matchesTipo = selectedTipo === 'all' || mov.tipo === selectedTipo;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-green-500';
      case 'pendente': return 'bg-yellow-500';
      case 'vencido': return 'bg-red-500';
      case 'cancelado': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'pendente': return 'Pendente';
      case 'vencido': return 'Vencido';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'receber' ? 'text-green-600' : 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calculateTotals = () => {
    const totalReceber = movimentacoes
      .filter(mov => mov.tipo === 'receber' && mov.status === 'pendente')
      .reduce((sum, mov) => sum + mov.valor, 0);

    const totalPagar = movimentacoes
      .filter(mov => mov.tipo === 'pagar' && mov.status === 'pendente')
      .reduce((sum, mov) => sum + mov.valor, 0);

    const totalRecebido = movimentacoes
      .filter(mov => mov.tipo === 'receber' && mov.status === 'pago')
      .reduce((sum, mov) => sum + mov.valor, 0);

    const totalPago = movimentacoes
      .filter(mov => mov.tipo === 'pagar' && mov.status === 'pago')
      .reduce((sum, mov) => sum + mov.valor, 0);

    return { totalReceber, totalPagar, totalRecebido, totalPago };
  };

  const getVencimentosProximos = () => {
    const hoje = new Date();
    const proximosSete = addDays(hoje, 7);
    
    return movimentacoes.filter(mov => {
      const vencimento = new Date(mov.data_vencimento);
      return vencimento >= hoje && vencimento <= proximosSete && mov.status === 'pendente';
    });
  };

  const { totalReceber, totalPagar, totalRecebido, totalPago } = calculateTotals();
  const vencimentosProximos = getVencimentosProximos();

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceber)}</div>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
              A Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPagar)}</div>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-600" />
              Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecebido)}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-red-600" />
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPago)}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {vencimentosProximos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Vencimentos Próximos (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vencimentosProximos.slice(0, 5).map(mov => (
                <div key={mov.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{mov.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      Vence: {format(new Date(mov.data_vencimento), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className={`font-semibold ${getTipoColor(mov.tipo)}`}>
                    {mov.tipo === 'receber' ? '+' : '-'}{formatCurrency(mov.valor)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa (Resumo)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Saldo Projetado (A Receber - A Pagar):</span>
              <span className={`font-bold ${totalReceber - totalPagar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalReceber - totalPagar)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Resultado do Mês (Recebido - Pago):</span>
              <span className={`font-bold ${totalRecebido - totalPago >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalRecebido - totalPago)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMovimentacoes = () => (
    <Card>
      <CardHeader>
        <CardTitle>Movimentações Financeiras</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovimentacoes.map(mov => (
              <TableRow key={mov.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{mov.descricao}</p>
                    {mov.centro_custo && (
                      <p className="text-sm text-muted-foreground">{mov.centro_custo}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={mov.tipo === 'receber' ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}>
                    {mov.tipo === 'receber' ? 'Receber' : 'Pagar'}
                  </Badge>
                </TableCell>
                <TableCell className={`font-semibold ${getTipoColor(mov.tipo)}`}>
                  {mov.tipo === 'receber' ? '+' : '-'}{formatCurrency(mov.valor)}
                </TableCell>
                <TableCell>{format(new Date(mov.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${getStatusColor(mov.status)} text-white`}>
                    {getStatusLabel(mov.status)}
                  </Badge>
                </TableCell>
                <TableCell>{mov.categoria || '-'}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost">
                      <FileText className="h-4 w-4" />
                    </Button>
                    {mov.status === 'pendente' && (
                      <Button size="sm" variant="ghost">Baixar</Button>
                    )}
                  </div>
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
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie suas finanças</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/financeiro/configuracoes')}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar OFX/CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Extrato</DialogTitle>
                <DialogDescription>
                  Faça upload do arquivo OFX ou CSV do seu banco
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="file" accept=".ofx,.csv" />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancelar</Button>
                  <Button onClick={() => { toast.info('Funcionalidade em desenvolvimento'); setShowImportDialog(false); }}>Importar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showNewMovement} onOpenChange={setShowNewMovement}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Movimentação</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo *</label>
                    <Select value={formTipo} onValueChange={setFormTipo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receber">A Receber</SelectItem>
                        <SelectItem value="pagar">A Pagar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição *</label>
                    <Input value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Descrição da movimentação" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valor Total *</label>
                    <Input type="number" value={formValor} onChange={(e) => setFormValor(e.target.value)} placeholder="R$ 0,00" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Primeira Parcela *</label>
                    <Input type="date" value={formDataVencimento} onChange={(e) => setFormDataVencimento(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Categoria</label>
                    <Select value={formCategoria} onValueChange={setFormCategoria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.filter(c => c.tipo === formTipo || c.tipo === 'ambos').map(cat => (
                          <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Centro de Custo</label>
                    <Select value={formCentroCusto} onValueChange={setFormCentroCusto}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {centrosCusto.map(cc => (
                          <SelectItem key={cc.id} value={cc.nome}>{cc.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Banco</label>
                    <Select value={formBanco} onValueChange={setFormBanco}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {bancos.map(banco => (
                          <SelectItem key={banco.id} value={banco.id}>{banco.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Forma de Pagamento</label>
                    <Select value={formFormaPagamento} onValueChange={setFormFormaPagamento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Número de Parcelas</label>
                    <Input type="number" min="1" value={formParcelas} onChange={(e) => setFormParcelas(parseInt(e.target.value) || 1)} />
                  </div>
                  {formParcelas > 1 && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Tipo de Parcelamento</label>
                        <Select value={formTipoParcelas} onValueChange={(v: 'dias' | 'mes') => setFormTipoParcelas(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mes">Mensal</SelectItem>
                            <SelectItem value="dias">A cada X dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formTipoParcelas === 'mes' && (
                        <div>
                          <label className="text-sm font-medium">Dia Fixo do Mês (opcional)</label>
                          <Input type="number" min="1" max="31" value={formDiaFixo} onChange={(e) => setFormDiaFixo(e.target.value)} placeholder="Ex: 10" />
                        </div>
                      )}
                      {formTipoParcelas === 'dias' && (
                        <div>
                          <label className="text-sm font-medium">Intervalo (dias)</label>
                          <Input type="number" min="1" value={formIntervalo} onChange={(e) => setFormIntervalo(parseInt(e.target.value) || 30)} />
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <label className="text-sm font-medium">Observações</label>
                    <Textarea value={formObservacoes} onChange={(e) => setFormObservacoes(e.target.value)} placeholder="Observações" rows={3} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => { resetForm(); setShowNewMovement(false); }}>Cancelar</Button>
                <Button onClick={handleSaveMovimento}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input placeholder="Buscar movimentações..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={selectedTipo} onValueChange={setSelectedTipo}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="receber">A Receber</SelectItem>
            <SelectItem value="pagar">A Pagar</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="conciliacao">Conciliação</TabsTrigger>
          <TabsTrigger value="nfse">NFS-e</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="movimentacoes" className="mt-6">
          {renderMovimentacoes()}
        </TabsContent>

        <TabsContent value="conciliacao" className="mt-6">
          <Conciliacao />
        </TabsContent>

        <TabsContent value="nfse" className="mt-6">
          <NFSe />
        </TabsContent>
      </Tabs>
    </div>
  );
}
