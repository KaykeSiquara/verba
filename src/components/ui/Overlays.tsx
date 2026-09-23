import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { usePrefs } from "../../app/prefs";
import { Button } from "./Button";

type ConfirmProps = {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel: string;
  onConfirm: () => void; danger?: boolean; busy?: boolean; children?: ReactNode;
};
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, danger, busy, children }: ConfirmProps) {
  const { t } = usePrefs();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="dialog-content fixed top-1/2 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-fg-muted">{description}</Dialog.Description>
          <form className="mt-4 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
            {children}
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild><Button>{t("app.cancel")}</Button></Dialog.Close>
              <Button type="submit" variant={danger ? "danger" : "primary"} busy={busy} disabled={busy}>{confirmLabel}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Sheet({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode }) {
  const { t } = usePrefs();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="sheet-content fixed inset-y-0 right-0 z-50 flex w-[min(100vw,30rem)] flex-col border-l border-border bg-surface shadow-2xl">
          <header className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-sm text-fg-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild><Button variant="ghost" size="sm" aria-label={t("app.close")}><X className="size-4" aria-hidden="true" /></Button></Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
