import { screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { renderApp } from "./render";

// Structural WCAG 2.1 A/AA rules on every page. jsdom has no layout, so
// color-contrast is left to the token gate (src/lib/tokens.test.ts).
const run = async (node: Element) => {
  const r = await axe.run(node, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
};

const pages: [string, string, boolean][] = [
  ["overview", "/", true],
  ["documents", "/documents", true],
  ["programs", "/programs", true],
  ["team", "/team", true],
  ["settings", "/settings", true],
  ["not found", "/does-not-exist", true],
  ["login", "/login", false],
];

describe("axe", () => {
  it("finds no WCAG 2.1 A or AA violations on any page", async () => {
    const found: string[] = [];
    for (const [name, path, signedIn] of pages) {
      localStorage.clear();
      const { container, unmount } = renderApp(path, { signedIn });
      await screen.findAllByRole("heading", { level: 1 });
      found.push(...(await run(container)).map((v) => `${name} → ${v}`));
      unmount();
    }
    expect(found).toEqual([]);
  });
});
