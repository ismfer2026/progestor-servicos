import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Package, FileText, Download, Calendar, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { addDays, subDays, startOfYear, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const relatoriosData = [
  {
    categoria: 'Vendas',
    icon: TrendingUp,
    color: 'text-green-600',
    relatorios: [
      { nome: 'Vendas por Período', descricao: 'Análise de vendas em período específico', formato: ['PDF', 'CSV'] },
      { nome: 'Vendas por Cliente', descricao: 'Ranking de clientes por volume de vendas', formato: ['PDF', 'CSV'] },
      { nome: 'Vendas por Serviço', descricao: 'Análise de performance por tipo de serviço', formato: ['PDF', 'CSV'] },
      { nome: 'Comissões', descricao: 'Relatório de comissões por vendedor', formato: ['PDF', 'CSV'] }
    ]
  },
  {
    categoria: 'Funil de Vendas',
    icon: BarChart3,
    color: 'text-blue-600',
    relatorios: [
      { nome: 'Conversão por Etapa', descricao: 'Taxa de conversão entre etapas do funil', formato: ['PDF', 'CSV'] },
      { nome: 'Tempo Médio por Etapa', descricao: 'Análise de tempo gasto em cada etapa', formato: ['PDF', 'CSV'] },
      { nome: 'Oportunidades Perdidas', descricao: 'Análise de oportunidades não convertidas', formato: ['PDF', 'CSV'] },
      { nome: 'Pipeline de Vendas', descricao: 'Visão geral do pipeline atual', formato: ['PDF', 'CSV'] }
    ]
  },
  {
    categoria: 'Orçamentos',
    icon: FileText,
    color: 'text-purple-600',
    relatorios: [
      { nome: 'Orçamentos por Status', descricao: 'Distribuição de orçamentos por status', formato: ['PDF', 'CSV'] },
      { nome: 'Taxa de Aprovação', descricao: 'Análise de taxa de aprovação de orçamentos', formato: ['PDF', 'CSV'] },
      { nome: 'Valor Médio de Orçamentos', descricao: 'Análise de ticket médio dos orçamentos', formato: ['PDF', 'CSV'] },
      { nome: 'Orçamentos Vencidos', descricao: 'Listagem de orçamentos com prazo vencido', formato: ['PDF', 'CSV'] }
    ]
  },
  {
    categoria: 'Financeiro',
    icon: DollarSign,
    color: 'text-emerald-600',
    relatorios: [
      { nome: 'Fluxo de Caixa', descricao: 'Análise detalhada do fluxo de caixa', formato: ['PDF', 'CSV'] },
      { nome: 'Contas a Receber', descricao: 'Relatório de contas pendentes de recebimento', formato: ['PDF', 'CSV'] },
      { nome: 'Contas a Pagar', descricao: 'Relatório de contas pendentes de pagamento', formato: ['PDF', 'CSV'] },
      { nome: 'Inadimplência', descricao: 'Análise de inadimplência por cliente', formato: ['PDF', 'CSV'] },
      { nome: 'DRE Gerencial', descricao: 'Demonstração do Resultado do Exercício', formato: ['PDF', 'CSV'] }
    ]
  },
  {
    categoria: 'Estoque',
    icon: Package,
    color: 'text-orange-600',
    relatorios: [
      { nome: 'Posição de Estoque', descricao: 'Situação atual do estoque por item', formato: ['PDF', 'CSV'] },
      { nome: 'Movimentação de Estoque', descricao: 'Histórico de entradas e saídas', formato: ['PDF', 'CSV'] },
      { nome: 'Itens em Baixo Estoque', descricao: 'Relatório de itens próximos ao estoque mínimo', formato: ['PDF', 'CSV'] },
      { nome: 'Valorização do Estoque', descricao: 'Valor total do estoque atual', formato: ['PDF', 'CSV'] },
      { nome: 'Itens Reservados', descricao: 'Relatório de itens reservados por serviço', formato: ['PDF', 'CSV'] }
    ]
  },
  {
    categoria: 'Equipe',
    icon: Users,
    color: 'text-indigo-600',
    relatorios: [
      { nome: 'Produtividade por Colaborador', descricao: 'Análise de produtividade individual', formato: ['PDF', 'CSV'] },
      { nome: 'Agenda de Equipe', descricao: 'Relatório de agenda consolidada da equipe', formato: ['PDF', 'CSV'] },
      { nome: 'Horas Trabalhadas', descricao: 'Controle de horas por colaborador', formato: ['PDF', 'CSV'] },
      { nome: 'Performance de Vendas', descricao: 'Ranking de vendas por colaborador', formato: ['PDF', 'CSV'] }
    ]
  }
];

export default function Relatorios() {
  const { user } = useAuth();
  const [selectedPeriodo, setSelectedPeriodo] = useState('30dias');
  const [dateRange, setDateRange] = useState<any>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [loading, setLoading] = useState(false);

  const getDateRange = () => {
    let from, to;
    
    switch (selectedPeriodo) {
      case '7dias':
        from = subDays(new Date(), 7);
        to = new Date();
        break;
      case '30dias':
        from = subDays(new Date(), 30);
        to = new Date();
        break;
      case '90dias':
        from = subDays(new Date(), 90);
        to = new Date();
        break;
      case 'ano':
        from = startOfYear(new Date());
        to = new Date();
        break;
      case 'personalizado':
        from = dateRange.from;
        to = dateRange.to;
        break;
      default:
        from = subDays(new Date(), 30);
        to = new Date();
    }
    
    return { from, to };
  };

  const fetchRelatorioData = async (categoria: string, relatorio: string) => {
    const { from, to } = getDateRange();
    const { data: userData } = await supabase.from('usuarios').select('empresa_id').eq('email', user?.email).single();
    
    if (!userData?.empresa_id) {
      toast.error('Empresa não encontrada');
      return null;
    }

    try {
      let query;
      
      // Vendas
      if (categoria === 'Vendas') {
        if (relatorio === 'Vendas por Período') {
          query = supabase
            .from('orcamentos')
            .select('*, clientes(nome)')
            .eq('empresa_id', userData.empresa_id)
            .gte('criado_em', from.toISOString())
            .lte('criado_em', to.toISOString())
            .eq('status', 'Aprovado');
        } else if (relatorio === 'Vendas por Cliente') {
          query = supabase
            .from('orcamentos')
            .select('*, clientes(nome)')
            .eq('empresa_id', userData.empresa_id)
            .eq('status', 'Aprovado');
        } else if (relatorio === 'Vendas por Serviço') {
          query = supabase
            .from('servicos')
            .select('*')
            .eq('empresa_id', userData.empresa_id)
            .gte('created_at', from.toISOString())
            .lte('created_at', to.toISOString());
        }
      }
      
      // Funil de Vendas
      else if (categoria === 'Funil de Vendas') {
        if (relatorio === 'Pipeline de Vendas') {
          query = supabase
            .from('funil_cards')
            .select('*, funil_etapas(nome), clientes(nome)')
            .eq('empresa_id', userData.empresa_id);
        } else if (relatorio === 'Conversão por Etapa') {
          query = supabase
            .from('funil_cards')
            .select('*, funil_etapas(nome)')
            .eq('empresa_id', userData.empresa_id);
        }
      }
      
      // Orçamentos
      else if (categoria === 'Orçamentos') {
        if (relatorio === 'Orçamentos por Status') {
          query = supabase
            .from('orcamentos')
            .select('*, clientes(nome)')
            .eq('empresa_id', userData.empresa_id)
            .gte('criado_em', from.toISOString())
            .lte('criado_em', to.toISOString());
        } else if (relatorio === 'Orçamentos Vencidos') {
          query = supabase
            .from('orcamentos')
            .select('*, clientes(nome)')
            .eq('empresa_id', userData.empresa_id)
            .lt('data_validade', new Date().toISOString())
            .neq('status', 'Aprovado');
        }
      }
      
      // Financeiro
      else if (categoria === 'Financeiro') {
        if (relatorio === 'Fluxo de Caixa') {
          query = supabase
            .from('financeiro_movimentacoes')
            .select('*')
            .eq('empresa_id', userData.empresa_id)
            .gte('data_vencimento', format(from, 'yyyy-MM-dd'))
            .lte('data_vencimento', format(to, 'yyyy-MM-dd'));
        } else if (relatorio === 'Contas a Receber') {
          query = supabase
            .from('financeiro_movimentacoes')
            .select('*, clientes(nome)')
            .eq('empresa_id', userData.empresa_id)
            .eq('tipo', 'receita')
            .eq('status', 'pendente');
        } else if (relatorio === 'Contas a Pagar') {
          query = supabase
            .from('financeiro_movimentacoes')
            .select('*')
            .eq('empresa_id', userData.empresa_id)
            .eq('tipo', 'despesa')
            .eq('status', 'pendente');
        }
      }
      
      // Estoque
      else if (categoria === 'Estoque') {
        if (relatorio === 'Posição de Estoque') {
          query = supabase
            .from('estoque_itens')
            .select('*')
            .eq('empresa_id', userData.empresa_id)
            .eq('status', 'ativo');
        } else if (relatorio === 'Movimentação de Estoque') {
          query = supabase
            .from('estoque_historico')
            .select('*, estoque_itens(nome)')
            .eq('empresa_id', userData.empresa_id)
            .gte('created_at', from.toISOString())
            .lte('created_at', to.toISOString());
        } else if (relatorio === 'Itens em Baixo Estoque') {
          const { data: itens } = await supabase
            .from('estoque_itens')
            .select('*')
            .eq('empresa_id', userData.empresa_id)
            .eq('status', 'ativo');
          
          return itens?.filter(item => Number(item.saldo) <= Number(item.saldo_minimo));
        } else if (relatorio === 'Itens Reservados') {
          query = supabase
            .from('estoque_reservas')
            .select('*, estoque_itens(nome)')
            .eq('empresa_id', userData.empresa_id)
            .eq('status', 'reservado');
        }
      }
      
      // Equipe
      else if (categoria === 'Equipe') {
        if (relatorio === 'Produtividade por Colaborador') {
          query = supabase
            .from('colaboradores')
            .select('*')
            .eq('empresa_id', userData.empresa_id)
            .eq('ativo', true);
        } else if (relatorio === 'Agenda de Equipe') {
          query = supabase
            .from('agenda_servicos')
            .select('*, usuarios(nome), clientes(nome)')
            .eq('empresa_id', userData.empresa_id)
            .gte('data_hora', from.toISOString())
            .lte('data_hora', to.toISOString());
        }
      }
      
      if (!query) {
        toast.info('Relatório em desenvolvimento');
        return null;
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao buscar dados do relatório');
      return null;
    }
  };

  const generatePDF = (categoria: string, relatorio: string, data: any[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    doc.setFontSize(18);
    doc.text(relatorio, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Categoria e período
    doc.setFontSize(10);
    doc.text(`Categoria: ${categoria}`, 20, yPos);
    yPos += 6;
    const { from, to } = getDateRange();
    doc.text(`Período: ${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}`, 20, yPos);
    yPos += 10;

    // Dados
    doc.setFontSize(9);
    
    if (!data || data.length === 0) {
      doc.text('Nenhum dado encontrado para o período selecionado', 20, yPos);
    } else {
      // Header
      const headers = Object.keys(data[0]).filter(key => 
        typeof data[0][key] !== 'object' && key !== 'empresa_id' && key !== 'id'
      );
      
      let xPos = 20;
      doc.setFont(undefined, 'bold');
      headers.forEach((header, index) => {
        if (xPos + 35 > pageWidth - 20) {
          yPos += 6;
          xPos = 20;
        }
        doc.text(header.substring(0, 15), xPos, yPos);
        xPos += 35;
      });
      
      yPos += 6;
      doc.setFont(undefined, 'normal');
      
      // Rows
      data.forEach((row, rowIndex) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        xPos = 20;
        headers.forEach((header) => {
          if (xPos + 35 > pageWidth - 20) {
            yPos += 5;
            xPos = 20;
          }
          const value = row[header];
          const displayValue = value ? String(value).substring(0, 20) : '-';
          doc.text(displayValue, xPos, yPos);
          xPos += 35;
        });
        yPos += 6;
      });
    }

    // Rodapé
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Página ${i} de ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`${relatorio}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const generateCSV = (relatorio: string, data: any[]) => {
    if (!data || data.length === 0) {
      toast.warning('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]).filter(key => 
      typeof data[0][key] !== 'object' && key !== 'empresa_id'
    );
    
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return value ? `"${String(value).replace(/"/g, '""')}"` : '';
      });
      csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${relatorio}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGerarRelatorio = async (categoria: string, relatorio: string, formato: string) => {
    setLoading(true);
    toast.loading('Gerando relatório...');
    
    try {
      const data = await fetchRelatorioData(categoria, relatorio);
      
      if (!data) {
        toast.dismiss();
        setLoading(false);
        return;
      }

      toast.dismiss();
      
      if (formato === 'PDF') {
        generatePDF(categoria, relatorio, data);
        toast.success('PDF gerado com sucesso!');
      } else if (formato === 'CSV') {
        generateCSV(relatorio, data);
        toast.success('CSV gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const renderRelatorioCard = (categoria: any) => {
    const Icon = categoria.icon;
    
    return (
      <Card key={categoria.categoria} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon className={`mr-2 h-5 w-5 ${categoria.color}`} />
            {categoria.categoria}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoria.relatorios.map((relatorio: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{relatorio.nome}</h4>
                  <div className="flex space-x-1">
                    {relatorio.formato.map((formato: string) => (
                      <Badge key={formato} variant="outline" className="text-xs">
                        {formato}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {relatorio.descricao}
                </p>
                <div className="flex space-x-2">
                  {relatorio.formato.map((formato: string) => (
                    <Button
                      key={formato}
                      size="sm"
                      variant="outline"
                      onClick={() => handleGerarRelatorio(categoria.categoria, relatorio.nome, formato)}
                      disabled={loading}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      {formato}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Gere relatórios detalhados do seu negócio</p>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Configurações Globais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Período Padrão</label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                  <SelectItem value="ano">Este ano</SelectItem>
                  <SelectItem value="personalizado">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriodo === 'personalizado' && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Período Personalizado</label>
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Lista de Relatórios por Categoria */}
      <div className="space-y-6">
        {relatoriosData.map(renderRelatorioCard)}
      </div>

      {/* Relatórios Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Relatórios Personalizados</h3>
            <p className="text-muted-foreground mb-4">
              Crie relatórios personalizados combinando diferentes métricas e filtros
            </p>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Criar Relatório Personalizado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Agendados */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Agendados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Automação de Relatórios</h3>
            <p className="text-muted-foreground mb-4">
              Configure relatórios para serem gerados e enviados automaticamente
            </p>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}