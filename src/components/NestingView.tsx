import { NestingResult, PackedSheet } from "../lib/nesting";

function colorFor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) % 360;
  }
  return "hsl(" + hash + ", 55%, 60%)";
}

function SheetSvg({ sheet }: { sheet: PackedSheet }) {
  const PADDING = 20;
  const viewBox = `${-PADDING} ${-PADDING} ${sheet.width + 2 * PADDING} ${sheet.height + 2 * PADDING}`;
  const labelFontSize = Math.max(28, Math.min(sheet.width, sheet.height) * 0.025);
  return (
    <svg
      className="nest-sheet"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x={0}
        y={0}
        width={sheet.width}
        height={sheet.height}
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth={6}
      />
      {sheet.panels.map((p) => {
        const fill = colorFor(p.label);
        const showLabel = Math.min(p.width, p.height) > labelFontSize * 3;
        return (
          <g key={p.id}>
            <rect
              x={p.x}
              y={p.y}
              width={p.width}
              height={p.height}
              fill={fill}
              fillOpacity={0.65}
              stroke="#0f172a"
              strokeWidth={2}
            />
            {showLabel && (
              <>
                <text
                  x={p.x + p.width / 2}
                  y={p.y + p.height / 2 - labelFontSize * 0.3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={labelFontSize}
                  fill="#0f172a"
                  fontWeight={600}
                >
                  {p.label}
                </text>
                <text
                  x={p.x + p.width / 2}
                  y={p.y + p.height / 2 + labelFontSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={labelFontSize * 0.85}
                  fill="#0f172a"
                >
                  {Math.round(p.width)} × {Math.round(p.height)}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function NestingView({
  results,
  sheetW,
  sheetH,
}: {
  results: NestingResult[];
  sheetW: number;
  sheetH: number;
}) {
  const totalSheets = results.reduce((s, r) => s + r.sheets.length, 0);
  return (
    <div className="nesting-view">
      <div className="nesting-summary">
        Łącznie {totalSheets} arkusz(y) {sheetW} × {sheetH} mm w{" "}
        {results.length} grup(ach) materiału.
      </div>
      {results.map((r) => (
        <div key={r.groupKey} className="nesting-group">
          <h3 className="nesting-group-title">
            {r.material} · {r.thickness} mm — {r.sheets.length} ark.,{" "}
            {r.totalArea.toFixed(2)} m² paneli
          </h3>
          {r.unplaced.length > 0 && (
            <p className="error-hint">
              Uwaga: {r.unplaced.length} panel(ów) nie zmieściło się na
              arkuszu {sheetW} × {sheetH}. Zwiększ rozmiar płyty roboczej
              lub podziel panele.
            </p>
          )}
          <div className="nesting-sheets">
            {r.sheets.map((sheet) => (
              <div key={sheet.index} className="nesting-sheet-card">
                <div className="nesting-sheet-meta">
                  Arkusz {sheet.index} / {r.sheets.length} · wykorzystanie{" "}
                  {sheet.usagePercent.toFixed(1)} %
                </div>
                <SheetSvg sheet={sheet} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {results.length === 0 && (
        <div className="empty-hint">
          Brak paneli w projekcie do rozkroju. Dodaj elementy w szafach.
        </div>
      )}
    </div>
  );
}
