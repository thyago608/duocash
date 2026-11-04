import { useSyncExternalStore } from "react";
import {
  type Palette,
  PALETTES,
  PALETTE_STORAGE_KEY as STORAGE_KEY,
  DEFAULT_PALETTE,
} from "@/lib/palette-constants";

type Listener = () => void;
const listeners = new Set<Listener>();

function isValidPalette(value: string | null): value is Palette {
  return PALETTES.some((p) => p.value === value);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Palette {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isValidPalette(stored) ? stored : DEFAULT_PALETTE;
}

function getServerSnapshot(): Palette {
  return DEFAULT_PALETTE;
}

export function usePalette() {
  const palette = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPalette = (next: Palette) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  };

  return { palette, setPalette };
}

export { PALETTES };
