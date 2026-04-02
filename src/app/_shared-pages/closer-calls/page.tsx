"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCloserCalls, type CloserCall } from "@/hooks/use-closer-calls";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  PhoneCall,
  Plus,
  Download,
  Target,
  Users,
  Search,
  Loader2,
  X,
  MoreHorizontal,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  Phone,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { format, parseISO, isToday, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

/* ─── Types ─── */
type Tab = "pipeline" | "liste";
type PipelineColumn =
  | "a_venir"
  | "close"
  | "non_qualifie"
  | "perdu"
  | "annule"
  | "no_show";

interface ColumnConfig {
  key: PipelineColumn;
  label: string;
  borderColor: string;
  badgeColor: string;
}

const PIPELINE_COLUMNS: ColumnConfig[] = [
  {
    key: "a_venir",
    label: "Appels a venir",
    borderColor: "border-t-blue-500",
    badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  {
    key: "close",
    label: "Close",
    borderColor: "border-t-emerald-500",
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  {
    key: "non_qualifie",
    label: "Non qualifie",
    borderColor: "border-t-amber-500",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  {
    key: "perdu",
    label: "Perdu",
    borderColor: "border-t-lime-400",
    badgeColor: "bg-lime-400/15 text-lime-500 dark:text-lime-300",
  },
  {
    key: "annule",
    label: "Annule",
    borderColor: "border-t-orange-500",
    badgeColor: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  {
    key: "no_show",
    label: "No-show",
    borderColor: "border-t-zinc-400",
    badgeColor: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400",
  },
];

/* ─── Status badge ─── */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  closé: {
    label: "Close",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  close: {
    label: "Close",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  non_closé: {
    label: "Non close",
    color: "bg-lime-400/15 text-lime-500 dark:text-lime-300",
  },
  non_close: {
    label: "Non close",
    color: "bg-lime-400/15 text-lime-500 dark:text-lime-300",
  },
  perdu: {
    label: "Perdu",
    color: "bg-lime-400/15 text-lime-500 dark:text-lime-300",
  },
  pending: {
    label: "En attente",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  annule: {
    label: "Annule",
    color: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  no_show: {
    label: "No-show",
    color: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400",
  },
  non_qualifie: {
    label: "Non qualifie",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
};

/* ─── Helper: classify call into pipeline column ─── */
function getCallColumn(call: CloserCall): PipelineColumn {
  if (call.status === "close") return "close";
  if (call.status === "perdu") return "perdu";
  if (call.status === "annule") return "annule";
  if (call.status === "no_show") return "no_show";
  if (call.status === "non_qualifie") return "non_qualifie";
  if (call.status === "a_venir") return "a_venir";
  // pending ou date future → a venir
  try {
    const callDate = parseISO(call.date);
    if (isToday(callDate) || isFuture(callDate)) return "a_venir";
  } catch {
    // fallback
  }
  // Date passee sans status explicite = a_venir (pas perdu)
  return "a_venir";
}

/* ─── Progress bar component ─── */
function ProgressBar({
  value,
  max,
  color,
  label,
  displayValue,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  displayValue: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-bold text-foreground">
          {displayValue}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          iconBg,
        )}
      >
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── Droppable Column ─── */
function DroppableColumn({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "ring-2 ring-primary/30 bg-primary/5")}
    >
      {children}
    </div>
  );
}

/* ─── Draggable Card Wrapper ─── */
function DraggableCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

/* ─── Pipeline Card ─── */
function PipelineCard({
  call,
  onEdit,
  onDelete,
}: {
  call: CloserCall;
  onEdit: (c: CloserCall) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const statusConf = STATUS_CONFIG[call.status] ?? STATUS_CONFIG.non_closé;

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2 group relative">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-foreground truncate">
          {call.client?.full_name ?? "Client inconnu"}
        </p>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-7 z-50 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(call);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-3 h-3" />
                  Modifier
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(call.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {(() => {
          try {
            return format(parseISO(call.date), "d MMM yyyy", { locale: fr });
          } catch {
            return call.date;
          }
        })()}
      </p>
      {call.revenue > 0 && (
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(call.revenue)}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
            statusConf.color,
          )}
        >
          {statusConf.label}
        </span>
        {call.closer && (
          <div className="flex items-center gap-1.5">
            {call.closer.avatar_url ? (
              <Image
                src={call.closer.avatar_url}
                alt={call.closer.full_name}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold">
                {call.closer.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">
              {call.closer.full_name.split(" ")[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── New Closer Call Modal ─── */
function CloserCallFormModal({
  open,
  onClose,
  editCall,
  forClientId,
}: {
  open: boolean;
  onClose: () => void;
  editCall?: CloserCall | null;
  forClientId?: string;
}) {
  const { createCloserCall, updateCloserCall } = useCloserCalls(forClientId);
  const supabase = useSupabase();
  const { user, profile } = useAuth();
  const isClientMode = !!forClientId;
  const [clientId, setClientId] = useState("");
  const [closerId, setCloserId] = useState("");
  const [setterId, setSetterId] = useState("");
  const [date, setDate] = useState("");
  const [revenue, setRevenue] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [nombrePaiements, setNombrePaiements] = useState("1");
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<{ id: string; full_name: string }[]>(
    [],
  );
  const [closers, setClosers] = useState<{ id: string; full_name: string }[]>(
    [],
  );
  const [setters, setSetters] = useState<{ id: string; full_name: string }[]>(
    [],
  );

  useEffect(() => {
    if (!open) return;
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "client")
      .order("full_name")
      .then(
        (res: {
          data: { id: string; full_name: string }[] | null;
          error: unknown;
        }) => {
          if (res.error) {
            console.error("Echec chargement clients:", res.error);
            return;
          }
          setClients(res.data ?? []);
        },
      );
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "coach", "closer"])
      .order("full_name")
      .then(
        (res: {
          data: { id: string; full_name: string }[] | null;
          error: unknown;
        }) => {
          if (res.error) {
            console.error("Echec chargement closers:", res.error);
            return;
          }
          setClosers(res.data ?? []);
        },
      );
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "setter")
      .order("full_name")
      .then(
        (res: {
          data: { id: string; full_name: string }[] | null;
          error: unknown;
        }) => {
          if (res.error) {
            console.error("Echec chargement setters:", res.error);
            return;
          }
          setSetters(res.data ?? []);
        },
      );
  }, [open, supabase]);

  useEffect(() => {
    if (editCall) {
      setClientId(editCall.contact_id ?? editCall.client_id ?? "");
      setCloserId(editCall.closer_id ?? "");
      setSetterId(editCall.setter_id ?? "");
      setDate(editCall.date);
      setRevenue(editCall.revenue > 0 ? String(editCall.revenue) : "");
      setNotes(editCall.notes ?? "");
      setStatus(editCall.status);
      setNombrePaiements(String(editCall.nombre_paiements ?? 1));
    } else {
      setClientId("");
      setCloserId(
        isClientMode ? (forClientId ?? user?.id ?? "") : (user?.id ?? ""),
      );
      setSetterId("");
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      setDate(todayStr);
      setRevenue("");
      setNotes("");
      setStatus("pending");
      setNombrePaiements("1");
    }
  }, [editCall, open, isClientMode, forClientId, user?.id]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    try {
      if (editCall) {
        await updateCloserCall.mutateAsync({
          id: editCall.id,
          client_id: clientId || null,
          closer_id: closerId || null,
          setter_id: setterId || null,
          date,
          status,
          revenue: Number(revenue) || 0,
          nombre_paiements: Number(nombrePaiements) || 0,
          notes: notes || null,
        });
      } else {
        await createCloserCall.mutateAsync({
          client_id: clientId || undefined,
          closer_id: closerId || null,
          setter_id: setterId || null,
          date,
          status,
          revenue: Number(revenue) || 0,
          nombre_paiements: Number(nombrePaiements) || 0,
          notes: notes || null,
        });
      }
      onClose();
    } catch (err) {
      console.error("Erreur soumission closer call:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-10 px-4 bg-muted/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow";
  const selectClass =
    "w-full h-10 px-4 bg-muted/50 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow";
  const labelClass =
    "block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-surface rounded-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-surface rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-display font-semibold text-foreground">
              {editCall ? "Modifier le call" : "Nouveau call"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Closer</label>
            {isClientMode ? (
              <div
                className={cn(
                  selectClass,
                  "flex items-center text-foreground/70 cursor-not-allowed opacity-70",
                )}
              >
                {profile?.full_name ?? "Moi"}
              </div>
            ) : (
              <select
                value={closerId}
                onChange={(e) => setCloserId(e.target.value)}
                className={selectClass}
              >
                <option value="">Sélectionner un closer</option>
                {closers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Setter (optional, only shown when status = closé) */}
          {status === "close" && (
            <div>
              <label className={labelClass}>Setter (source du lead)</label>
              <select
                value={setterId}
                onChange={(e) => setSetterId(e.target.value)}
                className={selectClass}
              >
                <option value="">Aucun setter</option>
                {setters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
              {setterId && Number(revenue) > 0 && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Commission auto calculee a la creation
                </p>
              )}
            </div>
          )}

          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatus(newStatus);
                // Reset setterId quand on quitte le status "close"
                if (newStatus !== "close") setSetterId("");
              }}
              className={selectClass}
            >
              <option value="pending">Pas encore effectue</option>
              <option value="close">Close</option>
              <option value="non_qualifie">Non qualifie</option>
              <option value="perdu">Perdu</option>
              <option value="annule">Annule</option>
              <option value="no_show">No-show</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant offre</label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0"
                min={0}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nb paiements</label>
              <input
                type="number"
                value={nombrePaiements}
                onChange={(e) => setNombrePaiements(e.target.value)}
                placeholder="1"
                min={0}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes sur l'appel (optionnel)..."
              className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-shadow"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !date}
              className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editCall ? "Modifier" : "Creer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page principale : Closer Calls
   ═══════════════════════════════════════════════════════════ */

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 derniers jours" },
  { value: "14d", label: "14 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "last_month", label: "Mois dernier" },
  { value: "3m", label: "3 derniers mois" },
  { value: "all", label: "Tout" },
];

function getPeriodDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 86400000);
    case "14d":
      return new Date(now.getTime() - 14 * 86400000);
    case "30d":
      return new Date(now.getTime() - 30 * 86400000);
    case "this_month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "last_month":
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    default:
      return null;
  }
}

export default function CloserCallsPage({
  clientId,
}: { clientId?: string } = {}) {
  const { closerCalls, isLoading, deleteCloserCall, updateCloserCall } =
    useCloserCalls(clientId);
  const [tab, setTab] = useState<Tab>("pipeline");
  const [showForm, setShowForm] = useState(false);
  const [editCall, setEditCall] = useState<CloserCall | null>(null);
  const [filterClient, setFilterClient] = useState("");
  const [filterCloser, setFilterCloser] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("30d");
  const supabase = useSupabase();

  const [clientOptions, setClientOptions] = useState<
    { id: string; full_name: string }[]
  >([]);
  const [closerOptions, setCloserOptions] = useState<
    { id: string; full_name: string }[]
  >([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "client")
      .order("full_name")
      .then(
        (res: {
          data: { id: string; full_name: string }[] | null;
          error: unknown;
        }) => {
          if (res.error) {
            console.error("Echec chargement clients:", res.error);
            return;
          }
          setClientOptions(res.data ?? []);
        },
      );
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "coach", "closer"])
      .order("full_name")
      .then(
        (res: {
          data: { id: string; full_name: string }[] | null;
          error: unknown;
        }) => {
          if (res.error) {
            console.error("Echec chargement closers:", res.error);
            return;
          }
          setCloserOptions(res.data ?? []);
        },
      );
  }, [supabase]);

  /* ─── Filtered calls ─── */
  const filtered = useMemo(() => {
    let result = closerCalls;
    const periodDate = getPeriodDate(period);
    if (periodDate) {
      result = result.filter((c) => new Date(c.date) >= periodDate);
    }
    if (filterClient) {
      result = result.filter((c) => c.contact_id === filterClient);
    }
    if (filterCloser) {
      result = result.filter((c) => c.closer_id === filterCloser);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.client?.full_name?.toLowerCase().includes(q) ||
          c.closer?.full_name?.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [closerCalls, filterClient, filterCloser, search, period]);

  /* ─── Stats filtrees ─── */
  const filteredStats = useMemo(() => {
    const totalCalls = filtered.length;
    const closedCalls = filtered.filter((c) => c.status === "close").length;
    const noShows = filtered.filter((c) => c.status === "no_show").length;
    const nonQualified = filtered.filter(
      (c) => c.status === "non_qualifie",
    ).length;
    const perdus = filtered.filter((c) => c.status === "perdu").length;
    // Appels realises = close + perdu + non_qualifie (pas a_venir, annule, no_show)
    const realises = closedCalls + perdus + nonQualified;
    const showedUp = totalCalls - noShows;
    return {
      totalCalls,
      realises,
      closedCalls,
      nonQualified,
      closingRate:
        realises > 0 ? Math.round((closedCalls / realises) * 100 * 10) / 10 : 0,
      showUpRate:
        totalCalls > 0
          ? Math.round((showedUp / totalCalls) * 100 * 10) / 10
          : 0,
    };
  }, [filtered]);

  /* ─── Pipeline columns ─── */
  const pipelineData = useMemo(() => {
    const map: Record<PipelineColumn, CloserCall[]> = {
      a_venir: [],
      close: [],
      non_qualifie: [],
      perdu: [],
      annule: [],
      no_show: [],
    };
    filtered.forEach((call) => {
      const col = getCallColumn(call);
      map[col].push(call);
    });
    return map;
  }, [filtered]);

  /* ─── CSV Export ─── */
  const handleExportCSV = () => {
    const headers = [
      "Client",
      "Closer",
      "Date",
      "Statut",
      "Montant",
      "Nb paiements",
      "Notes",
    ];
    const rows = filtered.map((c) => [
      c.client?.full_name ?? "",
      c.closer?.full_name ?? "",
      c.date,
      c.status,
      String(c.revenue),
      String(c.nombre_paiements),
      (c.notes ?? "").replace(/"/g, '""'),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `closer-calls-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV telecharge");
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce call ?")) {
      deleteCloserCall.mutate(id);
    }
  };

  const handleEdit = (call: CloserCall) => {
    setEditCall(call);
    setShowForm(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const callId = active.id as string;
    const targetColumn = over.id as string;

    const call = closerCalls.find((c) => c.id === callId);
    if (!call) return;

    const currentColumn = getCallColumn(call);
    if (currentColumn === targetColumn) return;

    const updates: Record<string, unknown> = {};

    if (targetColumn === "close") {
      updates.status = "close";
    } else if (targetColumn === "perdu") {
      updates.status = "perdu";
    } else if (targetColumn === "annule") {
      updates.status = "annule";
    } else if (targetColumn === "no_show") {
      updates.status = "no_show";
    } else if (targetColumn === "non_qualifie") {
      updates.status = "non_qualifie";
    } else if (targetColumn === "a_venir") {
      updates.status = "a_venir";
    }

    if (Object.keys(updates).length > 0) {
      updateCloserCall.mutate({ id: callId, ...updates });
    }
  };

  return (
    <motion.div variants={staggerContainer} className="space-y-6">
      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Appels
            </span>
          </h1>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Suivez les performances de closing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            className="w-40 h-9 text-xs"
          />
          <button
            onClick={handleExportCSV}
            className="h-9 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => {
              setEditCall(null);
              setShowForm(true);
            }}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#c6ff00]/20 transition-all duration-300 active:scale-[0.98] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau call
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        <KpiCard
          icon={Phone}
          label="Appels realises"
          value={String(filteredStats.realises)}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={Users}
          label="Taux de show-up"
          value={`${filteredStats.showUpRate}%`}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Target}
          label="Taux de closing"
          value={`${filteredStats.closingRate}%`}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={CheckCircle}
          label="Appels gagnes"
          value={String(filteredStats.closedCalls)}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          icon={XCircle}
          label="Non qualifies"
          value={String(filteredStats.nonQualified)}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-600 dark:text-orange-400"
        />
      </motion.div>

      {/* Tabs + Search */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center border-b border-border">
          <div className="flex items-center gap-0">
            {(["pipeline", "liste"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "h-10 px-4 text-sm font-medium transition-all relative",
                  tab === t
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "pipeline" ? "Pipeline" : "Liste"}
                {tab === t && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
                )}
              </button>
            ))}
          </div>
          <div className="ml-auto pb-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-8 pl-9 pr-4 w-56 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border transition-shadow"
            />
          </div>
        </div>
      </motion.div>

      {/* Pipeline Tab */}
      {tab === "pipeline" && (
        <motion.div variants={staggerItem} className="space-y-4">
          {/* Kanban */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted/30 rounded-xl h-[300px] animate-shimmer"
                />
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {PIPELINE_COLUMNS.map((col) => {
                  const items = pipelineData[col.key];
                  return (
                    <DroppableColumn
                      key={col.key}
                      id={col.key}
                      className={cn(
                        "bg-muted/30 rounded-xl p-3 min-h-[300px] border-t-4 transition-all",
                        col.borderColor,
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-foreground">
                          {col.label}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                            col.badgeColor,
                          )}
                        >
                          {items.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map((call) => (
                          <DraggableCard key={call.id} id={call.id}>
                            <PipelineCard
                              call={call}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </DraggableCard>
                        ))}
                        {items.length === 0 && (
                          <p className="text-[11px] text-muted-foreground/50 text-center py-8">
                            Aucun appel
                          </p>
                        )}
                      </div>
                    </DroppableColumn>
                  );
                })}
              </div>
            </DndContext>
          )}
        </motion.div>
      )}

      {/* Liste Tab */}
      {tab === "liste" && (
        <motion.div variants={staggerItem}>
          <div
            className="bg-surface border border-border rounded-2xl overflow-hidden"
            style={{
              boxShadow:
                "0 1px 3px rgb(0 0 0 / 0.04), 0 8px 20px rgb(0 0 0 / 0.02)",
            }}
          >
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted/30 rounded-xl animate-shimmer"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <PhoneCall className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aucun call
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Cliquez sur &quot;Nouveau call&quot; pour en creer un
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Client
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Closer
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map((call) => {
                      const statusConf =
                        STATUS_CONFIG[call.status] ?? STATUS_CONFIG.non_closé;
                      return (
                        <tr
                          key={call.id}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => handleEdit(call)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {call.client?.avatar_url ? (
                                <Image
                                  src={call.client.avatar_url}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="w-7 h-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                  {(call.client?.full_name ?? "?")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </div>
                              )}
                              <span className="font-medium text-foreground">
                                {call.client?.full_name ?? "Inconnu"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {call.closer?.full_name ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(call.date)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {call.revenue > 0
                              ? formatCurrency(call.revenue)
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold",
                                statusConf.color,
                              )}
                            >
                              {statusConf.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(call);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Modifier"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(call.id);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal */}
      <CloserCallFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditCall(null);
        }}
        editCall={editCall}
        forClientId={clientId}
      />
    </motion.div>
  );
}
