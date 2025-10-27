import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  Settings, 
  Home,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ChevronDown,
  RefreshCw,
  FileCheck,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Tela Principal', href: '/dashboard', icon: Home },
  { name: 'Orçamentos', href: '/orcamentos', icon: FileText },
  { name: 'Serviços/Produtos', href: '/servicos', icon: Wrench },
  { name: 'Funil de Vendas', href: '/funil', icon: TrendingUp },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Estoque', href: '/estoque', icon: Package },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Contratos', href: '/contratos', icon: FileText },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
  { name: 'ADM', href: '/adm', icon: Shield, adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.id === user?.empresa_id;

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={cn(
      "relative bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-sidebar-foreground">Synca Gestão</h1>
              <p className="text-xs text-muted-foreground">Gestão Completa</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          // Ocultar item ADM se não for admin
          if (item.adminOnly && !isAdmin) return null;
          
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                active 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                active && "scale-110"
              )} />
              {!collapsed && (
                <span className="animate-fade-in">{item.name}</span>
              )}
              {!collapsed && active && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-scale-in" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Toggle button */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}