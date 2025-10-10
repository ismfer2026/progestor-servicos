import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
}

export default function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFase, setSelectedFase] = useState<string>('all');
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    loadClientes();
  }, [user]);

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

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.documento?.includes(searchTerm);
    
    const matchesFase = selectedFase === 'all' || cliente.fase_crm === selectedFase;
    
    return matchesSearch && matchesFase;
  });

  const getFaseColor = (fase: string) => {
    switch (fase) {
      case 'Prospecção': return 'bg-blue-500';
      case 'Qualificação': return 'bg-yellow-500';
      case 'Proposta': return 'bg-purple-500';
      case 'Negociação': return 'bg-orange-500';
      case 'Fechamento': return 'bg-green-500';
      case 'Cliente': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const openWhatsApp = (cliente: any) => {
    setSelectedCliente(cliente);
    setShowWhatsApp(true);
  };

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="flex space-x-2">
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Fase CRM</TableHead>
              <TableHead>Valor Estimado</TableHead>
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
                    className={`${getFaseColor(cliente.fase_crm)} text-white`}
                  >
                    {cliente.fase_crm}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(cliente.valor_estimado)}</TableCell>
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
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {cliente.telefones?.[0] && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openWhatsApp(cliente)}
                      >
                        <Phone className="h-4 w-4" />
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
                className={`${getFaseColor(cliente.fase_crm)} text-white text-xs`}
              >
                {cliente.fase_crm}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
              {cliente.valor_estimado && (
                <div className="flex items-center text-sm font-medium">
                  Valor estimado: {formatCurrency(cliente.valor_estimado)}
                </div>
              )}
              {cliente.tags && cliente.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cliente.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
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
                {cliente.telefones?.[0] && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openWhatsApp(cliente)}
                  >
                    <Phone className="h-4 w-4" />
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input placeholder="Nome completo" />
                </div>
                <div>
                  <label className="text-sm font-medium">Documento</label>
                  <Input placeholder="CPF ou CNPJ" />
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input type="email" placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Fase CRM</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospecção">Prospecção</SelectItem>
                      <SelectItem value="Qualificação">Qualificação</SelectItem>
                      <SelectItem value="Proposta">Proposta</SelectItem>
                      <SelectItem value="Negociação">Negociação</SelectItem>
                      <SelectItem value="Fechamento">Fechamento</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Estimado</label>
                  <Input type="number" placeholder="R$ 0,00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <Input placeholder="Separadas por vírgula" />
                </div>
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea placeholder="Observações sobre o cliente" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowNewClient(false)}>
                Cancelar
              </Button>
              <Button>Salvar Cliente</Button>
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
            <SelectItem value="Prospecção">Prospecção</SelectItem>
            <SelectItem value="Qualificação">Qualificação</SelectItem>
            <SelectItem value="Proposta">Proposta</SelectItem>
            <SelectItem value="Negociação">Negociação</SelectItem>
            <SelectItem value="Fechamento">Fechamento</SelectItem>
            <SelectItem value="Cliente">Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {viewMode === 'table' ? renderTableView() : renderCardsView()}

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
                    <h4 className="font-semibold">Dados Pessoais</h4>
                    <p><strong>Nome:</strong> {selectedClient.nome}</p>
                    {selectedClient.documento && (
                      <p><strong>Documento:</strong> {selectedClient.documento}</p>
                    )}
                    {selectedClient.email && (
                      <p><strong>E-mail:</strong> {selectedClient.email}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">Informações Comerciais</h4>
                    <p><strong>Fase CRM:</strong> {selectedClient.fase_crm}</p>
                    {selectedClient.valor_estimado && (
                      <p><strong>Valor Estimado:</strong> {formatCurrency(selectedClient.valor_estimado)}</p>
                    )}
                    <p><strong>Cadastro:</strong> {new Date(selectedClient.data_cadastro).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="history">
                <div className="text-center py-8 text-muted-foreground">
                  Histórico de interações em desenvolvimento
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="text-center py-8 text-muted-foreground">
                  Gestão de documentos em desenvolvimento
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