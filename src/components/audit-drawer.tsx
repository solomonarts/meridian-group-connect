import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { listAuditEvents } from "@/lib/tbs.functions";
import type { ReactNode } from "react";

const TONE: Record<string, string> = {
  governance: "bg-status-success text-status-success-foreground",
  portfolio: "bg-status-warning text-status-warning-foreground",
  treasury: "bg-gold/20 text-foreground",
  membership: "bg-navy text-navy-foreground",
  kyc: "bg-muted text-muted-foreground",
};

export function AuditDrawer({ trigger }: { trigger: ReactNode }) {
  const query = useQuery({
    queryKey: ["audit", 50],
    queryFn: () => listAuditEvents({ data: { limit: 50 } }),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Audit trail</SheetTitle>
          <SheetDescription>Immutable governance, treasury, and membership events.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {query.isLoading && <div className="text-sm text-muted-foreground">Loading events…</div>}
          {query.error && <div className="text-sm text-destructive">Failed to load audit trail.</div>}
          {query.data?.map((e) => (
            <div key={e.id} className="border-l-2 border-gold pl-4">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE[e.event_type] ?? "bg-muted text-muted-foreground"}`}>
                  {e.event_type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">{e.title}</div>
              {e.description && <div className="text-xs text-muted-foreground">{e.description}</div>}
              <div className="mt-1 text-[10px] text-muted-foreground">By {e.actor_name ?? "System"}</div>
            </div>
          ))}
          {query.data?.length === 0 && <div className="text-sm text-muted-foreground">No events yet.</div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
