import type { Department, Doc, DocKind, HistoryEvent, Member, Profile, Program, Status } from "./types";

export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DAY = 86_400_000;
export const ORG = "Instituto Semear";

export const PROGRAMS: Program[] = [
  { id: "p1", code: "HV", name: "Horta Viva", budget: 42_000_000, manager: "Rita Almeida", hue: 150 },
  { id: "p2", code: "LR", name: "Leitura em Rede", budget: 36_000_000, manager: "Caio Mendes", hue: 262 },
  { id: "p3", code: "PI", name: "Primeira Infância", budget: 58_000_000, manager: "Luana Prado", hue: 20 },
  { id: "p4", code: "JA", name: "Juventude Ativa", budget: 31_000_000, manager: "Diego Farias", hue: 62 },
  { id: "p5", code: "SP", name: "Saúde na Praça", budget: 27_000_000, manager: "Helena Rocha", hue: 190 },
  { id: "p6", code: "OO", name: "Oficina de Ofícios", budget: 24_000_000, manager: "Bruno Teixeira", hue: 300 },
  { id: "p7", code: "RM", name: "Rede de Mulheres", budget: 33_000_000, manager: "Patrícia Lima", hue: 340 },
  { id: "p8", code: "EB", name: "Esporte no Bairro", budget: 16_000_000, manager: "Rafael Souza", hue: 100 },
];
const WEIGHTS = [1.3, 1, 1.6, 1, 0.8, 0.7, 0.9, 0.75];

const SUPPLIERS = [
  "Papelaria Central", "Distribuidora Aurora", "Gráfica Horizonte", "Mercado Bom Preço", "TransRio Logística", "Clínica Vida Plena",
  "Construtora Base", "Tech Soluções", "Hortifruti Serra", "Eventos Maré", "Oficina Criativa", "Farmácia Popular do Porto",
];
const REJECT_NOTES = [
  "Nota fiscal sem o CNPJ do fornecedor.", "Valor acima do previsto no plano de trabalho.", "Despesa fora do período do convênio.",
  "Comprovante ilegível, reenviar digitalizado.", "Item não previsto na rubrica do programa.",
];

export const MEMBERS: Member[] = [
  { id: "m1", name: "Marina Duarte", email: "marina@semear.example", role: "admin", status: "active", lastActiveAt: null },
  { id: "m2", name: "Rita Almeida", email: "rita@semear.example", role: "approver", status: "active", lastActiveAt: null },
  { id: "m3", name: "Caio Mendes", email: "caio@semear.example", role: "approver", status: "active", lastActiveAt: null },
  { id: "m4", name: "Luana Prado", email: "luana@semear.example", role: "approver", status: "active", lastActiveAt: null },
  { id: "m5", name: "Diego Farias", email: "diego@semear.example", role: "viewer", status: "active", lastActiveAt: null },
  { id: "m6", name: "Helena Rocha", email: "helena@semear.example", role: "viewer", status: "active", lastActiveAt: null },
  { id: "m7", name: "Bruno Teixeira", email: "bruno@semear.example", role: "viewer", status: "active", lastActiveAt: null },
  { id: "m8", name: "Patrícia Lima", email: "patricia@semear.example", role: "approver", status: "invited", lastActiveAt: null },
];
export const PROFILE: Profile = { name: "Marina Duarte", email: "marina@semear.example", title: "Coordenadora financeira" };
export const SEATS = 12;

const DEPTS: Department[] = ["payroll", "hr", "procurement", "reporting"];
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];
function weighted(r: () => number) {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let x = r() * total;
  for (let i = 0; i < WEIGHTS.length; i++) if ((x -= WEIGHTS[i]) <= 0) return i;
  return WEIGHTS.length - 1;
}

export function seedDocs(now: Date, count = 480, seed = 2026): Doc[] {
  const r = mulberry32(seed);
  const approvers = MEMBERS.filter((m) => m.role !== "viewer" && m.status === "active").map((m) => m.name);
  const docs: Doc[] = [];
  for (let i = 0; i < count; i++) {
    const program = PROGRAMS[weighted(r)];
    const department = pick(r, DEPTS);
    const kind: DocKind = department === "payroll" ? "payroll" : r() < 0.7 ? "invoice" : "receipt";
    const prefix = kind === "payroll" ? "RPA" : kind === "invoice" ? "NF" : "REC";
    const brl = Math.exp(Math.log(180) + (Math.log(24_000) - Math.log(180)) * r() ** 1.7);
    const amount = Math.round(brl * 100);
    const issued = new Date(now.getTime() - Math.floor(r() * 330) * DAY - Math.floor(r() * 9) * 3_600_000);
    const due = new Date(issued.getTime() + (12 + Math.floor(r() * 34)) * DAY);
    const age = (now.getTime() - due.getTime()) / DAY;
    const x = r();
    const status: Status = age > 20 ? (x < 0.86 ? "paid" : x < 0.95 ? "rejected" : "pending") : x < 0.58 ? "pending" : x < 0.9 ? "paid" : "rejected";
    const creator = pick(r, ["Marina Duarte", "Rita Almeida", "Caio Mendes", "Luana Prado"]);
    const history: HistoryEvent[] = [
      { at: issued.toISOString(), type: "created", by: creator },
      { at: new Date(issued.getTime() + (0.2 + r()) * DAY).toISOString(), type: "submitted", by: creator },
    ];
    if (status !== "pending") {
      const decided = new Date(Math.min(now.getTime() - 3_600_000, issued.getTime() + (3 + r() * 30) * DAY));
      history.push(status === "paid" ? { at: decided.toISOString(), type: "approved", by: pick(r, approvers) } : { at: decided.toISOString(), type: "rejected", by: pick(r, approvers), note: pick(r, REJECT_NOTES) });
    }
    docs.push({
      id: `d${String(i + 1).padStart(4, "0")}`, number: `${prefix} ${1200 + i * 7 + Math.floor(r() * 7)}`, kind, supplier: kind === "payroll" ? "Folha de pagamento" : pick(r, SUPPLIERS),
      programId: program.id, department, amount, issuedAt: issued.toISOString(), dueAt: due.toISOString(), status, history,
    });
  }
  return docs;
}
