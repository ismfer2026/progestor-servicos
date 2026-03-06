import { JOURNEY_STAGES, type JourneyStage } from '@/types/client';
import { Check } from 'lucide-react';

interface Props {
  currentStage: JourneyStage;
  onSelect: (stage: JourneyStage) => void;
}

export function StageSelector({ currentStage, onSelect }: Props) {
  const currentIdx = JOURNEY_STAGES.findIndex(s => s.value === currentStage);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {JOURNEY_STAGES.map((stage, i) => {
        const isCurrent = stage.value === currentStage;
        const isPast = i < currentIdx;
        const isFuture = i > currentIdx;

        return (
          <button
            key={stage.value}
            onClick={() => onSelect(stage.value)}
            className="flex flex-col items-center gap-1 min-w-[80px] px-2 py-1.5 rounded-lg transition-colors hover:bg-muted"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                backgroundColor: isCurrent ? stage.color : isPast ? '#10B981' : 'hsl(var(--muted))',
                color: isCurrent || isPast ? '#fff' : 'hsl(var(--muted-foreground))',
              }}
            >
              {isPast ? <Check size={14} /> : i + 1}
            </div>
            <span
              className="text-[10px] font-medium text-center leading-tight"
              style={{ color: isCurrent ? stage.color : isFuture ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}
            >
              {stage.label}
            </span>
            {i < JOURNEY_STAGES.length - 1 && (
              <div className="absolute" />
            )}
          </button>
        );
      })}
    </div>
  );
}
