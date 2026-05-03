import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore, useActiveRoomLayout } from "../store";
import { RoomAlcove, RoomLayout, RoomOpening, WallSide } from "../types";
import { wallLengthFor } from "../lib/roomGeometry";

const MM = 0.001;

const wallLength = wallLengthFor;

/**
 * Buduje geometrię jednej ściany.
 *
 * Konwencja lokalna (po rotacji):
 *  - oś u (lokalne +X) biegnie wzdłuż ściany od lewej do prawej, patrząc od
 *    wewnątrz pomieszczenia,
 *  - oś v (lokalne +Y) to wysokość (0 = podłoga, H = sufit),
 *  - extrude w lokalne +Z biegnie do WEWNĄTRZ pomieszczenia, więc przesunięcie
 *    pozycji ustawia ściankę na zewnętrznej krawędzi, a wewnętrzna krawędź
 *    siedzi po grubości ściany od wewnątrz.
 *
 * Otwory (drzwi/okna) i wnęki to prostokątne dziury w shape - dla wnęk
 * pełnowysokie, dla otworów na zadanej wysokości parapetu.
 */
function buildWallGeometry(
  layout: RoomLayout,
  side: WallSide
): THREE.ExtrudeGeometry {
  const length = wallLength(layout, side) * MM;
  const height = layout.height * MM;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, height);
  shape.lineTo(0, height);
  shape.closePath();

  for (const op of layout.openings.filter((o) => o.wall === side)) {
    const u0 = op.offset * MM;
    const u1 = (op.offset + op.width) * MM;
    const v0 = op.sillHeight * MM;
    const v1 = (op.sillHeight + op.height) * MM;
    const hole = new THREE.Path();
    hole.moveTo(u0, v0);
    hole.lineTo(u1, v0);
    hole.lineTo(u1, v1);
    hole.lineTo(u0, v1);
    hole.closePath();
    shape.holes.push(hole);
  }

  for (const a of layout.alcoves.filter((x) => x.wall === side)) {
    const u0 = a.offset * MM;
    const u1 = (a.offset + a.width) * MM;
    const hole = new THREE.Path();
    hole.moveTo(u0, 0);
    hole.lineTo(u1, 0);
    hole.lineTo(u1, height);
    hole.lineTo(u0, height);
    hole.closePath();
    shape.holes.push(hole);
  }

  return new THREE.ExtrudeGeometry(shape, {
    depth: layout.wallThickness * MM,
    bevelEnabled: false,
    steps: 1,
  });
}

/**
 * Pozycja i rotacja meshu ściany.
 *
 * Konwencja: lokalne (0,0,0) ustawiamy w zewnętrznym narożniku ściany
 * (po lewej, jak patrzysz na ścianę z wewnątrz). Lokalne +X biegnie wzdłuż
 * ściany na prawo (od wewnątrz), a lokalne +Z biegnie do wewnątrz - czyli
 * extrude wykrawa ścianę o grubości t w stronę środka pomieszczenia,
 * a wewnętrzna krawędź siedzi równo ze ścianą na ±halfW lub ±halfD.
 *
 *   N (tylna,  -Z): rotationY = 0      (looking towards -Z from inside)
 *   S (przód,  +Z): rotationY = π
 *   W (lewa,   -X): rotationY = +π/2
 *   E (prawa,  +X): rotationY = -π/2
 */
function wallTransform(
  layout: RoomLayout,
  side: WallSide
): { position: [number, number, number]; rotationY: number } {
  const halfW = (layout.width * MM) / 2;
  const halfD = (layout.depth * MM) / 2;
  const t = layout.wallThickness * MM;
  switch (side) {
    case "N":
      return { position: [-halfW, 0, -halfD - t], rotationY: 0 };
    case "S":
      return { position: [halfW, 0, halfD + t], rotationY: Math.PI };
    case "W":
      return { position: [-halfW - t, 0, halfD], rotationY: Math.PI / 2 };
    case "E":
      return { position: [halfW + t, 0, -halfD], rotationY: -Math.PI / 2 };
  }
}

