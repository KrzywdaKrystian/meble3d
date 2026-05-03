import { Project, WardrobeElement } from "../types";

export interface NestingPanel {
  id: string;
  width: number;
  height: number;
  label: string;
  thickness: number;
  material: string;
}

export interface PlacedPanel extends NestingPanel {
  x: number;
  y: number;
  rotated: boolean;
}

export interface PackedSheet {
  index: number;
  width: number;
  height: number;
  panels: PlacedPanel[];
  /** Powierzchnia wykorzystana / powierzchnia płyty * 100. */
  usagePercent: number;
}

export interface NestingResult {
  /** Materiał + grubość – jeden zestaw arkuszy per kombinacja. */
  groupKey: string;
  material: string;
  thickness: number;
  sheets: PackedSheet[];
  totalArea: number;
  unplaced: NestingPanel[];
}

const DEFAULT_KERF = 3; // mm

function panelDims(el: WardrobeElement): {
  width: number;
  height: number;
} {
  const dims = [el.width, el.height, el.depth].sort((a, b) => b - a);
  return { width: dims[0], height: dims[1] };
}

export function projectPanelsForNesting(project: Project): NestingPanel[] {
  const out: NestingPanel[] = [];
  for (const cab of project.cabinets) {
    for (const el of cab.elements) {
      if (el.hidden) continue;
      if (el.type === "nozka" || el.type === "drazek") continue;
      const { width, height } = panelDims(el);
      if (width <= 0 || height <= 0) continue;
      for (let i = 0; i < Math.max(0, Math.floor(el.quantity)); i++) {
        out.push({
          id: el.id + "-" + i,
          width,
          height,
          thickness: el.thickness,
          material: el.material || "Płyta meblowa 18 mm",
          label:
            el.name + (el.quantity > 1 ? " " + (i + 1) + "/" + el.quantity : ""),
        });
      }
    }
  }
  return out;
}

interface Shelf {
  y: number;
  height: number;
  cursorX: number;
}

/**
 * Pakuje panele algorytmem „Shelf Best-Width-Fit" – warianty bez rotacji.
 * Daje deterministyczny układ horyzontalnych pasów cięcia, zgodny z tym
 * jak stolarz tnie płytę na piłach panelowych.
 */
function shelfPack(
  panels: NestingPanel[],
  sheetW: number,
  sheetH: number,
  kerf: number = DEFAULT_KERF
): { sheets: PackedSheet[]; unplaced: NestingPanel[] } {
  // Sortujemy po większym wymiarze – tak żeby w pierwszej kolejności kłaść
  // panele najwyższe (po ewentualnej rotacji) i lepiej wykorzystać arkusz.
  const sorted = [...panels].sort(
    (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height)
  );
  const sheets: { shelves: Shelf[]; placed: PlacedPanel[] }[] = [];
  const unplaced: NestingPanel[] = [];

  for (const original of sorted) {
    // Spróbuj orientacji oryginalnej i obróconej; wybierz tę, która lepiej
    // pasuje do arkusza (mniejsza wysokość preferowana, chyba że niedopuszczalna).
    const candidates: NestingPanel[] = [];
    if (
      original.width + kerf * 2 <= sheetW &&
      original.height + kerf * 2 <= sheetH
    ) {
      candidates.push(original);
    }
    if (
      original.height + kerf * 2 <= sheetW &&
      original.width + kerf * 2 <= sheetH
    ) {
      candidates.push({
        ...original,
        width: original.height,
        height: original.width,
      });
    }
    if (candidates.length === 0) {
      unplaced.push(original);
      continue;
    }
    // Wybierz orientację o mniejszej wysokości (efektywniejsze pakowanie półek).
    candidates.sort((a, b) => a.height - b.height);
    const p = candidates[0];
    const rotated = p.width !== original.width || p.height !== original.height;
    let placed = false;
    for (const sheet of sheets) {
      // próbuj zmieścić w istniejącej półce
      let bestShelf: Shelf | null = null;
      let bestRemaining = Infinity;
      for (const sh of sheet.shelves) {
        if (
          p.height + kerf * 2 <= sh.height &&
          sh.cursorX + p.width + kerf <= sheetW
        ) {
          const rem = sh.height - (p.height + kerf * 2);
          if (rem < bestRemaining) {
            bestRemaining = rem;
            bestShelf = sh;
          }
        }
      }
      if (bestShelf) {
        sheet.placed.push({
          ...p,
          x: bestShelf.cursorX + kerf,
          y: bestShelf.y + kerf,
          rotated,
        });
        bestShelf.cursorX += p.width + kerf * 2;
        placed = true;
        break;
      }
      // utwórz nową półkę nad istniejącymi
      const lastY = sheet.shelves.reduce(
        (mx, s) => Math.max(mx, s.y + s.height),
        0
      );
      const newShelfHeight = p.height + kerf * 2;
      if (lastY + newShelfHeight <= sheetH) {
        const sh: Shelf = {
          y: lastY,
          height: newShelfHeight,
          cursorX: p.width + kerf * 2,
        };
        sheet.shelves.push(sh);
        sheet.placed.push({ ...p, x: kerf, y: lastY + kerf, rotated });
        placed = true;
        break;
      }
    }
    if (!placed) {
      const newSheet = { shelves: [] as Shelf[], placed: [] as PlacedPanel[] };
      const sh: Shelf = {
        y: 0,
        height: p.height + kerf * 2,
        cursorX: p.width + kerf * 2,
      };
      newSheet.shelves.push(sh);
      newSheet.placed.push({ ...p, x: kerf, y: kerf, rotated });
      sheets.push(newSheet);
    }
  }

  const sheetArea = sheetW * sheetH;
  return {
    sheets: sheets.map((s, idx) => {
      const used = s.placed.reduce(
        (a, p) => a + p.width * p.height,
        0
      );
      return {
        index: idx + 1,
        width: sheetW,
        height: sheetH,
        panels: s.placed,
        usagePercent: (used / sheetArea) * 100,
      };
    }),
    unplaced,
  };
}

export function nestProject(
  project: Project,
  sheetW: number,
  sheetH: number,
  kerf: number = DEFAULT_KERF
): NestingResult[] {
  const panels = projectPanelsForNesting(project);
  // Grupuj po (materiał + grubość) - osobny rozkrój per płyta robocza.
  const groups = new Map<string, NestingPanel[]>();
  for (const p of panels) {
    const key = p.material + " | " + p.thickness + " mm";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const results: NestingResult[] = [];
  for (const [key, list] of groups.entries()) {
    const { sheets, unplaced } = shelfPack(list, sheetW, sheetH, kerf);
    const totalArea = list.reduce(
      (s, p) => s + (p.width * p.height) / 1_000_000,
      0
    );
    results.push({
      groupKey: key,
      material: list[0].material,
      thickness: list[0].thickness,
      sheets,
      totalArea,
      unplaced,
    });
  }
  return results;
}
