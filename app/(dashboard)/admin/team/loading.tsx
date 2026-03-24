export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-10 w-64 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
