import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, FileText, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Servico {
  id: string;
  nome: string;
  cliente_id?: string | null;
  data?: string | null;
  periodo?: string | null;
  horario_ini?: string | null;
  horario_fim?: string | null;
  local?: string | null;
  responsavel_id?: string | null;
  status?: string | null;
  valor_total?: number | null;
  observacoes?: string | null;
  clientes?: {
    nome: string;
  } | null;
  usuarios?: {
    nome: string;
  } | null;
}

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const { user } = useAuth();

  useEffect(() => {
    fetchServicos();
  }, [user]);

  const fetchServicos = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('servicos')
        .select(`
          *,
          clientes!left (nome),
          usuarios!left (nome)
        `)
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching servicos:', error);
        toast.error('Erro ao carregar serviços');
      } else {
        setServicos((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Aberto': { variant: 'secondary' as const, label: 'Aberto' },
      'Confirmado': { variant: 'default' as const, label: 'Confirmado' },
      'Em andamento': { variant: 'default' as const, label: 'Em andamento' },
      'Concluído': { variant: 'default' as const, label: 'Concluído' },
      'Cancelado': { variant: 'destructive' as const, label: 'Cancelado' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Aberto'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const filteredServicos = servicos.filter(servico => {
    const matchesSearch = servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servico.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servico.local?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || servico.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">Gerencie todos os serviços da empresa</p>
        </div>
        <Link to="/servicos/novo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Serviço
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Serviços</p>
                <p className="text-2xl font-bold text-foreground">{servicos.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-foreground">
                  {servicos.filter(s => s.status === 'Em andamento').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-foreground">
                  {servicos.filter(s => s.status === 'Concluído').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(servicos.reduce((sum, s) => sum + (s.valor_total || 0), 0))}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cliente ou local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Aberto">Aberto</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{servico.nome}</p>
                      <p className="text-sm text-muted-foreground">#{servico.id.slice(0, 8)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {servico.clientes?.nome?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{servico.clientes?.nome || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(servico.data)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="capitalize">{servico.periodo || '-'}</p>
                      {servico.horario_ini && servico.horario_fim && (
                        <p className="text-sm text-muted-foreground">
                          {formatTime(servico.horario_ini)} - {formatTime(servico.horario_fim)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-32 truncate">
                    {servico.local || '-'}
                  </TableCell>
                  <TableCell>{servico.usuarios?.nome || '-'}</TableCell>
                  <TableCell>{getStatusBadge(servico.status || 'Aberto')}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(servico.valor_total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link to={`/servicos/${servico.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={`/servicos/${servico.id}/editar`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredServicos.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum serviço encontrado
              </p>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro serviço'
                }
              </p>
              {!searchTerm && statusFilter === 'todos' && (
                <Link to="/servicos/novo">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Serviço
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}