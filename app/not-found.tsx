import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <p className="text-[120px] font-display font-bold leading-none text-primary/10">
            404
          </p>
          <p className="absolute inset-0 flex items-center justify-center text-4xl font-display font-bold text-primary">
            404
          </p>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Page introuvable</h1>
          <p className="text-muted-foreground text-sm">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/formations">
            <Button size="sm">
              Voir les formations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
