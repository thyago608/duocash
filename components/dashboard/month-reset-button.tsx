"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { clearMonthMarks } from "@/app/(app)/dashboard/actions";

export function MonthResetButton({
  monthId,
  monthLabel,
}: {
  monthId: string;
  monthLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await clearMonthMarks(monthId);
        toast.success(`Marcações de ${monthLabel} limpas`);
        setOpen(false);
      } catch {
        toast.error("Não foi possível limpar. Tente novamente.");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        Limpar marcações de {monthLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar marcações de {monthLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso vai desmarcar todos os itens pagos/recebidos e depósitos de reserva deste mês
            para os dois usuários — Thyago e Thayla. A ação afeta os dados compartilhados no
            banco, não apenas este navegador.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? "Limpando..." : "Limpar mês"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
