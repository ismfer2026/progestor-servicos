import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOURNEY_STAGES, type JourneyStage } from '@/types/client';
import { Search } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  stage: JourneyStage | 'todos';
  onStageChange: (v: JourneyStage | 'todos') => void;
}

export function ClienteFilters({ search, onSearchChange, stage, onStageChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Buscar por nome ou WhatsApp..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={stage} onValueChange={(v) => onStageChange(v as JourneyStage | 'todos')}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estágio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os estágios</SelectItem>
          {JOURNEY_STAGES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
