import type { ReactNode } from "react";
import { Suspense } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { getMyProfile } from "@/lib/tbs.functions";

const profileQO = queryOptions({ queryKey: ["me"], queryFn: () => getMyProfile() });

function Inner({ eyebrow, title, description, children }: ManagerPageProps) {
  const { data: me } = useSuspenseQuery(profileQO);
  return (
    <DashboardShell email={me.profile?.email}>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      {children}
    </DashboardShell>
  );
}

export type ManagerPageProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ManagerPage(props: ManagerPageProps) {
  return (
    <Suspense fallback={<div className="p-12 text-sm text-muted-foreground">Loading…</div>}>
      <Inner {...props} />
    </Suspense>
  );
}

export const fmtMoney = (n: number | null | undefined, currency = "USD") =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(n));

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
