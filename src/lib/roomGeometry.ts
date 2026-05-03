import { RoomLayout, WallSide } from "../types";

export interface Rect2D {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Długość ściany w mm. N/S = width, W/E = depth. */
export function wallLengthFor(layout: RoomLayout, side: WallSide): number {
  return side === "N" || side === "S" ? layout.width : layout.depth;
}

/**
 * Prostokąt wycinający otwór lub wnękę w przekroju ściany w układzie 2D
 * (X = świat-X, Y = świat-Z), wszystko w mm.
 */
export function cutoutRect(
  layout: RoomLayout,
  wall: WallSide,
  offset: number,
  width: number
): Rect2D {
  const halfW = layout.width / 2;
  const halfD = layout.depth / 2;
  const t = layout.wallThickness;
  switch (wall) {
    case "N":
      return { x: -halfW + offset, y: -halfD - t, w: width, h: t };
    case "S":
      return { x: halfW - offset - width, y: halfD, w: width, h: t };
    case "W":
      return {
        x: -halfW - t,
        y: halfD - offset - width,
        w: t,
        h: width,
      };
    case "E":
      return { x: halfW, y: -halfD + offset, w: t, h: width };
  }
}

/**
 * Trzy ściany rękawa wnęki (lewy bok, prawy bok, tył) w układzie 2D
 * (świat-X / świat-Z).
 */
export function alcoveSleeveRects(
  layout: RoomLayout,
  wall: WallSide,
  offset: number,
  width: number,
  depth: number
): Rect2D[] {
  const halfW = layout.width / 2;
  const halfD = layout.depth / 2;
  const t = layout.wallThickness;
  switch (wall) {
    case "N": {
      const xStart = -halfW + offset;
      const xEnd = xStart + width;
      const zBack = -halfD - depth;
      return [
        { x: xStart - t, y: zBack, w: t, h: depth + t },
        { x: xEnd, y: zBack, w: t, h: depth + t },
        { x: xStart - t, y: zBack - t, w: width + 2 * t, h: t },
      ];
    }
    case "S": {
      const xStart = halfW - offset;
      const xEnd = xStart - width;
      const zFront = halfD + depth;
      return [
        { x: xStart, y: halfD, w: t, h: depth + t },
        { x: xEnd - t, y: halfD, w: t, h: depth + t },
        { x: xEnd - t, y: zFront, w: width + 2 * t, h: t },
      ];
    }
    case "W": {
      const zStart = halfD - offset;
      const zEnd = zStart - width;
      const xOut = -halfW - depth;
      return [
        { x: xOut, y: zStart, w: depth + t, h: t },
        { x: xOut, y: zEnd - t, w: depth + t, h: t },
        { x: xOut - t, y: zEnd - t, w: t, h: width + 2 * t },
      ];
    }
    case "E": {
      const zStart = -halfD + offset;
      const zEnd = zStart + width;
      const xOut = halfW + depth;
      return [
        { x: halfW, y: zStart - t, w: depth + t, h: t },
        { x: halfW, y: zEnd, w: depth + t, h: t },
        { x: xOut, y: zStart - t, w: t, h: width + 2 * t },
      ];
    }
  }
}

/** Łatka podłogi rozszerzająca podłogę pomieszczenia o obszar wnęki. */
export function alcoveFloorRect(
  layout: RoomLayout,
  wall: WallSide,
  offset: number,
  width: number,
  depth: number
): Rect2D {
  const halfW = layout.width / 2;
  const halfD = layout.depth / 2;
  switch (wall) {
    case "N":
      return { x: -halfW + offset, y: -halfD - depth, w: width, h: depth };
    case "S":
      return { x: halfW - offset - width, y: halfD, w: width, h: depth };
    case "W":
      return {
        x: -halfW - depth,
        y: halfD - offset - width,
        w: depth,
        h: width,
      };
    case "E":
      return { x: halfW, y: -halfD + offset, w: depth, h: width };
  }
}
