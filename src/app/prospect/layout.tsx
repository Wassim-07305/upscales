"use client";

import { RoleLayout } from "@/components/layout/role-layout";

export default function ProspectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout variant="prospect">{children}</RoleLayout>;
}
