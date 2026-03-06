import { useState } from 'react';
import { ClienteListCard } from './ClienteListCard';
import { ClienteDetailPanel } from './ClienteDetailPanel';
import { ClienteDrawer } from './ClienteDrawer';
import type { ClientRecord } from '@/types/client';
import { Users } from 'lucide-react';

interface Props {
  clients: ClientRecord[];
}

export function ClientesListView({ clients }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<ClientRecord | null>(null);
  const selected = clients.find(c => c.id === selectedId) || null;

  return (
    <>
      <div className="flex gap-0 h-[calc(100vh-260px)]">
        {/* List */}
        <div className="w-full md:w-[380px] md:min-w-[380px] border-r overflow-y-auto space-y-1 p-2">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Users className="text-muted-foreground mb-3" size={48} />
              <p className="text-sm text-muted-foreground">Nenhum cliente ainda.</p>
              <p className="text-xs text-muted-foreground">Cadastre seu primeiro cliente.</p>
            </div>
          ) : (
            clients.map(c => (
              <ClienteListCard
                key={c.id}
                client={c}
                selected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
              />
            ))
          )}
        </div>

        {/* Detail */}
        <div className="hidden md:flex flex-1 overflow-y-auto p-5">
          {selected ? (
            <div className="w-full">
              <ClienteDetailPanel client={selected} onEdit={() => setEditClient(selected)} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full text-center">
              <Users className="text-muted-foreground mb-3" size={48} />
              <p className="text-sm text-muted-foreground">Selecione um cliente</p>
            </div>
          )}
        </div>
      </div>

      <ClienteDrawer open={!!editClient} onClose={() => setEditClient(null)} client={editClient} />
    </>
  );
}
