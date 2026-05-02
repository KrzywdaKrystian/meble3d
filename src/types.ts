export type ElementType =
  | "bok"
  | "wieniec"
  | "polka"
  | "plecy"
  | "drzwi"
  | "front-szuflady"
  | "drazek"
  | "cokol"
  | "nozka"
  | "inny";

export interface WardrobeElement {
  id: string;
  type: ElementType;
  name: string;
  /** Wymiary w milimetrach: szerokość (X), wysokość (Y), głębokość (Z) */
  width: number;
  height: number;
  depth: number;
  /** Pozycja środka elementu w milimetrach (0,0,0 = środek-dół szafy na podłodze) */
  x: number;
  y: number;
  z: number;
  /** Grubość materiału w milimetrach (informacyjnie do listy elementów) */
  thickness: number;
  material: string;
  color: string;
  quantity: number;
  notes?: string;
  hidden?: boolean;
}

/**
 * Pojedyncza szafa / moduł / zabudowa stojąca w obrębie projektu.
 * Projekt może zawierać wiele szaf ustawionych obok siebie.
 */
export interface Cabinet {
  id: string;
  name: string;
  /** Przesunięcie środka szafy w mm względem środka projektu (X = lewo/prawo) */
  offsetX: number;
  /** Y w mm: przydatne dla szafek wiszących (domyślnie 0 = na podłodze) */
  offsetY: number;
  /** Z w mm: korekta głębokości jeśli moduły różnią się głębokością */
  offsetZ: number;
  /** Wymiary gabarytowe szafy w mm */
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  /** Konfiguracja cokołu w obrębie tej szafy */
  plinthType?: PlinthType;
  plinthHeight?: number;
  plinthRecess?: number;
  elements: WardrobeElement[];
}

export interface Project {
  id: string;
  roomId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  cabinets: Cabinet[];
}

export type PlinthType =
  | "staly"
  | "regulowany"
  | "cofniety"
  | "brak"
  | "systemowy";

export const PLINTH_LABELS: Record<PlinthType, string> = {
  staly: "Stały (zabudowany)",
  regulowany: "Regulowany (nóżki + maskownica)",
  cofniety: "Cofnięty (shadow gap)",
  brak: "Brak / na nóżkach ozdobnych",
  systemowy: "Systemowy (PVC / aluminium)",
};

export const PLINTH_DESCRIPTIONS: Record<PlinthType, string> = {
  staly:
    "Pełna listwa zabudowana, przymocowana na stałe do korpusu. Solidny i klasyczny wygląd, maskuje przestrzeń pod szafą.",
  regulowany:
    "4 regulowane nóżki + zatrzaskowa maskownica frontowa. Pozwala wypoziomować szafę na nierównej podłodze.",
  cofniety:
    "Listwa cofnięta o kilka cm pod korpus, dająca efekt unoszenia się szafy nad podłogą („shadow gap”).",
  brak:
    "Bez listwy cokołowej. Korpus stoi na ozdobnych nóżkach – łatwiej posprzątać, lekki designerski efekt.",
  systemowy:
    "Listwa systemowa z PVC / aluminium na regulowanych nóżkach. Typowe rozwiązanie do kuchni i zabudów.",
};

export interface Room {
  id: string;
  name: string;
  createdAt: number;
}

export const ELEMENT_LABELS: Record<ElementType, string> = {
  bok: "Bok",
  wieniec: "Wieniec",
  polka: "Półka",
  plecy: "Plecy",
  drzwi: "Drzwi",
  "front-szuflady": "Front szuflady",
  drazek: "Drążek",
  cokol: "Cokół",
  nozka: "Nóżka",
  inny: "Inny",
};

export const ELEMENT_DEFAULT_COLOR: Record<ElementType, string> = {
  bok: "#c9a574",
  wieniec: "#c9a574",
  polka: "#d6b988",
  plecy: "#a78a5c",
  drzwi: "#b89568",
  "front-szuflady": "#b89568",
  drazek: "#b0b0b0",
  cokol: "#8a6f4a",
  nozka: "#3a3a3a",
  inny: "#9ca3af",
};

export const ELEMENT_DEFAULT_THICKNESS: Record<ElementType, number> = {
  bok: 18,
  wieniec: 18,
  polka: 18,
  plecy: 3,
  drzwi: 18,
  "front-szuflady": 18,
  drazek: 25,
  cokol: 18,
  nozka: 50,
  inny: 18,
};
