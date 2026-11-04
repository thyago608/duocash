"use client";

import { Palette as PaletteIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PALETTES, usePalette } from "@/lib/use-palette";

export function PaletteToggle() {
  const { palette, setPalette } = usePalette();
  const currentLabel = PALETTES.find((p) => p.value === palette)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        <PaletteIcon className="size-4" />
        {currentLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PALETTES.map((p) => (
          <DropdownMenuItem key={p.value} onClick={() => setPalette(p.value)}>
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
