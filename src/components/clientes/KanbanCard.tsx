import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClienteAvatar } from './ClienteAvatar';
import { formatLastContact, whatsappLink } from '@/lib/formatters';
import type { ClientRecord } from '@/types/client';
import { MessageCircle, GripVertical } from 'lucide-react';

interface Props {
  client: ClientRecord;
  onClick: () => void;
}

export function KanbanCard({ client, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: client.id,
    data: { client },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
          <GripVertical size={14} />
        </div>
        <ClienteAvatar name={client.name} avatarUrl={client.avatar_url} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
          <p className="text-[11px] text-muted-foreground">{formatLastContact(client.last_contact_at)}</p>
          {client.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {client.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        {client.phone_whatsapp && (
          <a
            href={whatsappLink(client.phone_whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-green-600 hover:text-green-700 shrink-0"
          >
            <MessageCircle size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
