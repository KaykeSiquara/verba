import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; ref?: Ref<HTMLButtonElement>; busy?: boolean };

export const buttonClass = (variant: Props["variant"] = "secondary", size: Props["size"] = "md") =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm",
    variant === "primary" && "bg-accent text-accent-fg hover:brightness-110",
    variant === "secondary" && "border border-border-strong/60 bg-surface text-fg hover:bg-surface-2",
    variant === "ghost" && "text-fg hover:bg-surface-2",
    variant === "danger" && "bg-rejected text-surface hover:brightness-110",
  );

export function Button({ variant, size, className, busy, children, ref, ...rest }: Props) {
  return (
    <button ref={ref} type="button" className={cn(buttonClass(variant, size), className)} aria-busy={busy || undefined} {...rest}>
      {busy && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}
