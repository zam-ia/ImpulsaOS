import type { LucideIcon } from "lucide-react";
import { readableStatus } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="motion-page-header mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold leading-tight text-ink md:text-3xl">{title}</h2>
        <p className="mt-2 max-w-[72ch] text-sm leading-6 text-ink/65">{description}</p>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`motion-panel rounded-2xl border border-ink/10 bg-[var(--color-surface)] shadow-panel ${className}`}>{children}</section>;
}

export function PanelHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink/10 p-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-5 text-ink/60">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "moss"
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "moss" | "coral" | "saffron" | "peacock";
}) {
  const tones = {
    moss: "bg-moss/12 text-moss",
    coral: "bg-coral/12 text-coral",
    saffron: "bg-saffron/20 text-ink",
    peacock: "bg-peacock/12 text-peacock"
  };

  return (
    <Panel className="motion-stat p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm leading-6 text-ink/60">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
        </div>
        <span className={`motion-icon flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Panel>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-ink/8 text-ink",
    needs_review: "bg-saffron/30 text-ink",
    approved: "bg-moss/12 text-moss",
    scheduled: "bg-peacock/12 text-peacock",
    published: "bg-moss text-[var(--color-surface)]",
    rejected: "bg-coral/12 text-coral",
    failed: "bg-coral text-[var(--color-surface)]",
    new: "bg-saffron/30 text-ink",
    contacted: "bg-peacock/12 text-peacock",
    qualified: "bg-moss/12 text-moss",
    proposal_sent: "bg-ink/8 text-ink",
    won: "bg-moss text-[var(--color-surface)]",
    lost: "bg-coral/12 text-coral",
    nurture: "bg-paper text-ink"
  };

  return (
    <span className={`motion-badge inline-flex rounded px-2 py-1 text-xs font-semibold ${colors[status] ?? "bg-ink/8 text-ink"}`}>
      {readableStatus(status)}
    </span>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink/75">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink/50">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">{description}</p>
    </div>
  );
}
