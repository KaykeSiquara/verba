import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const control = "w-full rounded-lg border border-border-strong bg-surface px-3 text-fg placeholder:text-fg-muted aria-invalid:border-rejected";

type Base = { label: string; hint?: ReactNode; error?: string | null; className?: string; hideLabel?: boolean };

function Wrap({ id, label, hint, error, className, hideLabel, children }: Base & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-sm font-semibold", hideLabel && "sr-only")}>{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-fg-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs font-semibold text-rejected">{error}</p>}
    </div>
  );
}
const described = (id: string, hint?: ReactNode, error?: string | null) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function TextField({ label, hint, error, className, hideLabel, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <Wrap id={id} {...{ label, hint, error, className, hideLabel }}>
      <input {...rest} id={id} className={cn(control, "h-10")} aria-invalid={!!error || undefined} aria-describedby={described(id, hint, error)} />
    </Wrap>
  );
}

export function TextArea({ label, hint, error, className, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <Wrap id={id} {...{ label, hint, error, className }}>
      <textarea {...rest} id={id} className={cn(control, "min-h-24 py-2")} aria-invalid={!!error || undefined} aria-describedby={described(id, hint, error)} />
    </Wrap>
  );
}

export function SelectField({ label, hint, error, className, hideLabel, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <Wrap id={id} {...{ label, hint, error, className, hideLabel }}>
      <select {...rest} id={id} className={cn(control, "h-10 pr-8")} aria-describedby={described(id, hint, error)}>{children}</select>
    </Wrap>
  );
}
