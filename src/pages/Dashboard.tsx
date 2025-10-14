import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Users
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';


const recentActivities = [
  {
    title: 'Orçamento #1234 enviado',
    description: 'João Silva - Casamento 15/03',
    time: 'há 2 horas',
    type: 'orcamento'
  },
  {
    title: 'Contrato assinado',
    description: 'Maria Santos - Formatura',
    time: 'há 4 horas',
    type: 'contrato'
  },
  {
    title: 'Pagamento recebido',
    description: 'R$ 2.500,00 - Pedro Costa',
    time: 'há 6 horas',
    type: 'pagamento'
  },
  {
    title: 'Nova tarefa criada',
    description: 'Confirmar buffet para evento',
    time: 'há 1 dia',
    type: 'tarefa'
  }
];

const upcomingTasks = [
  {
    title: 'Confirmar local do evento',
    client: 'Ana Oliveira',
    date: 'Hoje, 14:00',
    priority: 'alta'
  },
  {
    title: 'Enviar contrato revisado',
    client: 'Carlos Mendes',
    date: 'Amanhã, 09:00',
    priority: 'média'
  },
  {
    title: 'Reunião de planejamento',
    client: 'Empresa XYZ',
    date: 'Amanhã, 15:30',
    priority: 'alta'
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.empresa_id) {
      loadDashboardData();
    }
  }, [user?.empresa_id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const empresaId = user?.empresa_id;

      // Buscar orçamentos em aberto
      const { data: orcamentosAbertos, error: orcamentosError } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .eq('status', 'Aguardando');

      // Buscar propostas enviadas (status = Aprovado ou Enviado)
      const { data: propostasEnviadas, error: propostasError } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .not('data_envio', 'is', null);

      // Buscar contratos fechados
      const { data: contratosFechados, error: contratosError } = await supabase
        .from('contratos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .eq('status_assinatura', 'Assinado');

      // Buscar faturamento anual (receitas)
      const anoAtual = new Date().getFullYear();
      const { data: faturamentoAnual, error: fatAnualError } = await supabase
        .from('financeiro_movimentacoes')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'receita')
        .gte('data_vencimento', `${anoAtual}-01-01`)
        .lte('data_vencimento', `${anoAtual}-12-31`);

      // Buscar despesas anuais
      const { data: despesasAnual, error: despAnualError } = await supabase
        .from('financeiro_movimentacoes')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'despesa')
        .gte('data_vencimento', `${anoAtual}-01-01`)
        .lte('data_vencimento', `${anoAtual}-12-31`);

      // Buscar faturamento do mês
      const mesAtual = new Date().getMonth() + 1;
      const { data: faturamentoMes, error: fatMesError } = await supabase
        .from('financeiro_movimentacoes')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'receita')
        .gte('data_vencimento', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)
        .lte('data_vencimento', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-31`);

      // Buscar despesas do mês
      const { data: despesasMes, error: despMesError } = await supabase
        .from('financeiro_movimentacoes')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'despesa')
        .gte('data_vencimento', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)
        .lte('data_vencimento', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-31`);

      // Buscar contratos a executar este mês
      const { data: contratosExecucao, error: execucaoError } = await supabase
        .from('servicos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .gte('data', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)
        .lte('data', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-31`)
        .neq('status', 'Concluído');

      // Calcular totais
      const totalFaturamentoAnual = faturamentoAnual?.reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;
      const totalDespesasAnual = despesasAnual?.reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;
      const totalFaturamentoMes = faturamentoMes?.reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;
      const totalDespesasMes = despesasMes?.reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;

      const kpisData = [
        {
          title: 'Orçamentos em Aberto',
          value: orcamentosAbertos?.length || 0,
          icon: FileText,
          variant: 'primary' as const
        },
        {
          title: 'Propostas Enviadas',
          value: propostasEnviadas?.length || 0,
          icon: Send,
          variant: 'success' as const
        },
        {
          title: 'Contratos Fechados',
          value: contratosFechados?.length || 0,
          icon: CheckCircle,
          variant: 'success' as const
        },
        {
          title: 'Faturamento Anual',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFaturamentoAnual),
          icon: TrendingUp,
          variant: 'primary' as const
        },
        {
          title: 'Despesa Anual',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesasAnual),
          icon: TrendingDown,
          variant: 'warning' as const
        },
        {
          title: 'Faturamento do Mês',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFaturamentoMes),
          icon: DollarSign,
          variant: 'success' as const
        },
        {
          title: 'Despesa do Mês',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesasMes),
          icon: TrendingDown,
          variant: 'warning' as const
        },
        {
          title: 'Contratos a Executar (Mês)',
          value: contratosExecucao?.length || 0,
          icon: Calendar,
          variant: 'primary' as const
        }
      ];

      setKpis(kpisData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tela Principal</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio e atividades recentes
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Dashboard Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="atividades" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="atividades">Atividades</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
            </TabsList>

            <TabsContent value="atividades">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agenda">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Próximos Compromissos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.client}</p>
                          <p className="text-xs text-muted-foreground">{task.date}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'alta' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {task.priority}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tarefas">
              <Card>
                <CardHeader>
                  <CardTitle>Tarefas Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma tarefa pendente para hoje.
                  </p>
                  <Button className="w-full" variant="outline">
                    Ver Todas as Tarefas
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resumo">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Executivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary-light rounded-lg">
                      <p className="text-2xl font-bold text-primary">R$ 125.400</p>
                      <p className="text-xs text-muted-foreground">Faturamento Mensal</p>
                    </div>
                    <div className="text-center p-4 bg-success-light rounded-lg">
                      <p className="text-2xl font-bold text-success">85%</p>
                      <p className="text-xs text-muted-foreground">Meta do Mês</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Novos clientes este mês</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Contratos renovados</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ticket médio</span>
                      <span className="font-medium">R$ 3.850</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}