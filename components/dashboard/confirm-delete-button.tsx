"use client";

import { useState } from "react";
import { X } from "lucide-react";
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

export function ConfirmDeleteButton({
  itemLabel,
  ariaLabel,
  onConfirm,
  className = "",
}: {
  itemLabel: string;
  ariaLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={`text-muted-foreground transition-colors hover:text-negative ${className}`}
        aria-label={ariaLabel}
      >
        <X className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir &ldquo;{itemLabel}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita e afeta os dados compartilhados no banco para os
            dois usuários.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
