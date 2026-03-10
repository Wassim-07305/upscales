import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-20 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
