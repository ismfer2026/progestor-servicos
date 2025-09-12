import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Users, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

interface Usuario {
  id: string;
  nome: string;
  funcao?: string;
}

interface ItemServico {
  id?: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  valor_total: number;
}

interface ServicoFormData {
  nome: string;
  cliente_id: string;
  data: string;
  periodo: string;
  horario_ini: string;
  horario_fim: string;
  local: string;
  responsavel_id: string;
  observacoes: string;
  itens: ItemServico[];
}

export function NovoServico() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  const [formData, setFormData] = useState<ServicoFormData>({
    nome: '',
    cliente_id: '',
    data: '',
    periodo: 'manha',
    horario_ini: '',
    horario_fim: '',
    local: '',
    responsavel_id: '',
    observacoes: '',
    itens: []
  });

  useEffect(() => {
    fetchClientes();
    fetchUsuarios();
  }, [user]);

  const fetchClientes = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone')
        .eq('empresa_id', user.empresa_id)
        .order('nome');

      if (error) {
        console.error('Error fetching clientes:', error);
      } else {
        setClientes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUsuarios = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, funcao')
        .eq('empresa_id', user.empresa_id)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Error fetching usuarios:', error);
      } else {
        setUsuarios(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleInputChange = (field: keyof ServicoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: ItemServico = {
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0,
      valor_total: 0
    };
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, newItem]
    }));
  };

  const updateItem = (index: number, field: keyof ItemServico, value: string | number) => {
    const updatedItens = [...formData.itens];
    updatedItens[index] = { 
      ...updatedItens[index], 
      [field]: value 
    };

    // Recalcular valor total do item
    if (field === 'quantidade' || field === 'valor_unitario' || field === 'desconto') {
      const item = updatedItens[index];
      const subtotal = item.quantidade * item.valor_unitario;
      const desconto = (subtotal * item.desconto) / 100;
      updatedItens[index].valor_total = subtotal - desconto;
    }

    setFormData(prev => ({ ...prev, itens: updatedItens }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const getValorTotalServico = () => {
    return formData.itens.reduce((total, item) => total + item.valor_total, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!user?.empresa_id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!formData.nome || !formData.cliente_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Primeiro, salvar o serviço
      const servicoData = {
        nome: formData.nome,
        cliente_id: formData.cliente_id,
        data: formData.data || null,
        periodo: formData.periodo,
        horario_ini: formData.horario_ini || null,
        horario_fim: formData.horario_fim || null,
        local: formData.local || null,
        responsavel_id: formData.responsavel_id || null,
        observacoes: formData.observacoes || null,
        valor_total: getValorTotalServico(),
        status: 'Aberto',
        empresa_id: user.empresa_id
      };

      const { data: servico, error: servicoError } = await supabase
        .from('servicos')
        .insert([servicoData])
        .select()
        .single();

      if (servicoError) throw servicoError;

      // Em seguida, salvar os itens do serviço
      if (formData.itens.length > 0) {
        const itensData = formData.itens.map(item => ({
          servico_id: servico.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          desconto: item.desconto,
          valor_total: item.valor_total,
          empresa_id: user.empresa_id
        }));

        const { error: itensError } = await supabase
          .from('servico_itens')
          .insert(itensData);

        if (itensError) throw itensError;
      }

      toast.success('Serviço criado com sucesso!');
      navigate('/servicos');
    } catch (error) {
      console.error('Error creating servico:', error);
      toast.error('Erro ao criar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/servicos')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Serviço</h1>
          <p className="text-muted-foreground">Cadastre um novo serviço para execução</p>
        </div>
      </div>

      <Tabs defaultValue="dados-gerais" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
          <TabsTrigger value="itens">Itens do Serviço</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        {/* Dados Gerais */}
        <TabsContent value="dados-gerais">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Serviço *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Instalação de sistema..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Select 
                    value={formData.cliente_id} 
                    onValueChange={(value) => handleInputChange('cliente_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data do Serviço</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => handleInputChange('data', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo">Período</Label>
                  <Select 
                    value={formData.periodo} 
                    onValueChange={(value) => handleInputChange('periodo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noite">Noite</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.periodo === 'personalizado' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="horario_ini">Horário de Início</Label>
                      <Input
                        id="horario_ini"
                        type="time"
                        value={formData.horario_ini}
                        onChange={(e) => handleInputChange('horario_ini', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="horario_fim">Horário de Fim</Label>
                      <Input
                        id="horario_fim"
                        type="time"
                        value={formData.horario_fim}
                        onChange={(e) => handleInputChange('horario_fim', e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="local">Local do Serviço</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => handleInputChange('local', e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Select 
                    value={formData.responsavel_id} 
                    onValueChange={(value) => handleInputChange('responsavel_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.nome} {usuario.funcao && `- ${usuario.funcao}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações gerais do serviço..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Itens do Serviço */}
        <TabsContent value="itens">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Itens do Serviço
              </CardTitle>
              <Button onClick={addItem} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.itens.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                      <Label>Descrição</Label>
                      <Input
                        value={item.descricao}
                        onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                        placeholder="Descrição do item"
                      />
                    </div>
                    
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.quantidade}
                        onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label>Valor Unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label>Desconto (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.desconto}
                        onChange={(e) => updateItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Valor Total</Label>
                        <div className="font-medium text-lg">
                          {formatCurrency(item.valor_total)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {formData.itens.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item adicionado ainda</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}

              {formData.itens.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Valor Total do Serviço:</span>
                    <span className="text-primary">{formatCurrency(getValorTotalServico())}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipe */}
        <TabsContent value="equipe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Equipe do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidade em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá gerenciar a equipe do serviço aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(getValorTotalServico())}
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Entrada</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ 0,00
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Pendente</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(getValorTotalServico())}
                      </p>
                    </div>
                  </Card>
                </div>

                <div className="text-center py-4 text-muted-foreground">
                  <p>Configurações financeiras em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá gerenciar pagamentos e parcelas aqui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/servicos')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar Serviço'}
        </Button>
      </div>
    </div>
  );
}