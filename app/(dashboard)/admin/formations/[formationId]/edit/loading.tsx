export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        <div className="h-8 w-56 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
