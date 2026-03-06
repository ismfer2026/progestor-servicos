import { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { ClienteDetailPanel } from './ClienteDetailPanel';
import { ClienteDrawer } from './ClienteDrawer';
import { useMoveClientStage } from '@/hooks/useClientes';
import { JOURNEY_STAGES, type ClientRecord, type JourneyStage } from '@/types/client';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface Props {
  clients: ClientRecord[];
}

export function ClientesKanbanView({ clients }: Props) {
  const [drawerClient, setDrawerClient] = useState<ClientRecord | null>(null);
  const [editClient, setEditClient] = useState<ClientRecord | null>(null);
  const moveStage = useMoveClientStage();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grouped = JOURNEY_STAGES.reduce((acc, stage) => {
    acc[stage.value] = clients.filter(c => c.journey_stage === stage.value);
    return acc;
  }, {} as Record<JourneyStage, ClientRecord[]>);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const clientId = active.id as string;
    const targetStage = over.id as JourneyStage;

    const client = clients.find(c => c.id === clientId);
    if (client && client.journey_stage !== targetStage && JOURNEY_STAGES.some(s => s.value === targetStage)) {
      moveStage.mutate({ clientId, toStage: targetStage });
    }
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-260px)]">
          {JOURNEY_STAGES.map(stage => (
            <KanbanColumn
              key={stage.value}
              id={stage.value}
              label={stage.label}
              color={stage.color}
              clients={grouped[stage.value] || []}
              onClientClick={setDrawerClient}
            />
          ))}
        </div>
      </DndContext>

      {/* Detail drawer */}
      <Sheet open={!!drawerClient} onOpenChange={(o) => !o && setDrawerClient(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {drawerClient && (
            <ClienteDetailPanel client={drawerClient} onEdit={() => { setEditClient(drawerClient); setDrawerClient(null); }} />
          )}
        </SheetContent>
      </Sheet>

      <ClienteDrawer open={!!editClient} onClose={() => setEditClient(null)} client={editClient} />
    </>
  );
}
