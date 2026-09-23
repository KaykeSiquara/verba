import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { usePrefs } from "../../app/prefs";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} aria-hidden="true" />;
}

export function Loading({ rows = 4 }: { rows?: number }) {
  const { t } = usePrefs();
  return (
    <div role="progressbar" aria-label={t("app.loading")} aria-busy="true" className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
    </div>
  );
}

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-fg-muted">
      <Inbox className="size-8" aria-hidden="true" />
      <p>{children}</p>
      {action}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = usePrefs();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="size-8 text-rejected" aria-hidden="true" />
      <p className="font-semibold">{t("app.errorTitle")}</p>
      <p className="max-w-sm text-sm text-fg-muted">{t("app.errorBody")}</p>
      <Button onClick={onRetry}>{t("app.retry")}</Button>
    </div>
  );
}

export function Card({ title, action, children, className, id }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cn("min-w-0 rounded-xl border border-border bg-surface", className)}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 id={id} className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
