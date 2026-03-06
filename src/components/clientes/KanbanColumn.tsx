import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { ClientRecord } from '@/types/client';

interface Props {
  id: string;
  label: string;
  color: string;
  clients: ClientRecord[];
  onClientClick: (client: ClientRecord) => void;
}

export function KanbanColumn({ id, label, color, clients, onClientClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[260px] w-[280px] rounded-xl transition-colors ${
        isOver ? 'bg-primary/5' : 'bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-2 p-3 pb-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {clients.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2 max-h-[calc(100vh-320px)]">
        <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {clients.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhum cliente aqui</p>
          ) : (
            clients.map(c => (
              <KanbanCard key={c.id} client={c} onClick={() => onClientClick(c)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
