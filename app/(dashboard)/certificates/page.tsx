import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import Link from "next/link";

export default async function CertificatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: certificates } = await supabase
    .from("certificates")
    .select("*, formation:formations(title, thumbnail_url)")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes certificats</h1>
        <p className="text-muted-foreground">Vos certifications obtenues</p>
      </div>

      {!certificates || certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucun certificat pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Terminez une formation pour obtenir votre certificat
            </p>
            <Link href="/formations">
              <Button variant="outline" className="mt-4">
                Voir les formations
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{(cert.formation as any)?.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(cert.issued_at)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {cert.certificate_number}
                      </Badge>
                    </div>
                  </div>
                  <Link href={`/api/certificates/${cert.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
