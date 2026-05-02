export type ElementType =
  | "bok"
  | "wieniec"
  | "polka"
  | "plecy"
  | "drzwi"
  | "front-szuflady"
  | "drazek"
  | "cokol"
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

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  elements: WardrobeElement[];
  /** Wymiary gabarytowe szafy w mm – służą tylko do podpowiedzi/podglądu */
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
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
  inny: 18,
};
