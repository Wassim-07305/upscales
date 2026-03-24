export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-36 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[260px] space-y-3">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded-xl animate-pulse" />
            <div className="h-24 bg-muted rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
