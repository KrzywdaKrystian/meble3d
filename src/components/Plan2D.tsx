import { useMemo } from "react";
import {
  resolveCabinetTransform,
  useActiveProject,
  useActiveRoomLayout,
  useStore,
} from "../store";
import { Cabinet, RoomLayout, WallSide } from "../types";
import {
  alcoveFloorRect,
  alcoveSleeveRects,
  cutoutRect,
} from "../lib/roomGeometry";

/** Stała: ile mm na piksel SVG. ViewBox automatycznie się dopasuje, ale
 *  używamy mm bezpośrednio jako jednostki SVG. */

interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function computeBounds(
  project: ReturnType<typeof useActiveProject>,
  layout: RoomLayout | undefined
): Bounds {
  let b: Bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  };
  if (layout && layout.enabled) {
    const t = layout.wallThickness;
    b.minX = -layout.width / 2 - t;
    b.maxX = layout.width / 2 + t;
    b.minZ = -layout.depth / 2 - t;
    b.maxZ = layout.depth / 2 + t;
    for (const a of layout.alcoves) {
      // wnęki rozszerzają obrys na zewnątrz
      if (a.wall === "N") b.minZ = Math.min(b.minZ, -layout.depth / 2 - a.depth - t);
      if (a.wall === "S") b.maxZ = Math.max(b.maxZ, layout.depth / 2 + a.depth + t);
      if (a.wall === "W") b.minX = Math.min(b.minX, -layout.width / 2 - a.depth - t);
      if (a.wall === "E") b.maxX = Math.max(b.maxX, layout.width / 2 + a.depth + t);
    }
  }
  for (const c of project.cabinets) {
    const tr = resolveCabinetTransform(c, layout);
    const horiz = Math.abs(Math.cos(tr.rotationY)) > 0.5;
    const halfX = horiz ? c.outerWidth / 2 : c.outerDepth / 2;
    const halfZ = horiz ? c.outerDepth / 2 : c.outerWidth / 2;
    b.minX = Math.min(b.minX, tr.position[0] - halfX);
    b.maxX = Math.max(b.maxX, tr.position[0] + halfX);
    b.minZ = Math.min(b.minZ, tr.position[2] - halfZ);
    b.maxZ = Math.max(b.maxZ, tr.position[2] + halfZ);
  }
  if (!Number.isFinite(b.minX)) {
    b = { minX: -2000, maxX: 2000, minZ: -1500, maxZ: 1500 };
  }
  // Padding na etykiety
  const padX = (b.maxX - b.minX) * 0.12 + 200;
  const padZ = (b.maxZ - b.minZ) * 0.12 + 200;
  return {
    minX: b.minX - padX,
    maxX: b.maxX + padX,
    minZ: b.minZ - padZ,
    maxZ: b.maxZ + padZ,
  };
}

/**
 * Zamienia (worldX, worldZ) w mm na (svgX, svgY).
 * SVG Y rośnie w dół, ale dla rzutu z góry wolimy żeby +Z (przód pomieszczenia)
 * był NA DOLE rysunku - więc mapujemy worldZ → svgY bez odbicia.
 */
function w2s(x: number, z: number): { x: number; y: number } {
  return { x, y: z };
}

interface WallSegment {
  /** Linia segmentu zamknięta pełną szerokością otworów; dla otworów rysujemy "tło". */
  path: string;
  cutouts: Array<{ x: number; y: number; w: number; h: number }>;
}

