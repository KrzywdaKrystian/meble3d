import { Cabinet, ELEMENT_LABELS, WardrobeElement } from "../types";

const PADDING = 60; // jednostki SVG (mm) wokół rysunku na wymiary

interface Projected {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface View {
  name: string;
  width: number;
  height: number;
  axisXLabel: string;
  axisYLabel: string;
  /** Filtruj elementy żeby uniknąć kompletnego bałaganu (np. plecy w widoku z góry). */
  filter?: (el: WardrobeElement) => boolean;
  project: (el: WardrobeElement) => Projected | null;
}

function viewBoxStr(view: View): string {
  return `${-PADDING} ${-PADDING} ${view.width + 2 * PADDING} ${view.height + 2 * PADDING}`;
}

function CabinetView({
  cabinet,
  view,
}: {
  cabinet: Cabinet;
  view: View;
}) {
  const elements = cabinet.elements
    .filter((e) => !e.hidden)
    .filter((e) => (view.filter ? view.filter(e) : true));
  const labelFontSize = Math.max(40, Math.min(view.width, view.height) * 0.06);
  const dimFontSize = Math.max(40, Math.min(view.width, view.height) * 0.05);

  return (
    <div className="tdrawing-view">
      <div className="tdrawing-title">{view.name}</div>
      <svg
        className="tdrawing-svg"
        viewBox={viewBoxStr(view)}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Obrys szafy */}
        <rect
          x={0}
          y={0}
          width={view.width}
          height={view.height}
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth={5}
        />
        {/* Elementy */}
        {elements.map((el) => {
          const p = view.project(el);
          if (!p) return null;
          const showLabel = Math.min(p.w, p.h) > labelFontSize * 2.2;
          return (
            <g key={el.id}>
              <rect
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                fill={el.color}
                fillOpacity={0.5}
                stroke="#0f172a"
                strokeWidth={2}
              />
              {showLabel && (
                <text
                  x={p.x + p.w / 2}
                  y={p.y + p.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={labelFontSize}
                  fill="#0f172a"
                  fontWeight={500}
                >
                  {el.name}
                </text>
              )}
            </g>
          );
        })}
        {/* Wymiary główne (poza obrysem) */}
        <text
          x={view.width / 2}
          y={-PADDING / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={dimFontSize}
          fill="#0f172a"
          fontWeight={600}
        >
          {view.axisXLabel}: {Math.round(view.width)} mm
        </text>
        <text
          x={-PADDING / 2}
          y={view.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={dimFontSize}
          fill="#0f172a"
          fontWeight={600}
          transform={`rotate(-90 ${-PADDING / 2} ${view.height / 2})`}
        >
          {view.axisYLabel}: {Math.round(view.height)} mm
        </text>
      </svg>
    </div>
  );
}

export function TechnicalDrawings({ cabinet }: { cabinet: Cabinet }) {
  const W = cabinet.outerWidth;
  const H = cabinet.outerHeight;
  const D = cabinet.outerDepth;
  // Konwencja: cabinet local frame: x ∈ [-W/2, W/2], y ∈ [0, H], z ∈ [-D/2, D/2].
  // SVG: y rośnie w dół. Każdy widok przeskalowuje współrzędne.

  const front: View = {
    name: "Widok od przodu",
    width: W,
    height: H,
    axisXLabel: "Szerokość",
    axisYLabel: "Wysokość",
    project: (el) => ({
      x: el.x - el.width / 2 + W / 2,
      y: H - (el.y + el.height / 2),
      w: el.width,
      h: el.height,
    }),
  };

  const side: View = {
    name: "Widok z boku (lewa)",
    width: D,
    height: H,
    axisXLabel: "Głębokość",
    axisYLabel: "Wysokość",
    // Plecy są bardzo cienkie i nie wnoszą informacji, drzwi pomijamy też bo
    // są tuż przed frontem - wnętrze widać czytelniej.
    filter: (el) => el.type !== "drzwi" && el.type !== "front-szuflady",
    project: (el) => ({
      x: el.z - el.depth / 2 + D / 2,
      y: H - (el.y + el.height / 2),
      w: el.depth,
      h: el.height,
    }),
  };

  const top: View = {
    name: "Widok z góry (rzut)",
    width: W,
    height: D,
    axisXLabel: "Szerokość",
    axisYLabel: "Głębokość",
    project: (el) => ({
      x: el.x - el.width / 2 + W / 2,
      y: el.z - el.depth / 2 + D / 2,
      w: el.width,
      h: el.depth,
    }),
  };

  return (
    <div className="tdrawings-grid">
      <CabinetView cabinet={cabinet} view={front} />
      <CabinetView cabinet={cabinet} view={side} />
      <CabinetView cabinet={cabinet} view={top} />
      <div className="tdrawings-legend">
        Legenda elementów ({cabinet.elements.length}):{" "}
        {Array.from(new Set(cabinet.elements.map((e) => e.type)))
          .map((t) => ELEMENT_LABELS[t])
          .join(" · ")}
      </div>
    </div>
  );
}
