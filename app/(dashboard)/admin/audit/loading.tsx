export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
