"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Plus,
  Loader2,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import { formatDate } from "@/lib/utils/dates";
import type { TimeEntry, MeetingNote, MeetingType } from "@/lib/types/database";

const MEETING_TYPES: Record<MeetingType, { label: string; color: string }> = {
  hebdo: { label: "Hebdo", color: "bg-blue-400/20 text-blue-400" },
  mensuel: { label: "Mensuel", color: "bg-purple-400/20 text-purple-400" },
  trimestriel: { label: "Trimestriel", color: "bg-neon/20 text-neon" },
  autre: { label: "Autre", color: "bg-zinc-400/20 text-zinc-400" },
};

interface Member {
  id: string;
  full_name: string;
}

interface TeamClientProps {
  timeEntries: TimeEntry[];
  meetings: MeetingNote[];
  members: Member[];
  userId: string;
}

export function TeamClient({ timeEntries: initialEntries, meetings: initialMeetings, members, userId }: TeamClientProps) {
  const supabase = createClient();

  // ─── Time Entries state ───────────────────────────────────
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryMember, setEntryMember] = useState(userId);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryHours, setEntryHours] = useState("");
  const [entryNotes, setEntryNotes] = useState("");

  // ─── Meeting Notes state ──────────────────────────────────
  const [meetings, setMeetings] = useState<MeetingNote[]>(initialMeetings);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingType, setMeetingType] = useState<MeetingType>("hebdo");
  const [meetingContent, setMeetingContent] = useState("");
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  // ─── Computed ─────────────────────────────────────────────
  const totalHours = useMemo(() => entries.reduce((sum, e) => sum + Number(e.hours), 0), [entries]);

  const memberName = (id: string) => members.find((m) => m.id === id)?.full_name || "—";

  // Group entries by member
  const entriesByMember = useMemo(() => {
    const map: Record<string, { name: string; total: number; entries: TimeEntry[] }> = {};
    entries.forEach((e) => {
      if (!map[e.member_id]) map[e.member_id] = { name: memberName(e.member_id), total: 0, entries: [] };
      map[e.member_id].total += Number(e.hours);
      map[e.member_id].entries.push(e);
    });
    return map;
  }, [entries, members]);

  // ─── Time Entry CRUD ──────────────────────────────────────

  const handleCreateEntry = async () => {
    if (!entryTitle.trim() || !entryHours) return;
    setSavingEntry(true);

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        member_id: entryMember,
        title: entryTitle.trim(),
        entry_date: entryDate,
        hours: parseFloat(entryHours),
        notes: entryNotes || null,
      })
      .select()
      .single();

    if (error) {
      logSupabaseError("create time_entry", error);
      toast.error("Erreur de création");
    } else {
      setEntries((prev) => [data, ...prev]);
      toast.success("Entrée ajoutée");
      setEntryTitle(""); setEntryHours(""); setEntryNotes("");
      setShowAddEntry(false);
    }
    setSavingEntry(false);
  };

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase.from("time_entries").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete time_entry", error);
      toast.error("Erreur");
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Supprimé");
    }
  };

  // ─── Meeting CRUD ─────────────────────────────────────────

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) return;
    setSavingMeeting(true);

    const { data, error } = await supabase
      .from("meeting_notes")
      .insert({
        title: meetingTitle.trim(),
        meeting_date: meetingDate,
        meeting_type: meetingType,
        content: meetingContent || null,
        participants: [],
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      logSupabaseError("create meeting", error);
      toast.error("Erreur de création");
    } else {
      setMeetings((prev) => [data, ...prev]);
      toast.success("Réunion créée");
      setMeetingTitle(""); setMeetingContent("");
      setShowAddMeeting(false);
    }
    setSavingMeeting(false);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Supprimer cette réunion ?")) return;
    const { error } = await supabase.from("meeting_notes").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete meeting", error);
      toast.error("Erreur");
    } else {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      toast.success("Supprimé");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="text-muted-foreground text-sm">Suivi des heures et notes de réunion</p>
      </div>

      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Heures
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Réunions
          </TabsTrigger>
        </TabsList>

        {/* ─── Onglet Heures ─────────────────────────────── */}
        <TabsContent value="hours" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm font-mono">
                Total : {totalHours.toFixed(1)}h
              </Badge>
              <span className="text-xs text-muted-foreground">{entries.length} entrée{entries.length > 1 ? "s" : ""}</span>
            </div>
            <Button onClick={() => setShowAddEntry(true)} size="sm" className="bg-neon text-black hover:bg-neon/90">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des heures
            </Button>
          </div>

          {/* Summary by member */}
          {Object.keys(entriesByMember).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(entriesByMember).map(([memberId, { name, total }]) => (
                <div key={memberId} className="p-3 rounded-lg bg-white/5 border border-border/50">
                  <p className="text-xs text-muted-foreground truncate">{name}</p>
                  <p className="text-lg font-bold font-mono">{total.toFixed(1)}h</p>
                </div>
              ))}
            </div>
          )}

          {/* Entries table */}
          {entries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune entrée d'heures</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Membre</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Titre</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">Heures</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 text-sm text-muted-foreground">{formatDate(entry.entry_date)}</td>
                        <td className="p-3 text-sm">{memberName(entry.member_id)}</td>
                        <td className="p-3 text-sm">{entry.title}</td>
                        <td className="p-3 text-sm text-right font-mono font-semibold">{Number(entry.hours).toFixed(1)}h</td>
                        <td className="p-3">
                          <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Onglet Réunions ───────────────────────────── */}
        <TabsContent value="meetings" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{meetings.length} réunion{meetings.length > 1 ? "s" : ""}</span>
            <Button onClick={() => setShowAddMeeting(true)} size="sm" className="bg-neon text-black hover:bg-neon/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle réunion
            </Button>
          </div>

          {meetings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune note de réunion</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {meetings.map((meeting) => {
                const isExpanded = expandedMeeting === meeting.id;
                const typeConfig = MEETING_TYPES[meeting.meeting_type];
                return (
                  <Card key={meeting.id}>
                    <div
                      onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <Badge variant="outline" className={cn("text-[10px]", typeConfig.color)}>
                          {typeConfig.label}
                        </Badge>
                        <span className="text-sm font-medium">{meeting.title}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(meeting.meeting_date)}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(meeting.id); }}
                        className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isExpanded && meeting.content && (
                      <CardContent className="pt-0 border-t border-border">
                        <div className="prose prose-sm prose-invert max-w-none mt-3" dangerouslySetInnerHTML={{ __html: meeting.content }} />
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Time Entry Modal */}
      <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des heures</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Membre</Label>
              <Select value={entryMember} onValueChange={setEntryMember}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titre *</Label>
              <Input value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} placeholder="ex: Création contenu Instagram" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Heures *</Label>
                <Input type="number" step="0.5" min="0" value={entryHours} onChange={(e) => setEntryHours(e.target.value)} className="mt-1" placeholder="2.5" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} placeholder="Notes optionnelles..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setShowAddEntry(false)}>Annuler</Button>
              <Button onClick={handleCreateEntry} disabled={savingEntry || !entryTitle.trim() || !entryHours} className="bg-neon text-black hover:bg-neon/90">
                {savingEntry && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Meeting Modal */}
      <Dialog open={showAddMeeting} onOpenChange={setShowAddMeeting}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle réunion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titre *</Label>
              <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="ex: Réunion hebdo ventes" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={meetingType} onValueChange={(v) => setMeetingType(v as MeetingType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEETING_TYPES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Compte-rendu</Label>
              <RichTextEditor content={meetingContent} onChange={setMeetingContent} placeholder="Notes de réunion..." minHeight="200px" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setShowAddMeeting(false)}>Annuler</Button>
              <Button onClick={handleCreateMeeting} disabled={savingMeeting || !meetingTitle.trim()} className="bg-neon text-black hover:bg-neon/90">
                {savingMeeting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
