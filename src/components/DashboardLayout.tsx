import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  Package, Megaphone, BarChart3, Settings, LogOut, Menu, Bell, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Clientes', icon: Users, path: '/dashboard/clientes' },
  { label: 'Agenda', icon: Calendar, path: '/dashboard/agenda' },
  { label: 'Sessões', icon: ClipboardList, path: '/dashboard/sessoes' },
  { label: 'Produtos', icon: Package, path: '/dashboard/produtos' },
  { label: 'Campanhas', icon: Megaphone, path: '/dashboard/campanhas' },
  { label: 'RFM', icon: BarChart3, path: '/dashboard/rfm' },
  { label: 'Configurações', icon: Settings, path: '/dashboard/configuracoes' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { professional, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = professional?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-5 pb-6">
        <Logo />
        <button className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[220px] md:flex-shrink-0 border-r bg-card">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 h-full w-[280px] bg-card shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-foreground sm:block">
                {professional?.name}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={professional?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
