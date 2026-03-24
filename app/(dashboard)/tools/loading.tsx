export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-40 bg-muted animate-pulse rounded" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
