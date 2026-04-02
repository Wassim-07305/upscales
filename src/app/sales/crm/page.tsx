"use client";

import dynamic from "next/dynamic";

// Reutilise le meme composant CRM que l'admin
const AdminCrmPage = dynamic(() => import("@/app/admin/crm/page"), {
  ssr: false,
});

export default function SalesCrmPage() {
  return <AdminCrmPage />;
}
