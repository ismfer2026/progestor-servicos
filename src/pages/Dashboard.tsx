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


export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [agendaServicos, setAgendaServicos] = useState<any[]>([]);
  const [resumoData, setResumoData] = useState<any>({});

  useEffect(() => {
    if (user?.empresa_id) {
      loadDashboardData();
      loadActivities();
      loadTasks();
      loadAgenda();
      loadResumo();
    }
  }, [user?.empresa_id]);

  const loadActivities = async () => {
    try {
      const empresaId = user?.empresa_id;
      const activities: any[] = [];

      // Buscar últimos orçamentos enviados
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .not('data_envio', 'is', null)
        .order('data_envio', { ascending: false })
        .limit(3);

      if (orcamentos && orcamentos.length > 0) {
        const clienteIds = orcamentos.map(o => o.cliente_id).filter(Boolean);
        const { data: clientes } = await supabase
          .from('clientes')
          .select('id, nome')
          .in('id', clienteIds);

        const clientesMap = new Map(clientes?.map(c => [c.id, c.nome]) || []);

        orcamentos.forEach((orc) => {
          activities.push({
            title: `Orçamento enviado`,
            description: `${orc.cliente_id ? (clientesMap.get(orc.cliente_id) || 'Cliente') : 'Cliente'} - R$ ${orc.valor_total}`,
            time: new Date(orc.data_envio).toLocaleDateString(),
            type: 'orcamento'
          });
        });
      }

      // Buscar últimos contratos
      const { data: contratos } = await supabase
        .from('contratos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_inicio', { ascending: false })
        .limit(2);

      if (contratos && contratos.length > 0) {
        const clienteIds = contratos.map(c => c.cliente_id).filter(Boolean);
        const { data: clientes } = await supabase
          .from('clientes')
          .select('id, nome')
          .in('id', clienteIds);

        const clientesMap = new Map(clientes?.map(c => [c.id, c.nome]) || []);

        contratos.forEach((cont) => {
          activities.push({
            title: 'Contrato criado',
            description: `${cont.cliente_id ? (clientesMap.get(cont.cliente_id) || 'Cliente') : 'Cliente'} - ${cont.titulo || 'Sem título'}`,
            time: new Date(cont.data_inicio).toLocaleDateString(),
            type: 'contrato'
          });
        });
      }

      // Buscar últimas movimentações financeiras
      const { data: pagamentos } = await supabase
        .from('financeiro_movimentacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'receita')
        .not('data_pagamento', 'is', null)
        .order('data_pagamento', { ascending: false })
        .limit(2);

      pagamentos?.forEach((pag) => {
        activities.push({
          title: 'Pagamento recebido',
          description: `R$ ${pag.valor} - ${pag.descricao}`,
          time: new Date(pag.data_pagamento).toLocaleDateString(),
          type: 'pagamento'
        });
      });

      setRecentActivities(activities.slice(0, 6));
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const empresaId = user?.empresa_id;
      
      const { data: tarefas } = await supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'pendente')
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(5);

      if (tarefas && tarefas.length > 0) {
        // Buscar nomes dos clientes separadamente
        const clienteIds = tarefas.map(t => t.cliente_id).filter(Boolean);
        const { data: clientes } = await supabase
          .from('clientes')
          .select('id, nome')
          .in('id', clienteIds);

        const clientesMap = new Map(clientes?.map(c => [c.id, c.nome]) || []);

        const tasksFormatted = tarefas.map((tarefa) => ({
          title: tarefa.titulo,
          client: tarefa.cliente_id ? (clientesMap.get(tarefa.cliente_id) || 'Sem cliente') : 'Sem cliente',
          date: new Date(tarefa.data_hora).toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          priority: tarefa.prioridade || 'média'
        }));

        setUpcomingTasks(tasksFormatted);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const loadAgenda = async () => {
    try {
      const empresaId = user?.empresa_id;
      
      const { data: agenda } = await supabase
        .from('agenda_servicos')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(5);

      if (agenda && agenda.length > 0) {
        // Buscar nomes dos clientes separadamente
        const clienteIds = agenda.map(a => a.cliente_id).filter(Boolean);
        const { data: clientes } = await supabase
          .from('clientes')
          .select('id, nome')
          .in('id', clienteIds);

        const clientesMap = new Map(clientes?.map(c => [c.id, c.nome]) || []);

        const agendaFormatted = agenda.map((item) => ({
          title: item.servico || 'Serviço',
          client: item.cliente_id ? (clientesMap.get(item.cliente_id) || 'Sem cliente') : 'Sem cliente',
          date: new Date(item.data_hora).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          observacao: item.observacao
        }));

        setAgendaServicos(agendaFormatted);
      }
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    }
  };

  const loadResumo = async () => {
    try {
      const empresaId = user?.empresa_id;
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      // Faturamento mensal
      const { data: faturamentoMes } = await supabase
        .from('financeiro_movimentacoes')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'receita')
        .gte('data_vencimento', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)
        .lte('data_vencimento', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-31`);

      const totalFaturamento = faturamentoMes?.reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;

      // Novos clientes este mês
      const { data: novosClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .gte('data_cadastro', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`);

      // Contratos ativos
      const { data: contratosAtivos } = await supabase
        .from('contratos')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .eq('status_assinatura', 'Assinado');

      // Calcular ticket médio
      const { data: todosOrcamentos } = await supabase
        .from('orcamentos')
        .select('valor_total')
        .eq('empresa_id', empresaId)
        .not('valor_total', 'is', null);

      const ticketMedio = todosOrcamentos?.length 
        ? todosOrcamentos.reduce((sum, orc) => sum + Number(orc.valor_total || 0), 0) / todosOrcamentos.length 
        : 0;

      setResumoData({
        faturamentoMensal: totalFaturamento,
        metaMes: totalFaturamento > 0 ? Math.min((totalFaturamento / 150000) * 100, 100).toFixed(0) : 0,
        novosClientes: novosClientes?.length || 0,
        contratosRenovados: contratosAtivos?.length || 0,
        ticketMedio: ticketMedio
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

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
                  {recentActivities.length > 0 ? (
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
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma atividade recente registrada.
                    </p>
                  )}
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
                  {agendaServicos.length > 0 ? (
                    <div className="space-y-4">
                      {agendaServicos.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.client}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                            {item.observacao && (
                              <p className="text-xs text-muted-foreground italic">{item.observacao}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum compromisso agendado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tarefas">
              <Card>
                <CardHeader>
                  <CardTitle>Tarefas Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingTasks.length > 0 ? (
                    <div className="space-y-3">
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
                              : task.priority === 'média'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {task.priority}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma tarefa pendente.
                    </p>
                  )}
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
                      <p className="text-2xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumoData.faturamentoMensal || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Faturamento Mensal</p>
                    </div>
                    <div className="text-center p-4 bg-success-light rounded-lg">
                      <p className="text-2xl font-bold text-success">{resumoData.metaMes || 0}%</p>
                      <p className="text-xs text-muted-foreground">Meta do Mês</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Novos clientes este mês</span>
                      <span className="font-medium">{resumoData.novosClientes || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Contratos ativos</span>
                      <span className="font-medium">{resumoData.contratosRenovados || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ticket médio</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumoData.ticketMedio || 0)}
                      </span>
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