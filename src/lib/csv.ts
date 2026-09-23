export function toCsv(rows: (string | number)[][], lang: "pt-BR" | "en"): string {
  const sep = lang === "pt-BR" ? ";" : ",";
  const cell = (v: string | number) => {
    const s = typeof v === "number" ? (lang === "pt-BR" ? v.toFixed(2).replace(".", ",") : v.toFixed(2)) : v;
    return s.includes(sep) || /["\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return "\uFEFF" + rows.map((r) => r.map(cell).join(sep)).join("\r\n") + "\r\n";
}

export function download(name: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
