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
  /** Obrót elementu w stopniach wokół osi X / Y / Z (środek = środek elementu). */
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  /** Oklejenie krawędzi ABS – po jednej fladze na krawędź panelu (widok flat). */
  edgeTop?: boolean;
  edgeBottom?: boolean;
  edgeLeft?: boolean;
  edgeRight?: boolean;
  /** Materiał oklejenia (np. „ABS 2 mm biały"). Wspólny dla wszystkich krawędzi panelu. */
  edgeMaterial?: string;
}

/**
 * Przyleganie szafy do ściany pomieszczenia.
 * Pozycja i rotacja szafy są wtedy wyliczane z layoutu pomieszczenia
 * - tył szafy jest dosunięty do wybranej ściany.
 */
export interface CabinetAnchor {
  wall: WallSide;
  /** Offset lewego boku szafy od „lewej" krawędzi ściany (jak patrzysz od wewnątrz). */
  offset: number;
  /** Odsunięcie tylnej ścianki szafy od wewnętrznej ściany pomieszczenia (mm). */
  gap?: number;
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
  /** Manualny obrót szafy wokół Y w stopniach (gdy nie jest anchored). */
  rotationY?: number;
  /** Przyleganie do ściany pomieszczenia – nadpisuje offsetX/Z + rotationY. */
  anchor?: CabinetAnchor;
  /** Wymiary gabarytowe szafy w mm */
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  /** Konfiguracja cokołu w obrębie tej szafy */
  plinthType?: PlinthType;
  plinthHeight?: number;
  plinthRecess?: number;
  /**
   * Czy boki sięgają do samej podłogi.
   * - true  – boki na całą wysokość szafy, cokół wpasowany między nimi,
   * - false (domyślnie) – boki kończą się na wysokości cokołu, cokół
   *   przebiega pod całą szerokością.
   */
  sideToFloor?: boolean;
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
  layout?: RoomLayout;
}

export type WallSide = "N" | "E" | "S" | "W";

export const WALL_LABELS: Record<WallSide, string> = {
  N: "Tylna",
  S: "Przednia (od wejścia)",
  W: "Lewa",
  E: "Prawa",
};

/**
 * Biblioteka materiałów płytowych / okleinowych. Każda pozycja ma swoją
 * cenę za m² (płyta) lub za mb (okleina). Stosowane do wyceny.
 */
export interface MaterialPreset {
  id: string;
  name: string;
  thickness: number;
  /** "plyta" – cena za m²; "okleina" – cena za mb; "akcesoria" – cena za szt. */
  unit: "plyta" | "okleina" | "akcesoria";
  pricePerUnit: number;
  /** Skrócona nota dla stolarza (np. kolor, kod producenta). */
  note?: string;
}

export const DEFAULT_MATERIALS: MaterialPreset[] = [
  {
    id: "egger-h1180-18",
    name: "Egger H1180 ST37 Sonoma jasna",
    thickness: 18,
    unit: "plyta",
    pricePerUnit: 95,
    note: "Płyta wiórowa laminowana 18 mm",
  },
  {
    id: "egger-w1000-18",
    name: "Egger W1000 ST9 Premium biała",
    thickness: 18,
    unit: "plyta",
    pricePerUnit: 110,
    note: "Płyta wiórowa laminowana 18 mm",
  },
  {
    id: "kronopol-k001-18",
    name: "Kronopol K001 Białe Premium",
    thickness: 18,
    unit: "plyta",
    pricePerUnit: 90,
    note: "Płyta wiórowa laminowana 18 mm",
  },
  {
    id: "pfleiderer-r4262-18",
    name: "Pfleiderer R4262 Dąb sonoma",
    thickness: 18,
    unit: "plyta",
    pricePerUnit: 100,
    note: "Płyta laminowana 18 mm",
  },
  {
    id: "hdf-3-bialy",
    name: "HDF biały 3 mm",
    thickness: 3,
    unit: "plyta",
    pricePerUnit: 35,
    note: "Plecy, dna szuflad",
  },
  {
    id: "rurka-25-chrom",
    name: "Rurka chromowana Ø25 mm",
    thickness: 25,
    unit: "okleina",
    pricePerUnit: 18,
    note: "Drążek na ubrania",
  },
  {
    id: "abs-2-bialy",
    name: "Okleina ABS 2 mm biała",
    thickness: 2,
    unit: "okleina",
    pricePerUnit: 4,
    note: "Krawędzie widoczne",
  },
  {
    id: "abs-1-bialy",
    name: "Okleina ABS 1 mm biała",
    thickness: 1,
    unit: "okleina",
    pricePerUnit: 2.5,
    note: "Krawędzie wewnętrzne",
  },
];

