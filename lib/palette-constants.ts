export type Palette = "blue" | "emerald" | "amber" | "purple" | "mono";

export const PALETTES: { value: Palette; label: string }[] = [
  { value: "blue", label: "Azul" },
  { value: "emerald", label: "Esmeralda" },
  { value: "amber", label: "Âmbar" },
  { value: "purple", label: "Roxo" },
  { value: "mono", label: "Mono" },
];

export const PALETTE_STORAGE_KEY = "duocash-palette";
export const DEFAULT_PALETTE: Palette = "blue";

// Evita flash: aplica a paleta salva no localStorage antes da primeira pintura.
export const PALETTE_BLOCKING_SCRIPT = `(function(){try{var p=window.localStorage.getItem('${PALETTE_STORAGE_KEY}');var valid=${JSON.stringify(PALETTES.map((item) => item.value))};document.documentElement.setAttribute('data-palette', valid.indexOf(p)!==-1?p:'${DEFAULT_PALETTE}');}catch(e){document.documentElement.setAttribute('data-palette','${DEFAULT_PALETTE}');}})();`;
