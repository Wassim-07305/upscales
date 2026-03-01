import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] -mx-4 md:-mx-6 -mt-4 md:-mt-6">
      {/* Sidebar skeleton */}
      <div className="w-72 flex-shrink-0 border-r border-border bg-card/50 hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Chat skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
