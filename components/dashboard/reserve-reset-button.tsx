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
import { clearReserveWithdrawals } from "@/app/(app)/dashboard/actions";

export function ReserveResetButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await clearReserveWithdrawals();
        toast.success("Retiradas da reserva limpas");
        setOpen(false);
      } catch {
        toast.error("Não foi possível limpar. Tente novamente.");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        Limpar só a reserva
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar retiradas da reserva?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso vai apagar todo o histórico de retiradas/uso da reserva para os dois
            usuários — Thyago e Thayla. Os depósitos confirmados não são afetados. A ação
            afeta os dados compartilhados no banco, não apenas este navegador.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? "Limpando..." : "Limpar reserva"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
