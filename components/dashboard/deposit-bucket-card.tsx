"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GlossaryHint } from "@/components/dashboard/glossary-hint";
import { formatCents } from "@/lib/money";
import { bucketColorClasses } from "@/lib/colors";
import { glossaryForBucket } from "@/lib/glossary";
import { toggleBucketDeposited } from "@/app/(app)/dashboard/actions";
import type { BucketWithEntries } from "@/lib/calculations";

export function DepositBucketCard({ bucket }: { bucket: BucketWithEntries }) {
  const [isDeposited, setIsDeposited] = useState(bucket.isDeposited);
  const [, startTransition] = useTransition();
  const colors = bucketColorClasses(bucket.color);
  const glossary = glossaryForBucket(bucket);

  const handleToggle = (checked: boolean) => {
    const previous = isDeposited;
    setIsDeposited(checked);

    startTransition(async () => {
      try {
        await toggleBucketDeposited(bucket.id, checked);
        toast.success(checked ? "Depósito confirmado" : "Marcação removida");
      } catch {
        setIsDeposited(previous);
        toast.error("Não foi possível salvar. Tente novamente.");
      }
    });
  };

  return (
    <Card className="relative overflow-hidden border-border/60">
      <span className={`absolute inset-x-0 top-0 h-1 ${colors.accent}`} aria-hidden />
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full text-base ${colors.iconBg}`}
            >
              {bucket.icon}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{bucket.name}</span>
              {glossary && <GlossaryHint title={glossary.title} text={glossary.text} />}
            </span>
          </span>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {formatCents(bucket.budgetCents)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2">
            {isDeposited && <Check className="size-4 text-positive" />}
            {isDeposited ? "Depósito feito na conta reserva" : "Depósito ainda não feito"}
          </span>
          <Switch
            checked={isDeposited}
            onCheckedChange={(checked) => handleToggle(checked === true)}
          />
        </label>
      </CardContent>
    </Card>
  );
}
