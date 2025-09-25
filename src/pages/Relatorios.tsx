import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Package, FileText, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { addDays } from 'date-fns';

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
  const [selectedPeriodo, setSelectedPeriodo] = useState('30dias');
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 30)
  });

  const handleGerarRelatorio = (categoria: string, relatorio: string, formato: string) => {
    // Aqui seria implementada a lógica para gerar o relatório
    console.log(`Gerando relatório: ${categoria} - ${relatorio} em formato ${formato}`);
    // Por enquanto, apenas mostra uma mensagem
    alert(`Gerando relatório: ${relatorio} em formato ${formato}`);
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
                <DatePickerWithRange
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