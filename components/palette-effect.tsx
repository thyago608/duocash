"use client";

import { useEffect } from "react";
import { usePalette } from "@/lib/use-palette";

export function PaletteEffect() {
  const { palette } = usePalette();

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
  }, [palette]);

  return null;
}
