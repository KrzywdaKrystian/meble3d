import { useMemo, useState } from "react";
import { useActiveProject, useStore } from "../store";
import { ELEMENT_LABELS, WardrobeElement } from "../types";
import {
  computeHardwareForProject,
  hardwareLineTotal,
  hardwareSubtotal,
} from "../lib/hardware";
import { buildQuote, formatPLN } from "../lib/pricing";

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
  const pricing = useStore((s) => s.pricing);
  const setPricing = useStore((s) => s.setPricing);
  const [scope, setScope] = useState<"all" | string>("all");

  const hardware = useMemo(
    () => computeHardwareForProject(project),
    [project]
  );
  const hardwareSum = hardwareSubtotal(hardware);
  const quote = useMemo(
    () => buildQuote(project, pricing),
    [project, pricing]
  );

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
        <div className="form no-print">
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
        <button className="btn primary" onClick={printList}>
          Eksport PDF (drukuj)
        </button>
        <button className="btn ghost" onClick={exportCsv}>
          Pobierz CSV
        </button>
      </div>

      <div className="form-section-title no-print">Lista okuć (auto)</div>
      <div className="parts-table-wrap no-print">
        <table className="parts-table">
          <thead>
            <tr>
              <th>Pozycja</th>
              <th>Sztuk</th>
              <th>Cena</th>
              <th className="hide-mobile">Wartość</th>
            </tr>
          </thead>
          <tbody>
            {hardware.map((h, i) => (
              <tr key={h.kind + i}>
                <td>
                  <strong>{h.name}</strong>
                  {h.sourceCabinetName && (
                    <>
                      <br />
                      <small>{h.sourceCabinetName}</small>
                    </>
                  )}
                </td>
                <td className="num">{h.quantity}</td>
                <td>{formatPLN(h.pricePerUnit)}</td>
                <td className="hide-mobile">
                  {formatPLN(hardwareLineTotal(h))}
                </td>
              </tr>
            ))}
            {hardware.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  Brak okuć – dodaj drzwi, szuflady lub półki w szafach.
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} style={{ textAlign: "right", fontWeight: 600 }}>
                Razem:
              </td>
              <td className="num hide-mobile">{formatPLN(hardwareSum)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="form-section-title no-print">Wycena projektu</div>
      <div className="form no-print">
        <div className="form-row grid-3">
          <label className="field">
            <span className="field-label">Płyta [PLN/m²]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={pricing.defaultBoardPricePerM2}
                onChange={(e) =>
                  setPricing({
                    defaultBoardPricePerM2:
                      parseFloat(e.target.value) || 0,
                  })
                }
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Robocizna / szafa</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={pricing.laborPerCabinet}
                onChange={(e) =>
                  setPricing({
                    laborPerCabinet: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Marża [%]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={pricing.marginPercent}
                onChange={(e) =>
                  setPricing({
                    marginPercent: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </span>
          </label>
        </div>
        <div className="form-row grid-3">
          <label className="field">
            <span className="field-label">VAT [%]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={pricing.vatPercent}
                onChange={(e) =>
                  setPricing({
                    vatPercent: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Płyta szer. [mm]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={pricing.sheetWidth}
                onChange={(e) =>
                  setPricing({
                    sheetWidth: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Płyta wys. [mm]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={pricing.sheetHeight}
                onChange={(e) =>
                  setPricing({
                    sheetHeight: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </span>
          </label>
        </div>
      </div>

      <div className="parts-table-wrap no-print">
        <table className="parts-table">
          <tbody>
            <tr>
              <td>Płyta ({quote.boardAreaM2.toFixed(2)} m², {quote.sheetCount} szt.)</td>
              <td className="num">{formatPLN(quote.boardCost)}</td>
            </tr>
            <tr>
              <td>Okucia</td>
              <td className="num">{formatPLN(quote.hardwareCost)}</td>
            </tr>
            <tr>
              <td>Robocizna ({project.cabinets.length} szafy)</td>
              <td className="num">{formatPLN(quote.laborCost)}</td>
            </tr>
            <tr>
              <td>Marża {pricing.marginPercent}%</td>
              <td className="num">{formatPLN(quote.margin)}</td>
            </tr>
            <tr>
              <td>
                <strong>Netto</strong>
              </td>
              <td className="num">
                <strong>{formatPLN(quote.net)}</strong>
              </td>
            </tr>
            <tr>
              <td>VAT {pricing.vatPercent}%</td>
              <td className="num">{formatPLN(quote.vat)}</td>
            </tr>
            <tr>
              <td>
                <strong>Brutto</strong>
              </td>
              <td className="num">
                <strong style={{ fontSize: 16 }}>
                  {formatPLN(quote.total)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
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
