import { ClienteAvatar } from './ClienteAvatar';
import { StageBadge } from './StageBadge';
import { formatLastContact, whatsappLink } from '@/lib/formatters';
import type { ClientRecord } from '@/types/client';
import { MessageCircle } from 'lucide-react';

interface Props {
  client: ClientRecord;
  selected: boolean;
  onClick: () => void;
}

export function ClienteListCard({ client, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
        selected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'
      }`}
    >
      <ClienteAvatar name={client.name} avatarUrl={client.avatar_url} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StageBadge stage={client.journey_stage} />
          <span className="text-[11px] text-muted-foreground">{formatLastContact(client.last_contact_at)}</span>
        </div>
      </div>
      {client.phone_whatsapp && (
        <a
          href={whatsappLink(client.phone_whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-green-600 hover:text-green-700 shrink-0"
        >
          <MessageCircle size={16} />
        </a>
      )}
    </button>
  );
}
