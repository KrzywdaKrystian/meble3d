import { useMemo, useState } from "react";
import { useActiveProject } from "../store";
import { ELEMENT_LABELS, WardrobeElement } from "../types";

interface SourceElement {
  el: WardrobeElement;
  cabinetName: string;
}

interface Group {
  key: string;
  name: string;
  type: WardrobeElement["type"];
  width: number;
  height: number;
  depth: number;
  thickness: number;
  material: string;
  quantity: number;
  notes: string[];
  cabinetNames: string[];
}

function groupElements(items: SourceElement[]): Group[] {
  const map = new Map<string, Group>();
  for (const { el, cabinetName } of items) {
    const w = Math.round(el.width);
    const h = Math.round(el.height);
    const d = Math.round(el.depth);
    const key = [el.type, w, h, d, el.thickness, el.material].join("|");
    const existing = map.get(key);
    if (existing) {
      existing.quantity += el.quantity;
      if (el.notes && !existing.notes.includes(el.notes)) {
        existing.notes.push(el.notes);
      }
      if (!existing.name.split(" / ").includes(el.name)) {
        existing.name += " / " + el.name;
      }
      if (!existing.cabinetNames.includes(cabinetName)) {
        existing.cabinetNames.push(cabinetName);
      }
    } else {
      map.set(key, {
        key,
        name: el.name,
        type: el.type,
        width: w,
        height: h,
        depth: d,
        thickness: el.thickness,
        material: el.material,
        quantity: el.quantity,
        notes: el.notes ? [el.notes] : [],
        cabinetNames: [cabinetName],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return b.width * b.height - a.width * a.height;
  });
}

function csvEscape(s: string): string {
  if (/[",\n;]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function PartsList() {
  const project = useActiveProject();
  const [scope, setScope] = useState<"all" | string>("all");

  const cabinetsForScope = useMemo(() => {
    if (scope === "all") return project.cabinets;
    return project.cabinets.filter((c) => c.id === scope);
  }, [project.cabinets, scope]);

  const sourceItems: SourceElement[] = useMemo(() => {
    return cabinetsForScope.flatMap((c) =>
      c.elements.map((el) => ({ el, cabinetName: c.name }))
    );
  }, [cabinetsForScope]);

  const groups = useMemo(() => groupElements(sourceItems), [sourceItems]);

  const totalPieces = groups.reduce((s, g) => s + g.quantity, 0);
  const boardArea = useMemo(() => {
    let mm2 = 0;
    for (const g of groups) {
      const dims = [g.width, g.height, g.depth].sort((a, b) => b - a);
      mm2 += dims[0] * dims[1] * g.quantity;
    }
    return mm2 / 1_000_000;
  }, [groups]);

  const exportCsv = () => {
    const showCabinet = project.cabinets.length > 1 && scope === "all";
    const header = [
      "Lp.",
      "Nazwa",
      "Typ",
      ...(showCabinet ? ["Szafa / moduł"] : []),
      "Szerokość [mm]",
      "Wysokość [mm]",
      "Głębokość [mm]",
      "Grubość [mm]",
      "Sztuk",
      "Materiał",
      "Notatki",
    ];
    const rows = groups.map((g, i) => [
      String(i + 1),
      g.name,
      ELEMENT_LABELS[g.type],
      ...(showCabinet ? [g.cabinetNames.join(" / ")] : []),
      String(g.width),
      String(g.height),
      String(g.depth),
      String(g.thickness),
      String(g.quantity),
      g.material,
      g.notes.join("; "),
    ]);
    const csv =
      "﻿" +
      [header, ...rows].map((r) => r.map(csvEscape).join(";")).join("\n");
    const scopeName =
      scope === "all"
        ? project.name
        : project.name +
          "_" +
          (project.cabinets.find((c) => c.id === scope)?.name ?? "szafa");
    const safeName = (scopeName || "szafa").replace(/[^\w\-]+/g, "_");
    downloadFile(
      safeName + "_lista_elementow.csv",
      csv,
      "text/csv;charset=utf-8"
    );
  };

  const printList = () => {
    window.print();
  };

  const showCabinetCol = project.cabinets.length > 1 && scope === "all";

  return (
    <div className="panel-content">
      {project.cabinets.length > 1 && (
        <div className="form">
          <div className="form-row">
            <label className="field">
              <span className="field-label">Zakres listy</span>
              <span className="field-input">
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="all">
                    Cały projekt ({project.cabinets.length} szaf)
                  </option>
                  {project.cabinets.map((c) => (
                    <option key={c.id} value={c.id}>
                      Tylko: {c.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="parts-summary">
        <div>
          <div className="metric-label">Pozycji</div>
          <div className="metric-value">{groups.length}</div>
        </div>
        <div>
          <div className="metric-label">Sztuk łącznie</div>
          <div className="metric-value">{totalPieces}</div>
        </div>
        <div>
          <div className="metric-label">Powierzchnia płyt</div>
          <div className="metric-value">{boardArea.toFixed(2)} m²</div>
        </div>
      </div>

      <div className="parts-actions no-print">
        <button className="btn primary" onClick={exportCsv}>
          Pobierz CSV
        </button>
        <button className="btn ghost" onClick={printList}>
          Drukuj / PDF
        </button>
      </div>

      <div className="parts-table-wrap">
        <table className="parts-table">
          <thead>
            <tr>
              <th>Lp.</th>
              <th>Nazwa</th>
              {showCabinetCol && <th className="hide-mobile">Szafa</th>}
              <th>Wymiary [mm]</th>
              <th>Sztuk</th>
              <th>Materiał</th>
              <th className="hide-mobile">Notatki</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr key={g.key}>
                <td>{i + 1}</td>
                <td>
                  <strong>{g.name}</strong>
                  <br />
                  <small>{ELEMENT_LABELS[g.type]}</small>
                </td>
                {showCabinetCol && (
                  <td className="hide-mobile">
                    <small>{g.cabinetNames.join(", ")}</small>
                  </td>
                )}
                <td>
                  {g.width} × {g.height} × {g.depth}
                  <br />
                  <small>grubość {g.thickness} mm</small>
                </td>
                <td className="num">{g.quantity}</td>
                <td>{g.material}</td>
                <td className="hide-mobile">{g.notes.join("; ")}</td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td
                  colSpan={showCabinetCol ? 7 : 6}
                  className="empty"
                >
                  Brak elementów. Dodaj je w&nbsp;zakładce „Elementy”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
