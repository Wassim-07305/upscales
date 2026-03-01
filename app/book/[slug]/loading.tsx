import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mesh-gradient bg-grid min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo / Header skeleton */}
        <div className="flex flex-col items-center mb-8 space-y-3">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Step indicator skeleton */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-20 hidden sm:block" />
              {i < 2 && <Skeleton className="h-0.5 w-8" />}
            </div>
          ))}
        </div>

        {/* Main card skeleton */}
        <Card className="gradient-border bg-[#141414]">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Form fields skeleton */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
            {/* Button skeleton */}
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
