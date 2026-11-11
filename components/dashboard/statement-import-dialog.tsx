"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { importExpenseLines } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isMarginBucket, type BucketWithEntries } from "@/lib/calculations";
import type { expenseLines } from "@/db/schema";
import { parseStatementText } from "@/lib/statement-ocr";

type Row = { id: string; label: string; amountCents: number; date: string | null; bucketId: string | null; selected: boolean; duplicate: boolean; uncertain: boolean };
export function StatementImportDialog({ monthId, monthLabel, buckets, expenses }: { monthId: string; monthLabel: string; buckets: BucketWithEntries[]; expenses: (typeof expenseLines.$inferSelect)[] }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const categories = buckets.filter((bucket) => bucket.type === "tracked" && !isMarginBucket(bucket));
  const update = (id: string, values: Partial<Row>) => setRows((current) => current?.map((row) => row.id === id ? { ...row, ...values } : row) ?? null);
  const analyze = () => {
    if (!file) return;
    setError("");
    startTransition(async () => {
      try {
        if (file.size > 6 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Escolha uma imagem PNG, JPEG ou WebP de até 6 MB.");
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("por", 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr/core", langPath: "/ocr/lang", workerBlobURL: false });
        let text: string;
        try { text = (await worker.recognize(file)).data.text; } finally { await worker.terminate(); }
        setRecognizedText(text);
        const candidates = parseStatementText(text, categories, expenses);
        const items: Row[] = candidates.map((item) => {
          const duplicate = expenses.some((expense) => expense.amountCents === item.amountCents);
          return { ...item, id: crypto.randomUUID(), selected: item.confirmedOutgoing && !duplicate, duplicate, uncertain: !item.confirmedOutgoing };
        });
        setRows(items);
      } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível analisar a imagem."); }
    });
  };
  const save = () => {
    const selected = rows?.filter((row) => row.selected) ?? [];
    if (!selected.length || selected.some((row) => !row.label.trim() || row.amountCents <= 0)) { setError("Selecione despesas com descrição e valor válidos."); return; }
    setError("");
    startTransition(async () => {
      try {
        await importExpenseLines({ monthId, lines: selected.map((row) => ({ label: row.label.trim(), amountCents: row.amountCents, allocationBucketId: row.bucketId })) });
        toast.success(`${selected.length} despesa(s) cadastrada(s)`); setOpen(false); setRows(null); setFile(null); router.refresh();
      } catch { setError("Não foi possível salvar as despesas. Tente novamente."); }
    });
  };
  return <Dialog open={open} onOpenChange={(value) => { if (!pending) { setOpen(value); if (!value) { setRows(null); setFile(null); setError(""); } } }}>
    <DialogTrigger render={<Button size="sm" variant="outline" />}><ImagePlus className="size-4" />Importar extrato</DialogTrigger>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Importar despesas do extrato</DialogTitle><DialogDescription>As despesas selecionadas serão cadastradas em {monthLabel} como pagas. Confira se o extrato corresponde a esse mês.</DialogDescription></DialogHeader>
      {!rows ? <div className="space-y-3"><p className="text-sm text-muted-foreground">A leitura acontece neste dispositivo, sem enviar a imagem para um serviço externo. Escolha um print PNG, JPEG ou WebP de até 6 MB.</p><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Button type="button" disabled={!file || pending} onClick={analyze}>{pending ? "Analisando..." : "Analisar imagem"}</Button></div> : <div className="space-y-3"><p className="text-sm text-muted-foreground">Confira os valores e categorias. Datas aparecem apenas para conferência e não são salvas. Valores iguais a despesas já cadastradas e movimentos de natureza incerta começam desmarcados. Valores iguais podem ser despesas diferentes. Confira também se alguma despesa não foi identificada.</p>{rows.length === 0 && <p>Nenhuma saída identificada. Tente um print mais nítido.</p>}{rows.map((row) => <div key={row.id} className="space-y-2 rounded-lg border p-3"><div className="flex items-center gap-2"><input type="checkbox" checked={row.selected} onChange={(e) => update(row.id, { selected: e.target.checked })} aria-label={`Selecionar ${row.label}`} /><span className="text-xs text-muted-foreground">{row.date || "Data não identificada"}{row.duplicate ? " · Possível duplicata" : ""}{row.uncertain ? " · Confira se é saída" : ""}</span></div><div className="grid gap-2 sm:grid-cols-2"><Input aria-label="Descrição" value={row.label} onChange={(e) => update(row.id, { label: e.target.value })} /><CurrencyInput aria-label="Valor" valueCents={row.amountCents} onValueChange={(amountCents) => update(row.id, { amountCents })} /><select aria-label="Categoria" className="h-10 rounded-md border bg-background px-3 text-sm sm:col-span-2" value={row.bucketId ?? ""} onChange={(e) => update(row.id, { bucketId: e.target.value || null })}><option value="">Sem alocação</option>{categories.map((bucket) => <option key={bucket.id} value={bucket.id}>{bucket.name}</option>)}</select></div></div>)}<Button type="button" variant="outline" onClick={() => setRows((current) => [...(current ?? []), { id: crypto.randomUUID(), label: "", amountCents: 0, date: null, bucketId: null, selected: true, duplicate: false, uncertain: false }])}>Adicionar despesa manualmente</Button><details className="text-sm"><summary className="cursor-pointer">Ver texto identificado</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">{recognizedText || "Nenhum texto identificado."}</pre></details></div>}
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      {rows && <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setRows(null)}>Escolher outro print</Button><Button type="button" disabled={pending || !rows.some((row) => row.selected)} onClick={save}>{pending ? "Salvando..." : "Cadastrar selecionadas"}</Button></DialogFooter>}
    </DialogContent>
  </Dialog>;
}
