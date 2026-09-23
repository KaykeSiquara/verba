import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contrast, parseOklch } from "./color";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const block = (selector: string) => {
  const body = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(oklch\([^)]+\))/g)].map((m) => [m[1], parseOklch(m[2])]));
};
const PAIRS: [string, string, number][] = [
  ["fg", "bg", 4.5], ["fg", "surface", 4.5], ["fg", "surface-2", 4.5], ["fg-muted", "bg", 4.5], ["fg-muted", "surface", 4.5], ["fg-muted", "surface-2", 4.5],
  ["accent", "surface", 4.5], ["accent", "bg", 4.5], ["accent-fg", "accent", 4.5], ["fg", "accent-soft", 4.5],
  ["paid", "paid-soft", 4.5], ["pending", "pending-soft", 4.5], ["rejected", "rejected-soft", 4.5], ["rejected", "surface", 4.5], ["surface", "rejected", 4.5],
  ["border-strong", "surface", 3], ["ring", "surface", 3], ["ring", "bg", 3],
];

describe.each([[":root", "light"], [".dark", "dark"]])("%s tokens (%s theme)", (selector) => {
  const tokens = block(selector);
  it.each(PAIRS)("%s on %s reaches %s:1", (fg, bg, min) => {
    expect(tokens[fg], fg).toBeDefined();
    expect(tokens[bg], bg).toBeDefined();
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
  });
});
