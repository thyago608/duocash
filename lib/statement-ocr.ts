export type StatementCandidate = {
  label: string;
  amountCents: number;
  date: string | null;
  bucketId: string | null;
  confirmedOutgoing: boolean;
};

type Bucket = { id: string; name: string };
type History = { label: string; allocationBucketId: string | null };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const ignored = /\b(saldo|extrato|limite|total|investimento|rendimento|recebido|recebida|entrada|deposito recebido|estorno|reembolso)\b/i;
const outgoing = /\b(pagamento|pago|pagou|enviado|enviada|compra|debito|saida|transferencia enviada)\b/i;
const datePattern = /\b\d{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?\b/;
const amountPattern = /(?:-\s*)?(?:R\$\s*)?-?\s*(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?:\s*-)?/g;

function categoryFor(label: string, buckets: Bucket[], history: History[]): string | null {
  const value = normalize(label);
  const preferredRules = [
    { matches: /\b(panvel|mocaccino|mufato|muffato|acai|atacadao)\b/.test(value) || /^mercado\b/.test(value), bucket: /\bbuffer\b/ },
    { matches: /\b(ifood|lanchonete|restaurante)\b/.test(value), bucket: /\bdelivery\b/ },
  ];
  const preferred = preferredRules.find((rule) => rule.matches);
  if (preferred) {
    const found = buckets.filter((bucket) => preferred.bucket.test(normalize(bucket.name)));
    return found.length === 1 ? found[0].id : null;
  }
  const matches = new Set(history.filter((item) => normalize(item.label) === value && item.allocationBucketId && buckets.some((bucket) => bucket.id === item.allocationBucketId)).map((item) => item.allocationBucketId));
  if (matches.size === 1) return [...matches][0] ?? null;
  const rules = [
    { text: /\b(ifood|rappi|delivery|restaurante|lanchonete|pizza|hamburguer)\b/, bucket: /delivery/ },
    { text: /\b(cinema|netflix|spotify|hbo|lazer|teatro|jogo)\b/, bucket: /lazer/ },
    { text: /\b(mercado livre|amazon|shopee|loja)\b/, bucket: /compras/ },
  ];
  for (const rule of rules) {
    if (!rule.text.test(value)) continue;
    const found = buckets.filter((bucket) => rule.bucket.test(normalize(bucket.name)));
    if (found.length === 1) return found[0].id;
  }
  return null;
}

// Some banks put the amount above the transaction type and payee. In that
// layout, text before an amount belongs to the previous transaction.
function parseAmountFirst(lines: string[], buckets: Bucket[], history: History[]): StatementCandidate[] | null {
  const header = /^[\s&SO0|€£]*-?\s*R\$\s*-?\s*(\d{1,3}(?:\.\d{3})*|\d+),([0-9]{2})\s*-?\s*$/i;
  const hasLayout = lines.some((line, i) => header.test(line) && i + 1 < lines.length && /\b(pix|pagamento|compra|transferencia|debito|credito|deposito)\b/.test(normalize(lines[i + 1])));
  if (!hasLayout) return null;
  const result: StatementCandidate[] = [];
  let date: string | null = null;
  for (let i = 0; i < lines.length && result.length < 100; i++) {
    const foundDate = lines[i].match(datePattern)?.[0];
    if (foundDate) { date = foundDate; continue; }
    const amount = lines[i].match(header);
    if (!amount) continue;
    const details: string[] = [];
    while (i + 1 < lines.length && !header.test(lines[i + 1]) && !datePattern.test(lines[i + 1])) {
      details.push(lines[++i].replace(/\b\d{1,2}:\d{2}\b/g, "").trim());
    }
    const operation = details[0] ?? "";
    const description = details.slice(1).filter(Boolean).join(" ").replace(/^[^\p{L}\p{N}]+/u, "").trim();
    const combined = normalize(details.join(" "));
    if (ignored.test(combined)) continue;
    const amountCents = Number(amount[1].replace(/\./g, "") + amount[2]);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > 2147483647) continue;
    const label = (description || operation || "Descrição não identificada").slice(0, 200);
    const confirmedOutgoing = Boolean(description) && (lines[i - details.length].includes("-") || outgoing.test(normalize(operation)));
    result.push({ label, amountCents, date, bucketId: categoryFor(label, buckets, history), confirmedOutgoing });
  }
  return result;
}

/** OCR only suggests candidates; positive amounts with ambiguous direction require selection. */
export function parseStatementText(text: string, buckets: Bucket[], history: History[]): StatementCandidate[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const amountFirst = parseAmountFirst(lines, buckets, history);
  if (amountFirst) return amountFirst;
  const result: StatementCandidate[] = [];
  let context: string[] = [];
  let date: string | null = null;
  for (const line of lines) {
    const normalized = normalize(line);
    const foundDate = line.match(datePattern)?.[0];
    if (foundDate) date = foundDate;
    const amounts = [...line.matchAll(amountPattern)];
    if (amounts.length !== 1) {
      if (amounts.length > 1) context = [];
      else if (!ignored.test(normalized) && !/^\d/.test(line) && line.length <= 160) context = [...context, line].slice(-2);
      else if (ignored.test(normalized)) context = [];
      continue;
    }
    const amount = amounts[0][0];
    const adjacent = line.replace(amount, " ").replace(datePattern, " ").replace(/[|:]+/g, " ").trim();
    const combined = [adjacent, ...context.reverse()].filter(Boolean).join(" ").trim();
    context = [];
    if (!combined || ignored.test(normalize(combined))) continue;
    const digits = amount.replace(/[^\d,]/g, "").replace(",", "");
    const cents = Number(digits);
    if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 2147483647) continue;
    const confirmedOutgoing = amount.includes("-") || outgoing.test(normalize(combined));
    const label = combined.replace(/\s+/g, " ").slice(0, 200);
    result.push({ label, amountCents: cents, date, bucketId: categoryFor(label, buckets, history), confirmedOutgoing });
    if (result.length >= 100) break;
  }
  return result;
}
