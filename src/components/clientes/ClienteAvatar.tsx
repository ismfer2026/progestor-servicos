import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getInitialColor } from '@/lib/formatters';

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'h-9 w-9 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-[72px] w-[72px] text-xl' };

export function ClienteAvatar({ name, avatarUrl, size = 'md' }: Props) {
  const color = getInitialColor(name);
  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={avatarUrl || undefined} />
      <AvatarFallback style={{ backgroundColor: color, color: '#fff' }} className="font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