function CabinetRect({
  cabinet,
  layout,
  active,
  onClick,
}: {
  cabinet: Cabinet;
  layout: RoomLayout | undefined;
  active: boolean;
  onClick: () => void;
}) {
  const tr = resolveCabinetTransform(cabinet, layout);
  const rotDeg = (tr.rotationY * 180) / Math.PI;
  const w = cabinet.outerWidth;
  const d = cabinet.outerDepth;
  const cx = tr.position[0];
  const cz = tr.position[2];
  // Lokalna kolorystyka per szafa - prosty hash z id na hue.
  const hue =
    (cabinet.id
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) *
      37) %
    360;
  const fill = "hsl(" + hue + ", 45%, 45%)";
  const stroke = active ? "#3b82f6" : "#0f172a";
  const strokeW = active ? 30 : 12;
  return (
    <g
      transform={`translate(${cx} ${cz}) rotate(${rotDeg})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* Korpus szafy */}
      <rect
        x={-w / 2}
        y={-d / 2}
        width={w}
        height={d}
        fill={fill}
        fillOpacity={0.85}
        stroke={stroke}
        strokeWidth={strokeW}
      />
      {/* Wskaźnik frontu (lokalne +Z = przód, mała kreska na przedniej krawędzi) */}
      <line
        x1={-w / 2 + w * 0.05}
        x2={w / 2 - w * 0.05}
        y1={d / 2 - 30}
        y2={d / 2 - 30}
        stroke="#fbbf24"
        strokeWidth={20}
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0f172a"
        fontSize={Math.max(60, Math.min(w, d) * 0.13)}
        fontWeight={600}
        style={{ pointerEvents: "none" }}
      >
        {cabinet.name}
      </text>
      <text
        x={0}
        y={Math.max(60, Math.min(w, d) * 0.13) * 0.9}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0f172a"
        fontSize={Math.max(45, Math.min(w, d) * 0.1)}
        style={{ pointerEvents: "none" }}
      >
        {Math.round(w)} × {Math.round(d)}
      </text>
    </g>
  );
}

function RoomShape({ layout }: { layout: RoomLayout }) {
  const halfW = layout.width / 2;
  const halfD = layout.depth / 2;
  const t = layout.wallThickness;

  // Buduj 4 prostokąty ścian, każdy z otworami i wnękami jako "wycięcia".
  type Rect = { x: number; y: number; w: number; h: number };
  const wallRects: Rect[] = [
    { x: -halfW - t, y: -halfD - t, w: layout.width + 2 * t, h: t }, // N (góra rysunku to -Z)
    { x: -halfW - t, y: halfD, w: layout.width + 2 * t, h: t }, // S
    { x: -halfW - t, y: -halfD, w: t, h: layout.depth }, // W
    { x: halfW, y: -halfD, w: t, h: layout.depth }, // E
  ];

  // Wycięcia w ścianach: otwory i wnęki (pełnej szerokości ściany).
  // Dla każdej ściany wyliczamy wycięte prostokąty w worldzie.
  const cutouts: Rect[] = [];
  for (const op of layout.openings) {
    cutouts.push(cutoutRect(layout, op.wall, op.offset, op.width));
  }
  for (const a of layout.alcoves) {
    cutouts.push(cutoutRect(layout, a.wall, a.offset, a.width));
  }

  // Wnęki: ścianki tylna + dwie boczne (rysowane jako trzy rect-y).
  type Sleeve = Rect[];
  const sleeves: Sleeve[] = layout.alcoves.map((a) =>
    alcoveSleeveRects(layout, a.wall, a.offset, a.width, a.depth)
  );

  return (
    <g>
      {/* Podłoga pomieszczenia */}
      <rect
        x={-halfW}
        y={-halfD}
        width={layout.width}
        height={layout.depth}
        fill="#1f2937"
        stroke="#475569"
        strokeWidth={6}
        strokeDasharray="20 20"
      />
      {/* Łatki podłogi we wnękach */}
      {layout.alcoves.map((a, i) => {
        const r = alcoveFloorRect(layout, a.wall, a.offset, a.width, a.depth);
        return (
          <rect
            key={"af-" + i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="#1f2937"
          />
        );
      })}
      {/* Ściany - 4 prostokąty */}
      {wallRects.map((w, i) => (
        <rect
          key={"wall-" + i}
          x={w.x}
          y={w.y}
          width={w.w}
          height={w.h}
          fill="#94a3b8"
        />
      ))}
      {/* Wycięcia (otwory + wnęki) - rysujemy kolorem podłogi */}
      {cutouts.map((c, i) => (
        <rect
          key={"cut-" + i}
          x={c.x}
          y={c.y}
          width={c.w}
          height={c.h}
          fill="#1f2937"
        />
      ))}
      {/* Sleeve walls dla wnęk */}
      {sleeves.map((slabs, i) =>
        slabs.map((s, j) => (
          <rect
            key={"sl-" + i + "-" + j}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            fill="#94a3b8"
          />
        ))
      )}
      {/* Etykiety drzwi/okien */}
      {layout.openings.map((op) => {
        const c = cutoutRect(layout, op.wall, op.offset, op.width);
        return (
          <text
            key={"opl-" + op.id}
            x={c.x + c.w / 2}
            y={c.y + c.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fbbf24"
            fontSize={70}
            fontWeight={600}
          >
            {op.kind === "door" ? "drzwi" : "okno"} {op.width}
          </text>
        );
      })}
    </g>
  );
}

/** Etykiety długości na środku każdej ściany. */
function WallDimensions({ layout }: { layout: RoomLayout }) {
  const halfW = layout.width / 2;
  const halfD = layout.depth / 2;
  const t = layout.wallThickness;
  return (
    <g fill="#cbd5e1" fontSize={90} fontWeight={600}>
      <text x={0} y={-halfD - t - 60} textAnchor="middle">
        {layout.width} mm
      </text>
      <text x={0} y={halfD + t + 130} textAnchor="middle">
        {layout.width} mm
      </text>
      <text
        x={-halfW - t - 60}
        y={0}
        textAnchor="end"
        dominantBaseline="middle"
      >
        {layout.depth} mm
      </text>
      <text
        x={halfW + t + 60}
        y={0}
        textAnchor="start"
        dominantBaseline="middle"
      >
        {layout.depth} mm
      </text>
    </g>
  );
}

export function Plan2D() {
  const project = useActiveProject();
  const layout = useActiveRoomLayout();
  const activeCabinetId = useStore((s) => s.activeCabinetId);
  const setActiveCabinet = useStore((s) => s.setActiveCabinet);
  const setSelected = useStore((s) => s.setSelected);

  const bounds = useMemo(
    () => computeBounds(project, layout),
    [project, layout]
  );
  const viewW = bounds.maxX - bounds.minX;
  const viewH = bounds.maxZ - bounds.minZ;

  return (
    <div className="plan2d-wrap">
      <svg
        className="plan2d-svg"
        viewBox={`${bounds.minX} ${bounds.minZ} ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Tło sceny (poza pomieszczeniem) */}
        <rect
          x={bounds.minX}
          y={bounds.minZ}
          width={viewW}
          height={viewH}
          fill="#0f172a"
        />
        {/* Siatka 100mm/1m */}
        <defs>
          <pattern
            id="grid-cm"
            x={0}
            y={0}
            width={100}
            height={100}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="#1e293b"
              strokeWidth={2}
            />
          </pattern>
          <pattern
            id="grid-m"
            x={0}
            y={0}
            width={1000}
            height={1000}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 1000 0 L 0 0 0 1000"
              fill="none"
              stroke="#334155"
              strokeWidth={4}
            />
          </pattern>
        </defs>
        <rect
          x={bounds.minX}
          y={bounds.minZ}
          width={viewW}
          height={viewH}
          fill="url(#grid-cm)"
        />
        <rect
          x={bounds.minX}
          y={bounds.minZ}
          width={viewW}
          height={viewH}
          fill="url(#grid-m)"
          onClick={() => setSelected(null)}
        />

        {/* Pomieszczenie */}
        {layout && layout.enabled && <RoomShape layout={layout} />}

        {/* Szafy */}
        {project.cabinets.map((c) => (
          <CabinetRect
            key={c.id}
            cabinet={c}
            layout={layout}
            active={c.id === activeCabinetId}
            onClick={() => setActiveCabinet(c.id)}
          />
        ))}

        {/* Wymiary pomieszczenia */}
        {layout && layout.enabled && <WallDimensions layout={layout} />}

        {/* Strzałka północy / orientacja - mała wskazówka w rogu */}
        <g
          transform={`translate(${bounds.minX + 200} ${bounds.minZ + 200})`}
        >
          <circle r={120} fill="#0b1220" stroke="#475569" strokeWidth={6} />
          <text
            x={0}
            y={-50}
            textAnchor="middle"
            fill="#e5e7eb"
            fontSize={70}
            fontWeight={700}
          >
            tył
          </text>
          <text
            x={0}
            y={70}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={60}
          >
            ↑
          </text>
        </g>
      </svg>
      <div className="plan2d-legend">
        Rzut 2D z góry · jednostki: mm · żółta kreska na szafie = front
      </div>
    </div>
  );
}
