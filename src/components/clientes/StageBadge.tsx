import { Badge } from '@/components/ui/badge';
import { STAGE_MAP, type JourneyStage } from '@/types/client';

export function StageBadge({ stage }: { stage: JourneyStage }) {
  const s = STAGE_MAP[stage];
  if (!s) return null;
  return (
    <Badge
      className="text-[11px] font-medium border-0"
      style={{ backgroundColor: s.color + '20', color: s.color }}
    >
      {s.label}
    </Badge>
  );
}
