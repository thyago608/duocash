import { useSyncExternalStore } from "react";

export type LayoutVariant = "groups" | "summary" | "flow";

export const LAYOUT_VARIANTS: { value: LayoutVariant; label: string }[] = [
  { value: "groups", label: "Grupos" },
  { value: "summary", label: "Resumo mensal" },
  { value: "flow", label: "Fluxo financeiro" },
];

const STORAGE_KEY = "duocash-expense-layout";
const DEFAULT_VARIANT: LayoutVariant = "groups";

type Listener = () => void;
const listeners = new Set<Listener>();

function isValidVariant(value: string | null): value is LayoutVariant {
  return LAYOUT_VARIANTS.some((v) => v.value === value);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): LayoutVariant {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isValidVariant(stored) ? stored : DEFAULT_VARIANT;
}

function getServerSnapshot(): LayoutVariant {
  return DEFAULT_VARIANT;
}

export function useLayoutVariant() {
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setVariant = (next: LayoutVariant) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  };

  return { variant, setVariant };
}
