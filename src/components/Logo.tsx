export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
        <span className="text-lg font-bold text-primary-foreground">ia</span>
      </div>
      <span className="text-xl font-bold text-foreground">
        ia<span className="text-primary">pra</span>faturar
      </span>
    </div>
  );
}
