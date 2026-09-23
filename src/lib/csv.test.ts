import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("csv", () => {
  it("starts with a BOM so Excel reads UTF-8", () => expect(toCsv([["a"]], "en").charCodeAt(0)).toBe(0xfeff));
  it("uses semicolons and decimal commas for Brazilian Excel", () => expect(toCsv([["NF 1", 1240.5]], "pt-BR")).toBe("\uFEFFNF 1;1240,50\r\n"));
  it("uses commas and decimal points in English", () => expect(toCsv([["NF 1", 1240.5]], "en")).toBe("\uFEFFNF 1,1240.50\r\n"));
  it("quotes cells that contain separators or quotes", () => expect(toCsv([['Gráfica "Horizonte"; Ltda']], "pt-BR")).toBe('\uFEFF"Gráfica ""Horizonte""; Ltda"\r\n'));
});
