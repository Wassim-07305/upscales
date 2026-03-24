export default function Loading() {
  return (
    <div className="flex gap-6">
      <div className="hidden md:block w-64 shrink-0 space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-40 bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