/**
 * Typy okuć / akcesoriów które dolatują do listy zakupowej automatycznie
 * na podstawie elementów szafy.
 */
export type HardwareKind =
  | "zawias"
  | "prowadnica-szuflady"
  | "uchwyt-meblowy"
  | "wieszak-drazek"
  | "kolek"
  | "konfirmat"
  | "ekscentr"
  | "stopa-regulowana"
  | "stopa-ozdobna"
  | "wkret"
  | "inne";

export const HARDWARE_LABELS: Record<HardwareKind, string> = {
  zawias: "Zawias puszkowy 35 mm",
  "prowadnica-szuflady": "Prowadnica szuflady",
  "uchwyt-meblowy": "Uchwyt meblowy",
  "wieszak-drazek": "Wieszak drążka (komplet)",
  kolek: "Kołek montażowy 8 mm",
  konfirmat: "Konfirmat 7 × 50",
  ekscentr: "Ekscentr + kołek",
  "stopa-regulowana": "Stopa regulowana ABS / metal",
  "stopa-ozdobna": "Stopa ozdobna drewniana",
  wkret: "Wkręt 3,5 × 16",
  inne: "Inne",
};

export interface HardwareItem {
  kind: HardwareKind;
  /** Nazwa robocza (np. „Zawias do drzwi lewych"). */
  name: string;
  quantity: number;
  pricePerUnit: number;
  notes?: string;
  /** Z którego elementu / szafy pochodzi pozycja (informacyjnie). */
  sourceCabinetName?: string;
}

export const DEFAULT_HARDWARE_PRICES: Record<HardwareKind, number> = {
  zawias: 4.5,
  "prowadnica-szuflady": 35,
  "uchwyt-meblowy": 8,
  "wieszak-drazek": 12,
  kolek: 0.2,
  konfirmat: 0.5,
  ekscentr: 1.2,
  "stopa-regulowana": 6,
  "stopa-ozdobna": 25,
  wkret: 0.1,
  inne: 0,
};

/** Globalne ustawienia wyceny dla projektu / przestrzeni. */
export interface PricingSettings {
  /** Wymiar standardowej płyty roboczej w mm (do estymacji % odpadu). */
  sheetWidth: number;
  sheetHeight: number;
  /** Cena netto za m² płyty głównej (gdy element nie ma własnego materiału). */
  defaultBoardPricePerM2: number;
  /** Marża stolarza (%). */
  marginPercent: number;
  /** Stawka VAT (%). */
  vatPercent: number;
  /** Robocizna ryczałtowa per szafa (PLN). */
  laborPerCabinet: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  sheetWidth: 2800,
  sheetHeight: 2070,
  defaultBoardPricePerM2: 95,
  marginPercent: 30,
  vatPercent: 23,
  laborPerCabinet: 250,
};

export interface RoomOpening {
  id: string;
  wall: WallSide;
  kind: "door" | "window";
  /** Offset w mm od początku ściany (od lewej, patrząc od wewnątrz). */
  offset: number;
  width: number;
  height: number;
  /** Wysokość parapetu nad podłogą; drzwi = 0, okno typowo 900. */
  sillHeight: number;
}

export interface RoomAlcove {
  id: string;
  wall: WallSide;
  /** Offset wnęki w mm od początku ściany. */
  offset: number;
  /** Szerokość wnęki wzdłuż ściany. */
  width: number;
  /** Głębokość wnęki w mm (na zewnątrz pomieszczenia). */
  depth: number;
}

export interface RoomLayout {
  /** Wewnętrzny wymiar w mm (X, lewy-prawy). */
  width: number;
  /** Wewnętrzny wymiar w mm (Z, przód-tył). */
  depth: number;
  /** Wysokość w mm (od podłogi do sufitu). */
  height: number;
  /** Grubość ścian w mm. */
  wallThickness: number;
  /** Master-toggle: pozwala wyłączyć pomieszczenie bez utraty danych. */
  enabled: boolean;
  openings: RoomOpening[];
  alcoves: RoomAlcove[];
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
