import { Project, WardrobeElement } from "../types";

interface Panel {
  width: number;
  height: number;
  label: string;
  cabinetName: string;
  thickness: number;
}

/** Wybiera dwa największe wymiary jako szerokość i wysokość panelu. */
function panelDims(el: WardrobeElement): {
  width: number;
  height: number;
} {
  const dims = [el.width, el.height, el.depth].sort((a, b) => b - a);
  return { width: dims[0], height: dims[1] };
}

/** Wyciąga panele z projektu (pomija nóżki i drążki). */
function projectPanels(project: Project): Panel[] {
  const panels: Panel[] = [];
  for (const cab of project.cabinets) {
    for (const el of cab.elements) {
      if (el.hidden) continue;
      if (el.type === "nozka" || el.type === "drazek") continue;
      const { width, height } = panelDims(el);
      // Pomijamy zerowe / ujemne panele – CNC nie ma co z tym zrobić.
      if (width <= 0 || height <= 0) continue;
      for (let i = 0; i < Math.max(0, Math.floor(el.quantity)); i++) {
        panels.push({
          width,
          height,
          label:
            el.name +
            (el.quantity > 1 ? " (" + (i + 1) + "/" + el.quantity + ")" : ""),
          cabinetName: cab.name,
          thickness: el.thickness,
        });
      }
    }
  }
  return panels;
}

/**
 * Buduje minimalny DXF (R12) z prostokątami i etykietami.
 *
 * Każdy panel to 4 linie + tekst. Panele układane są w wiersze - max
 * 2800 mm szerokości na wiersz, z 50 mm odstępem. CNC może to potem
 * przerozłożyć na własne arkusze.
 */
export function buildProjectDxf(project: Project): string {
  const panels = projectPanels(project);
  if (panels.length === 0) {
    return [
      "0",
      "SECTION",
      "2",
      "ENTITIES",
      "0",
      "ENDSEC",
      "0",
      "EOF",
      "",
    ].join("\n");
  }

  const ROW_LIMIT = 2800; // mm
  const GAP = 50;

  const rows: Panel[][] = [];
  let currentRow: Panel[] = [];
  let currentRowWidth = 0;
  for (const p of panels) {
    if (currentRowWidth + p.width + GAP > ROW_LIMIT && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push(p);
    currentRowWidth += p.width + GAP;
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const lines: string[] = [
    "0",
    "SECTION",
    "2",
    "ENTITIES",
  ];

  let cursorY = 0;
  for (const row of rows) {
    let cursorX = 0;
    let rowHeight = 0;
    for (const panel of row) {
      const x0 = cursorX;
      const y0 = cursorY;
      const x1 = cursorX + panel.width;
      const y1 = cursorY + panel.height;
      // 4 linie ramki
      const segs: Array<[number, number, number, number]> = [
        [x0, y0, x1, y0],
        [x1, y0, x1, y1],
        [x1, y1, x0, y1],
        [x0, y1, x0, y0],
      ];
      for (const [sx, sy, ex, ey] of segs) {
        lines.push("0", "LINE", "8", "PANELS", "10", String(sx), "20",
          String(sy), "30", "0", "11", String(ex), "21", String(ey), "31",
          "0");
      }
      // Tekst etykiety w lewym dolnym rogu
      const labelText =
        panel.label +
        " | " +
        Math.round(panel.width) +
        "x" +
        Math.round(panel.height) +
        " t" +
        Math.round(panel.thickness) +
        " (" +
        panel.cabinetName +
        ")";
      lines.push(
        "0",
        "TEXT",
        "8",
        "LABELS",
        "10",
        String(x0 + 20),
        "20",
        String(y0 + 20),
        "30",
        "0",
        "40",
        "40",
        "1",
        labelText
      );
      cursorX += panel.width + GAP;
      rowHeight = Math.max(rowHeight, panel.height);
    }
    cursorY += rowHeight + GAP;
  }

  lines.push("0", "ENDSEC", "0", "EOF", "");
  return lines.join("\n");
}
