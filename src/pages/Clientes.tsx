import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Phone, Mail, Save, User, Building, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { WhatsAppMessageDialog } from '@/components/shared/WhatsAppMessageDialog';

interface Cliente {
  id: string;
  nome: string;
  documento?: string;
  telefones?: string[];
  email?: string;
  endereco?: any;
  tags?: string[];
  observacoes?: string;
  fase_crm: string;
  valor_estimado?: number;
  data_cadastro: string;
  tipo_pessoa?: string;
  servico_id?: string;
}

interface Servico {
  id: string;
  nome: string;
}

interface FunilEtapa {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

export default function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [etapas, setEtapas] = useState<FunilEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFase, setSelectedFase] = useState<string>('all');
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo_pessoa: 'Física',
    documento: '',
    email: '',
    telefone: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    endereco_cep: '',
    fase_crm: 'Novo Lead',
    servico_id: '',
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    await Promise.all([loadClientes(), loadServicos(), loadEtapas()]);
  };

  const loadClientes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('data_cadastro', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const loadServicos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome')
        .eq('empresa_id', user.empresa_id)
        .is('cliente_id', null)
        .eq('status', 'Ativo')
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Error loading servicos:', error);
    }
  };

  const loadEtapas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setEtapas(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, fase_crm: data[0].nome }));
      }
    } catch (error) {
      console.error('Error loading etapas:', error);
    }
  };

  const handleOpenNewClient = () => {
    setEditingClient(null);
    setFormData({
      nome: '',
      tipo_pessoa: 'Física',
      documento: '',
      email: '',
      telefone: '',
      endereco_rua: '',
      endereco_numero: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_estado: '',
      endereco_cep: '',
      fase_crm: etapas[0]?.nome || 'Novo Lead',
      servico_id: '',
      observacoes: ''
    });
    setShowNewClient(true);
  };

  const handleEditClient = (cliente: Cliente) => {
    setEditingClient(cliente);
    const endereco = cliente.endereco || {};
    setFormData({
      nome: cliente.nome,
      tipo_pessoa: cliente.tipo_pessoa || 'Física',
      documento: cliente.documento || '',
      email: cliente.email || '',
      telefone: cliente.telefones?.[0] || '',
      endereco_rua: endereco.rua || '',
      endereco_numero: endereco.numero || '',
      endereco_bairro: endereco.bairro || '',
      endereco_cidade: endereco.cidade || '',
      endereco_estado: endereco.estado || '',
      endereco_cep: endereco.cep || '',
      fase_crm: cliente.fase_crm,
      servico_id: cliente.servico_id || '',
      observacoes: cliente.observacoes || ''
    });
    setShowNewClient(true);
  };

  const handleSaveClient = async () => {
    if (!formData.nome || !user?.empresa_id) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    try {
      const clienteData = {
        nome: formData.nome,
        tipo_pessoa: formData.tipo_pessoa,
        documento: formData.documento || null,
        email: formData.email || null,
        telefones: formData.telefone ? [formData.telefone] : [],
        endereco: {
          rua: formData.endereco_rua,
          numero: formData.endereco_numero,
          bairro: formData.endereco_bairro,
          cidade: formData.endereco_cidade,
          estado: formData.endereco_estado,
          cep: formData.endereco_cep
        },
        fase_crm: formData.fase_crm,
        servico_id: formData.servico_id || null,
        observacoes: formData.observacoes || null,
        empresa_id: user.empresa_id
      };

      let clienteId = editingClient?.id;

      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Create new client
        const { data, error } = await supabase
          .from('clientes')
          .insert([clienteData])
          .select()
          .single();

        if (error) throw error;
        clienteId = data.id;
        
        // Create card in sales funnel
        const etapa = etapas.find(e => e.nome === formData.fase_crm);
        if (etapa) {
          // Get service details if selected
          let valorCard = null;
          let servicosCard = [];
          
          if (formData.servico_id) {
            const servico = servicos.find(s => s.id === formData.servico_id);
            if (servico) {
              // Load full service details including price
              const { data: servicoData } = await supabase
                .from('servicos')
                .select('id, nome, preco_venda')
                .eq('id', formData.servico_id)
                .single();
              
              if (servicoData) {
                valorCard = servicoData.preco_venda || 0;
                servicosCard = [{
                  servico_id: servicoData.id,
                  nome: servicoData.nome,
                  quantidade: 1,
                  valor_unitario: servicoData.preco_venda || 0,
                  valor_total: servicoData.preco_venda || 0
                }];
              }
            }
          }
          
          const { error: cardError } = await supabase.from('funil_cards').insert([{
            empresa_id: user.empresa_id,
            cliente_id: clienteId,
            etapa_id: etapa.id,
            titulo: formData.nome,
            valor: valorCard,
            servicos: servicosCard,
            observacoes: formData.observacoes,
            responsavel_id: user.id,
            ordem: 0
          }]);
          
          if (cardError) {
            console.error('Error creating funnel card:', cardError);
            toast.error('Cliente criado, mas erro ao criar card no funil');
          } else {
            toast.success('Cliente e card no funil criados com sucesso!');
          }
        } else {
          toast.success('Cliente cadastrado com sucesso!');
        }
      }

      setShowNewClient(false);
      loadClientes();
    } catch (error) {
      console.error('Error saving cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.documento?.includes(searchTerm);
    
    const matchesFase = selectedFase === 'all' || cliente.fase_crm === selectedFase;
    
    return matchesSearch && matchesFase;
  });

  const getFaseColor = (fase: string) => {
    const etapa = etapas.find(e => e.nome === fase);
    return etapa?.cor || '#3B82F6';
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const openWhatsApp = (cliente: any) => {
    setSelectedCliente(cliente);
    setShowWhatsApp(true);
  };

  // Statistics
  const totalClientes = clientes.length;
  const clientesFisica = clientes.filter(c => c.tipo_pessoa === 'Física').length;
  const clientesJuridica = clientes.filter(c => c.tipo_pessoa === 'Jurídica').length;

  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Fase CRM</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.map(cliente => (
              <TableRow key={cliente.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {cliente.nome.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{cliente.nome}</p>
                      {cliente.documento && (
                        <p className="text-sm text-muted-foreground">{cliente.documento}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    {cliente.tipo_pessoa === 'Física' ? <User className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                    {cliente.tipo_pessoa || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {cliente.telefones?.[0] && (
                      <div className="flex items-center text-sm">
                        <Phone className="mr-1 h-3 w-3" />
                        {formatPhone(cliente.telefones[0])}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="mr-1 h-3 w-3" />
                        {cliente.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: getFaseColor(cliente.fase_crm), color: 'white' }}
                  >
                    {cliente.fase_crm}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedClient(cliente)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditClient(cliente)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {cliente.telefones?.[0] && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openWhatsApp(cliente)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
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

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredClientes.map(cliente => (
        <Card key={cliente.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {cliente.nome.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{cliente.nome}</CardTitle>
                  {cliente.documento && (
                    <p className="text-sm text-muted-foreground">{cliente.documento}</p>
                  )}
                </div>
              </div>
              <Badge
                variant="secondary"
                style={{ backgroundColor: getFaseColor(cliente.fase_crm), color: 'white' }}
                className="text-xs"
              >
                {cliente.fase_crm}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="gap-1">
                {cliente.tipo_pessoa === 'Física' ? <User className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                {cliente.tipo_pessoa || 'N/A'}
              </Badge>
              {cliente.telefones?.[0] && (
                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatPhone(cliente.telefones[0])}
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  {cliente.email}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-muted-foreground">
                {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
              </span>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedClient(cliente)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditClient(cliente)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {cliente.telefones?.[0] && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openWhatsApp(cliente)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
      {/* Header with Statistics */}
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gerencie sua base de clientes</p>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{totalClientes}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pessoa Física</p>
                <p className="text-2xl font-bold">{clientesFisica}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pessoa Jurídica</p>
                <p className="text-2xl font-bold">{clientesJuridica}</p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={selectedFase} onValueChange={setSelectedFase}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            {etapas.map(etapa => (
              <SelectItem key={etapa.id} value={etapa.nome}>{etapa.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Tabela
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
          <Button onClick={handleOpenNewClient}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? renderTableView() : renderCardsView()}

      {/* New/Edit Client Dialog */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 col-span-2">
              <div>
                <Label>Nome Completo *</Label>
                <Input 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome completo" 
                />
              </div>
            </div>
            
            <div>
              <Label>Tipo de Pessoa *</Label>
              <Select value={formData.tipo_pessoa} onValueChange={(value) => setFormData({...formData, tipo_pessoa: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Física">Pessoa Física</SelectItem>
                  <SelectItem value="Jurídica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{formData.tipo_pessoa === 'Física' ? 'CPF' : 'CNPJ'}</Label>
              <Input 
                value={formData.documento}
                onChange={(e) => setFormData({...formData, documento: e.target.value})}
                placeholder={formData.tipo_pessoa === 'Física' ? 'CPF' : 'CNPJ'} 
              />
            </div>

            <div>
              <Label>E-mail</Label>
              <Input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@exemplo.com" 
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input 
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(11) 99999-9999" 
              />
            </div>

            <div className="col-span-2">
              <Label>Endereço</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input 
                  className="col-span-2"
                  value={formData.endereco_rua}
                  onChange={(e) => setFormData({...formData, endereco_rua: e.target.value})}
                  placeholder="Rua" 
                />
                <Input 
                  value={formData.endereco_numero}
                  onChange={(e) => setFormData({...formData, endereco_numero: e.target.value})}
                  placeholder="Número" 
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input 
                  value={formData.endereco_bairro}
                  onChange={(e) => setFormData({...formData, endereco_bairro: e.target.value})}
                  placeholder="Bairro" 
                />
                <Input 
                  value={formData.endereco_cidade}
                  onChange={(e) => setFormData({...formData, endereco_cidade: e.target.value})}
                  placeholder="Cidade" 
                />
                <Input 
                  value={formData.endereco_estado}
                  onChange={(e) => setFormData({...formData, endereco_estado: e.target.value})}
                  placeholder="Estado" 
                  maxLength={2}
                />
              </div>
              <Input 
                className="mt-2"
                value={formData.endereco_cep}
                onChange={(e) => setFormData({...formData, endereco_cep: e.target.value})}
                placeholder="CEP" 
              />
            </div>

            <div>
              <Label>Fase CRM *</Label>
              <Select value={formData.fase_crm} onValueChange={(value) => setFormData({...formData, fase_crm: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map(etapa => (
                    <SelectItem key={etapa.id} value={etapa.nome}>{etapa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Serviço/Produto de Interesse</Label>
              <Select value={formData.servico_id} onValueChange={(value) => setFormData({...formData, servico_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map(servico => (
                    <SelectItem key={servico.id} value={servico.id}>{servico.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea 
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações sobre o cliente" 
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowNewClient(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveClient}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Dados Pessoais</h4>
                    <p><strong>Nome:</strong> {selectedClient.nome}</p>
                    <p><strong>Tipo:</strong> {selectedClient.tipo_pessoa || 'N/A'}</p>
                    {selectedClient.documento && (
                      <p><strong>Documento:</strong> {selectedClient.documento}</p>
                    )}
                    {selectedClient.email && (
                      <p><strong>E-mail:</strong> {selectedClient.email}</p>
                    )}
                    {selectedClient.telefones?.[0] && (
                      <p><strong>Telefone:</strong> {formatPhone(selectedClient.telefones[0])}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Informações Comerciais</h4>
                    <p><strong>Fase CRM:</strong> {selectedClient.fase_crm}</p>
                    <p><strong>Cadastro:</strong> {new Date(selectedClient.data_cadastro).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {selectedClient.endereco && (
                  <div>
                    <h4 className="font-semibold mb-2">Endereço</h4>
                    <p>
                      {selectedClient.endereco.rua && `${selectedClient.endereco.rua}, `}
                      {selectedClient.endereco.numero && `${selectedClient.endereco.numero} - `}
                      {selectedClient.endereco.bairro && `${selectedClient.endereco.bairro}, `}
                      {selectedClient.endereco.cidade && `${selectedClient.endereco.cidade}`}
                      {selectedClient.endereco.estado && `/${selectedClient.endereco.estado}`}
                      {selectedClient.endereco.cep && ` - CEP: ${selectedClient.endereco.cep}`}
                    </p>
                  </div>
                )}
                {selectedClient.observacoes && (
                  <div>
                    <h4 className="font-semibold mb-2">Observações</h4>
                    <p className="text-muted-foreground">{selectedClient.observacoes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history">
                <div className="space-y-4">
                  <h4 className="font-semibold">Histórico de Interações</h4>
                  <p className="text-muted-foreground">Em desenvolvimento...</p>
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="space-y-4">
                  <h4 className="font-semibold">Documentos</h4>
                  <p className="text-muted-foreground">Em desenvolvimento...</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <WhatsAppMessageDialog
        open={showWhatsApp}
        onOpenChange={setShowWhatsApp}
        recipientPhone={selectedCliente?.telefones?.[0]}
        defaultMessage={`Olá ${selectedCliente?.nome || ''}!`}
        context="cliente"
      />
    </div>
  );
}
