"use client";

import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function GlossaryHint({ title, text }: { title: string; text: string }) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`O que é: ${title}`}
      >
        <HelpCircle className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="text-sm">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
