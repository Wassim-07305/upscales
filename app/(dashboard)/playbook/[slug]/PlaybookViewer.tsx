"use client";

import { useState } from "react";
import {
  BookOpen,
  FileText,
  ExternalLink,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type {
  Playbook,
  PlaybookSection,
  PlaybookPage,
  SOPExternalLink,
} from "@/lib/types/database";

type SectionWithPages = PlaybookSection & { playbook_pages: PlaybookPage[] };

interface PlaybookViewerProps {
  playbook: Playbook;
  sections: SectionWithPages[];
}

function SidebarNav({
  sections,
  selectedPageId,
  onSelect,
}: {
  sections: SectionWithPages[];
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
}) {
  return (
    <nav className="space-y-4">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {section.title}
          </h3>
          <div className="space-y-0.5">
            {section.playbook_pages.map((page) => {
              return (
                <button
                  key={page.id}
                  onClick={() => onSelect(page.id)}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selectedPageId === page.id
                      ? "bg-neon/10 text-neon font-medium"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{page.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function PlaybookViewer({ playbook, sections }: PlaybookViewerProps) {
  // Flatten all pages to find the first one
  const allPages = sections.flatMap((s) => s.playbook_pages);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    allPages[0]?.id || null
  );

  const selectedPage = allPages.find((p) => p.id === selectedPageId);
  const links = selectedPage
    ? ((selectedPage.external_links || []) as SOPExternalLink[])
    : [];

  if (allPages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{playbook.title}</h1>
          {playbook.description && (
            <p className="text-muted-foreground">{playbook.description}</p>
          )}
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Playbook en cours de rédaction</h3>
            <p className="text-sm text-muted-foreground">Le contenu sera bientôt disponible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-neon" />
        <div>
          <h1 className="text-2xl font-bold">{playbook.title}</h1>
          {playbook.description && (
            <p className="text-sm text-muted-foreground">{playbook.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0 sticky top-20 self-start">
          <SidebarNav
            sections={sections}
            selectedPageId={selectedPageId}
            onSelect={setSelectedPageId}
          />
        </aside>

        {/* Mobile sidebar */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="mb-4">
                <Menu className="h-4 w-4 mr-2" />
                Navigation
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 pt-10">
              <SidebarNav
                sections={sections}
                selectedPageId={selectedPageId}
                onSelect={setSelectedPageId}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {selectedPage ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neon" />
                  <CardTitle>{selectedPage.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {selectedPage.content ? (
                  <div
                    className="prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPage.content }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Aucun contenu pour cette page.
                  </p>
                )}

                {links.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3">Liens & outils</h4>
                    <div className="space-y-2">
                      {links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-neon hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Sélectionnez une page dans la navigation.</p>
          )}

          {/* Page navigation */}
          <div className="flex justify-between mt-4">
            {(() => {
              const currentIdx = allPages.findIndex((p) => p.id === selectedPageId);
              const prev = currentIdx > 0 ? allPages[currentIdx - 1] : null;
              const next = currentIdx < allPages.length - 1 ? allPages[currentIdx + 1] : null;
              return (
                <>
                  {prev ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPageId(prev.id)}
                      className="text-muted-foreground hover:text-white"
                    >
                      ← {prev.title}
                    </Button>
                  ) : (
                    <div />
                  )}
                  {next ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPageId(next.id)}
                      className="text-muted-foreground hover:text-white"
                    >
                      {next.title} →
                    </Button>
                  ) : (
                    <div />
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
