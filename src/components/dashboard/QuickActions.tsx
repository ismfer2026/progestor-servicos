import React from 'react';
import { Plus, FileText, Users, MessageSquare, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const actions = [
  {
    title: 'Novo Orçamento',
    description: 'Criar proposta para cliente',
    icon: FileText,
    variant: 'primary' as const,
    href: '/orcamentos/novo'
  },
  {
    title: 'Novo Cliente',
    description: 'Cadastrar contato',
    icon: Users,
    variant: 'default' as const,
    href: '/clientes/novo'
  }
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-start gap-2 text-left"
                onClick={() => {
                  // Navigate to action.href
                  console.log('Navigate to:', action.href);
                }}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-80">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}