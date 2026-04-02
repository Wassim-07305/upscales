"use client";

import { useAuth } from "@/hooks/use-auth";
import CloserCallsPage from "@/app/_shared-pages/closer-calls/page";

export default function ClientCloserCallsPage() {
  const { user } = useAuth();
  return <CloserCallsPage clientId={user?.id} />;
}
