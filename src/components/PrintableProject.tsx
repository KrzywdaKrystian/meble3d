import {
  useActiveProject,
  useActiveRoom,
  useActiveRoomLayout,
  useStore,
} from "../store";
import { ELEMENT_LABELS, PLINTH_LABELS } from "../types";
import {
  computeHardwareForProject,
  hardwareLineTotal,
  hardwareSubtotal,
} from "../lib/hardware";
import { buildQuote, formatPLN } from "../lib/pricing";
import { projectEdgeBandingTotals } from "../lib/edges";
import { Plan2D } from "./Plan2D";
import { PartsList } from "./PartsList";
import { TechnicalDrawings } from "./TechnicalDrawings";

export function PrintableProject() {
  const project = useActiveProject();
  const room = useActiveRoom();
  const layout = useActiveRoomLayout();
  const pricing = useStore((s) => s.pricing);
  const hardware = computeHardwareForProject(project);
  const hardwareSum = hardwareSubtotal(hardware);
  const quote = buildQuote(project, pricing);
  const edgeTotals = projectEdgeBandingTotals(project);
  const edgeMetersTotal = edgeTotals.reduce((s, e) => s + e.meters, 0);
  const totalElements = project.cabinets.reduce(
    (s, c) => s + c.elements.length,
    0
  );

  const today = new Date().toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="printable">
      <section className="print-page print-title-page">
        <div className="print-title-mark">M3D</div>
        <h1 className="print-h1">{project.name}</h1>
        <div className="print-subtitle">Dokumentacja stolarska</div>
        <dl className="print-meta">
          <dt>Przestrzeń:</dt>
          <dd>{room.name}</dd>
          <dt>Liczba szaf / modułów:</dt>
          <dd>{project.cabinets.length}</dd>
          <dt>Liczba elementów łącznie:</dt>
          <dd>{totalElements}</dd>
          {layout?.enabled && (
            <>
              <dt>Pomieszczenie (W × D × H):</dt>
              <dd>
                {layout.width} × {layout.depth} × {layout.height} mm
              </dd>
            </>
          )}
          <dt>Data wydruku:</dt>
          <dd>{today}</dd>
        </dl>
      </section>

      {layout?.enabled && (
        <section className="print-page print-plan-page">
          <h2 className="print-h2">Rzut 2D pomieszczenia</h2>
          <div className="print-plan-wrap">
            <Plan2D />
          </div>
        </section>
      )}

      {project.cabinets.map((cab, idx) => (
        <section key={cab.id} className="print-page print-cabinet-page">
          <h2 className="print-h2">
            {idx + 1}. {cab.name}
          </h2>
          <div className="print-cabinet-meta">
            <span>
              <strong>Wymiary:</strong> {cab.outerWidth} × {cab.outerHeight} ×{" "}
              {cab.outerDepth} mm
            </span>
            {cab.plinthType && (
              <span>
                <strong>Cokół:</strong> {PLINTH_LABELS[cab.plinthType]}
                {cab.plinthHeight ? ` (${cab.plinthHeight} mm)` : ""}
              </span>
            )}
            {cab.sideToFloor !== undefined && (
              <span>
                <strong>Boki:</strong>{" "}
                {cab.sideToFloor ? "do podłogi" : "do wysokości cokołu"}
              </span>
            )}
            <span>
              <strong>Elementów:</strong> {cab.elements.length}
            </span>
          </div>
          <TechnicalDrawings cabinet={cab} />
          <table className="print-elements-table">
            <thead>
              <tr>
                <th>Lp.</th>
                <th>Nazwa</th>
                <th>Typ</th>
                <th>Wymiary [mm]</th>
                <th>Materiał</th>
                <th>Szt.</th>
              </tr>
            </thead>
            <tbody>
              {cab.elements.map((el, i) => (
                <tr key={el.id}>
                  <td>{i + 1}</td>
                  <td>{el.name}</td>
                  <td>{ELEMENT_LABELS[el.type]}</td>
                  <td>
                    {Math.round(el.width)} × {Math.round(el.height)} ×{" "}
                    {Math.round(el.depth)}
                  </td>
                  <td>{el.material}</td>
                  <td>{el.quantity}</td>
                </tr>
              ))}
              {cab.elements.length === 0 && (
                <tr>
                  <td colSpan={6} className="print-empty">
                    Pusty moduł – brak elementów.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ))}

      <section className="print-page print-parts-page">
        <h2 className="print-h2">
          Lista zbiorcza elementów (zsumowana ze wszystkich szaf)
        </h2>
        <PartsList />
      </section>

      <section className="print-page print-edges-page">
        <h2 className="print-h2">
          Oklejenie krawędzi ABS ({edgeMetersTotal.toFixed(2)} mb)
        </h2>
        <p className="print-note">
          Suma metrów bieżących okleiny per materiał. Na każdym panelu
          krawędzie liczone na rozłożeniu płaskim (dwa największe wymiary):
          Góra/Dół = długość, Lewa/Prawa = wysokość.
        </p>
        <table className="print-elements-table">
          <thead>
            <tr>
              <th>Materiał okleiny</th>
              <th>mb</th>
            </tr>
          </thead>
          <tbody>
            {edgeTotals.map((e) => (
              <tr key={e.material}>
                <td>{e.material}</td>
                <td>{e.meters.toFixed(2)}</td>
              </tr>
            ))}
            {edgeTotals.length === 0 && (
              <tr>
                <td colSpan={2} className="print-empty">
                  Żaden panel nie ma zaznaczonych krawędzi do oklejania.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="print-page print-hardware-page">
        <h2 className="print-h2">Lista okuć i akcesoriów</h2>
        <p className="print-note">
          Pozycje wyliczone automatycznie z elementów projektu (heurystyka:
          zawiasy wg wysokości drzwi 2/3/4/5/6, prowadnice 1 szt. / front
          szuflady, podpórki 4 szt. / półka, konfirmaty 8 / korpus + 2 /
          drzwi-szuflada). Stolarz może uzupełnić listę o pozycje specyficzne.
        </p>
        <details className="print-hw-cabinet-breakdown">
          <summary>Rozbicie per szafa (kliknij aby rozwinąć)</summary>
          {project.cabinets.map((c) => {
            const items = computeHardwareForProject({
              ...project,
              cabinets: [c],
            });
            const sub = items.reduce(
              (s, h) => s + hardwareLineTotal(h),
              0
            );
            if (items.length === 0) return null;
            return (
              <div key={c.id} style={{ marginTop: 8 }}>
                <strong>{c.name}</strong> ·{" "}
                <span>{formatPLN(sub)}</span>
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {items.map((h, i) => (
                    <li key={i}>
                      {h.quantity} × {h.name} = {formatPLN(hardwareLineTotal(h))}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </details>
        <table className="print-elements-table">
          <thead>
            <tr>
              <th>Lp.</th>
              <th>Pozycja</th>
              <th>Pochodzenie</th>
              <th>Sztuk</th>
              <th>Cena jednostkowa</th>
              <th>Wartość</th>
            </tr>
          </thead>
          <tbody>
            {hardware.map((h, i) => (
              <tr key={h.kind + i}>
                <td>{i + 1}</td>
                <td>{h.name}</td>
                <td>{h.sourceCabinetName ?? ""}</td>
                <td>{h.quantity}</td>
                <td>{formatPLN(h.pricePerUnit)}</td>
                <td>{formatPLN(hardwareLineTotal(h))}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} style={{ textAlign: "right", fontWeight: 600 }}>
                Razem okucia i akcesoria:
              </td>
              <td style={{ fontWeight: 700 }}>{formatPLN(hardwareSum)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="print-page print-quote-page">
        <h2 className="print-h2">Wycena projektu</h2>
        <p className="print-note">
          Szacunek brutto na podstawie powierzchni płyt, listy okuć i
          robocizny. Założenia: cena płyty {formatPLN(pricing.defaultBoardPricePerM2)}/m²,
          marża {pricing.marginPercent}% , VAT {pricing.vatPercent}%,
          robocizna {formatPLN(pricing.laborPerCabinet)} / szafa.
        </p>
        <table className="print-quote-table">
          <tbody>
            <tr>
              <td>Powierzchnia płyt</td>
              <td>{quote.boardAreaM2.toFixed(2)} m²</td>
            </tr>
            <tr>
              <td>Szacowana liczba płyt {pricing.sheetWidth} × {pricing.sheetHeight} mm (z 18% zapasem na rozkrój)</td>
              <td>{quote.sheetCount} szt.</td>
            </tr>
            <tr>
              <td>Materiał (płyta)</td>
              <td>{formatPLN(quote.boardCost)}</td>
            </tr>
            <tr>
              <td>Okucia i akcesoria</td>
              <td>{formatPLN(quote.hardwareCost)}</td>
            </tr>
            <tr>
              <td>
                Robocizna ({project.cabinets.length} ×{" "}
                {formatPLN(pricing.laborPerCabinet)})
              </td>
              <td>{formatPLN(quote.laborCost)}</td>
            </tr>
            <tr className="print-quote-subtotal">
              <td>Suma częściowa (netto, bez marży)</td>
              <td>{formatPLN(quote.subtotal)}</td>
            </tr>
            <tr>
              <td>Marża stolarza ({pricing.marginPercent}%)</td>
              <td>{formatPLN(quote.margin)}</td>
            </tr>
            <tr className="print-quote-net">
              <td>Razem netto</td>
              <td>{formatPLN(quote.net)}</td>
            </tr>
            <tr>
              <td>VAT {pricing.vatPercent}%</td>
              <td>{formatPLN(quote.vat)}</td>
            </tr>
            <tr className="print-quote-total">
              <td>Razem brutto</td>
              <td>{formatPLN(quote.total)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
