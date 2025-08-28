import React from 'react';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const kpis = [
  {
    title: 'Orçamentos em Aberto',
    value: '24',
    icon: FileText,
    trend: { value: 12, isPositive: true },
    variant: 'primary' as const
  },
  {
    title: 'Propostas Enviadas',
    value: '8',
    subtitle: 'Esta semana',
    icon: Send,
    trend: { value: 25, isPositive: true },
    variant: 'success' as const
  },
  {
    title: 'Contratos Ativos',
    value: '16',
    icon: CheckCircle,
    trend: { value: 8, isPositive: true }
  },
  {
    title: 'Tarefas do Dia',
    value: '5',
    icon: Calendar,
    variant: 'warning' as const
  },
  {
    title: 'Recebimentos (30d)',
    value: 'R$ 45.650',
    icon: DollarSign,
    trend: { value: 15, isPositive: true },
    variant: 'success' as const
  },
  {
    title: 'Taxa de Conversão',
    value: '68%',
    subtitle: 'Últimos 90 dias',
    icon: TrendingUp,
    trend: { value: 5, isPositive: true }
  }
];

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
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