function WallMesh({
  layout,
  side,
}: {
  layout: RoomLayout;
  side: WallSide;
}) {
  const geom = useMemo(() => buildWallGeometry(layout, side), [layout, side]);
  useEffect(() => () => geom.dispose(), [geom]);
  const { position, rotationY } = wallTransform(layout, side);
  return (
    <mesh
      geometry={geom}
      position={position}
      rotation={[0, rotationY, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color="#cbd5e1"
        roughness={0.95}
        metalness={0}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}

/**
 * Trzy meshe „rękawa” wnęki: lewy bok, prawy bok, tył.
 * Rysowane w globalnych współrzędnych pomieszczenia.
 */
function AlcoveSleeve({
  layout,
  alcove,
}: {
  layout: RoomLayout;
  alcove: RoomAlcove;
}) {
  const t = layout.wallThickness * MM;
  const h = layout.height * MM;
  const halfW = (layout.width * MM) / 2;
  const halfD = (layout.depth * MM) / 2;
  const w = alcove.width * MM;
  const d = alcove.depth * MM;
  const ofs = alcove.offset * MM;

  // Pozycja (środek) i wymiar (W, H, D) trzech ścianek wnęki w zależności od ściany.
  type Slab = { pos: [number, number, number]; size: [number, number, number] };
  const slabs: Slab[] = [];

  if (alcove.wall === "N") {
    // u biegnie z lewej na prawą patrząc od wnętrza, więc od -X do +X.
    const xStart = -halfW + ofs;
    const xEnd = xStart + w;
    const zBack = -halfD - d;
    // Lewy bok wnęki: pionowa płyta o grubości t między x=xStart-t..xStart, z=-halfD..-halfD-d, h=H
    slabs.push({
      pos: [xStart - t / 2, h / 2, -halfD - d / 2],
      size: [t, h, d],
    });
    slabs.push({
      pos: [xEnd + t / 2, h / 2, -halfD - d / 2],
      size: [t, h, d],
    });
    // Tył wnęki - od xStart do xEnd, na pozycji zBack-t/2
    slabs.push({
      pos: [(xStart + xEnd) / 2, h / 2, zBack - t / 2],
      size: [w + 2 * t, h, t],
    });
  } else if (alcove.wall === "S") {
    // u biegnie od +X do -X, więc offset rośnie w stronę -X.
    const xStart = halfW - ofs;
    const xEnd = xStart - w;
    const zFront = halfD + d;
    slabs.push({
      pos: [xStart + t / 2, h / 2, halfD + d / 2],
      size: [t, h, d],
    });
    slabs.push({
      pos: [xEnd - t / 2, h / 2, halfD + d / 2],
      size: [t, h, d],
    });
    slabs.push({
      pos: [(xStart + xEnd) / 2, h / 2, zFront + t / 2],
      size: [w + 2 * t, h, t],
    });
  } else if (alcove.wall === "W") {
    // u biegnie od +Z do -Z, offset rośnie w stronę -Z.
    const zStart = halfD - ofs;
    const zEnd = zStart - w;
    const xOut = -halfW - d;
    slabs.push({
      pos: [-halfW - d / 2, h / 2, zStart + t / 2],
      size: [d, h, t],
    });
    slabs.push({
      pos: [-halfW - d / 2, h / 2, zEnd - t / 2],
      size: [d, h, t],
    });
    slabs.push({
      pos: [xOut - t / 2, h / 2, (zStart + zEnd) / 2],
      size: [t, h, w + 2 * t],
    });
  } else {
    // E: u biegnie od -Z do +Z, offset rośnie w stronę +Z.
    const zStart = -halfD + ofs;
    const zEnd = zStart + w;
    const xOut = halfW + d;
    slabs.push({
      pos: [halfW + d / 2, h / 2, zStart - t / 2],
      size: [d, h, t],
    });
    slabs.push({
      pos: [halfW + d / 2, h / 2, zEnd + t / 2],
      size: [d, h, t],
    });
    slabs.push({
      pos: [xOut + t / 2, h / 2, (zStart + zEnd) / 2],
      size: [t, h, w + 2 * t],
    });
  }

  return (
    <group>
      {slabs.map((s, i) => (
        <mesh key={i} position={s.pos} castShadow receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial
            color="#cbd5e1"
            roughness={0.95}
            metalness={0}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Łatka podłogi rozciągająca podłogę pomieszczenia w obszar wnęki.
 */
function AlcoveFloorPatch({
  layout,
  alcove,
}: {
  layout: RoomLayout;
  alcove: RoomAlcove;
}) {
  const halfW = (layout.width * MM) / 2;
  const halfD = (layout.depth * MM) / 2;
  const w = alcove.width * MM;
  const d = alcove.depth * MM;
  const ofs = alcove.offset * MM;

  let pos: [number, number, number];
  let size: [number, number];
  if (alcove.wall === "N") {
    pos = [-halfW + ofs + w / 2, 0, -halfD - d / 2];
    size = [w, d];
  } else if (alcove.wall === "S") {
    pos = [halfW - ofs - w / 2, 0, halfD + d / 2];
    size = [w, d];
  } else if (alcove.wall === "W") {
    pos = [-halfW - d / 2, 0, halfD - ofs - w / 2];
    size = [d, w];
  } else {
    pos = [halfW + d / 2, 0, -halfD + ofs + w / 2];
    size = [d, w];
  }

  return (
    <mesh
      position={[pos[0], pos[1] + 0.001, pos[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={size} />
      <meshStandardMaterial color="#3a4252" roughness={1} />
    </mesh>
  );
}

/**
 * Obrys 2D (linia) podłogi pomieszczenia + wnęk - używany gdy
 * `showFloorOutlineOnly` jest aktywny.
 */
function FloorOutline({ layout }: { layout: RoomLayout }) {
  const points = useMemo(() => {
    const halfW = (layout.width * MM) / 2;
    const halfD = (layout.depth * MM) / 2;
    // Domyślny prostokąt - rozszerzymy o wnęki.
    // Konstruujemy listę punktów obwodu w kolejności: SW -> NW -> NE -> SE -> SW.
    // Wnęki interpolujemy w obrysie analogicznie do shape.
    const pts: Array<[number, number]> = [];
    const eps = 0;

    // Wall S (dół, przód) z u od +X do -X
    pts.push([halfW, halfD]);
    // wnęki na S z offsetem rosnącym do -X
    const sAlcoves = layout.alcoves
      .filter((a) => a.wall === "S")
      .sort((a, b) => a.offset - b.offset);
    for (const a of sAlcoves) {
      const xStart = halfW - a.offset * MM;
      const xEnd = xStart - a.width * MM;
      const zOut = halfD + a.depth * MM;
      pts.push([xStart, halfD + eps]);
      pts.push([xStart, zOut]);
      pts.push([xEnd, zOut]);
      pts.push([xEnd, halfD + eps]);
    }
    pts.push([-halfW, halfD]);

    // Wall W (lewa) u biegnie z +Z do -Z
    const wAlcoves = layout.alcoves
      .filter((a) => a.wall === "W")
      .sort((a, b) => a.offset - b.offset);
    for (const a of wAlcoves) {
      const zStart = halfD - a.offset * MM;
      const zEnd = zStart - a.width * MM;
      const xOut = -halfW - a.depth * MM;
      pts.push([-halfW - eps, zStart]);
      pts.push([xOut, zStart]);
      pts.push([xOut, zEnd]);
      pts.push([-halfW - eps, zEnd]);
    }
    pts.push([-halfW, -halfD]);

    // Wall N (góra, tył) u biegnie z -X do +X
    const nAlcoves = layout.alcoves
      .filter((a) => a.wall === "N")
      .sort((a, b) => a.offset - b.offset);
    for (const a of nAlcoves) {
      const xStart = -halfW + a.offset * MM;
      const xEnd = xStart + a.width * MM;
      const zOut = -halfD - a.depth * MM;
      pts.push([xStart, -halfD - eps]);
      pts.push([xStart, zOut]);
      pts.push([xEnd, zOut]);
      pts.push([xEnd, -halfD - eps]);
    }
    pts.push([halfW, -halfD]);

    // Wall E (prawa) u biegnie z -Z do +Z
    const eAlcoves = layout.alcoves
      .filter((a) => a.wall === "E")
      .sort((a, b) => a.offset - b.offset);
    for (const a of eAlcoves) {
      const zStart = -halfD + a.offset * MM;
      const zEnd = zStart + a.width * MM;
      const xOut = halfW + a.depth * MM;
      pts.push([halfW + eps, zStart]);
      pts.push([xOut, zStart]);
      pts.push([xOut, zEnd]);
      pts.push([halfW + eps, zEnd]);
    }
    pts.push([halfW, halfD]); // domknij

    return pts;
  }, [layout]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, z0] = points[i];
      const [x1, z1] = points[i + 1];
      arr.push(x0, 0.002, z0, x1, 0.002, z1);
    }
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(arr), 3)
    );
    return g;
  }, [points]);

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color="#60a5fa" linewidth={2} />
    </lineSegments>
  );
}

export function WallsAndRoom() {
  const layout = useActiveRoomLayout();
  const showWalls = useStore((s) => s.showWalls);
  const showFloorOutlineOnly = useStore((s) => s.showFloorOutlineOnly);

  if (!layout || !layout.enabled) return null;

  const halfW = (layout.width * MM) / 2;
  const halfD = (layout.depth * MM) / 2;
  const sides: WallSide[] = ["N", "E", "S", "W"];

  return (
    <group>
      {/* Podłoga pomieszczenia (zamiast nieskończonej, gdy layout.enabled) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[layout.width * MM, layout.depth * MM]} />
        <meshStandardMaterial color="#3a4252" roughness={1} />
      </mesh>
      {layout.alcoves.map((a) => (
        <AlcoveFloorPatch key={a.id} layout={layout} alcove={a} />
      ))}

      {showWalls && !showFloorOutlineOnly && (
        <>
          {sides.map((s) => (
            <WallMesh key={s} layout={layout} side={s} />
          ))}
          {layout.alcoves.map((a) => (
            <AlcoveSleeve key={a.id} layout={layout} alcove={a} />
          ))}
        </>
      )}

      {showFloorOutlineOnly && <FloorOutline layout={layout} />}

      {/* Niebieskie zaznaczenie narożników aby było widać orientację (mały plus) */}
      <mesh
        position={[halfW + 0.01, 0.001, halfD + 0.01]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.02, 0.04, 16]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
