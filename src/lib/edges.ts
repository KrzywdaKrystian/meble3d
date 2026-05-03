import { Project, WardrobeElement } from "../types";

/** Wybiera dwa największe wymiary jako szerokość i wysokość panelu (do liczenia krawędzi). */
function panelDims(el: WardrobeElement): {
  width: number;
  height: number;
} {
  const dims = [el.width, el.height, el.depth].sort((a, b) => b - a);
  return { width: dims[0], height: dims[1] };
}

/**
 * Długość okleiny w mm dla pojedynczego panelu (bez uwzględnienia ilości).
 * Każda zaznaczona krawędź dolicza długość odpowiadającego boku flat-panelu.
 */
export function edgeLengthForElement(el: WardrobeElement): number {
  const { width, height } = panelDims(el);
  let mm = 0;
  if (el.edgeTop) mm += width;
  if (el.edgeBottom) mm += width;
  if (el.edgeLeft) mm += height;
  if (el.edgeRight) mm += height;
  return mm;
}

/** Liczba zaznaczonych krawędzi w panelu (0..4). */
export function edgeCount(el: WardrobeElement): number {
  return (
    (el.edgeTop ? 1 : 0) +
    (el.edgeBottom ? 1 : 0) +
    (el.edgeLeft ? 1 : 0) +
    (el.edgeRight ? 1 : 0)
  );
}

export interface EdgeBandingTotal {
  material: string;
  meters: number;
}

/**
 * Sumuje okleinę po materiale w obrębie projektu, z uwzględnieniem ilości
 * paneli (quantity). Zwraca tablicę pozycji posortowaną malejąco po mb.
 */
export function projectEdgeBandingTotals(
  project: Project
): EdgeBandingTotal[] {
  const map = new Map<string, number>();
  for (const cab of project.cabinets) {
    for (const el of cab.elements) {
      if (el.hidden) continue;
      const lenMm = edgeLengthForElement(el) * el.quantity;
      if (lenMm <= 0) continue;
      const key = (el.edgeMaterial || "ABS 2 mm").trim();
      map.set(key, (map.get(key) ?? 0) + lenMm);
    }
  }
  return Array.from(map.entries())
    .map(([material, mm]) => ({ material, meters: mm / 1000 }))
    .sort((a, b) => b.meters - a.meters);
}

export function projectEdgeBandingMeters(project: Project): number {
  return projectEdgeBandingTotals(project).reduce((s, t) => s + t.meters, 0);
}
