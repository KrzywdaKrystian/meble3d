import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Cabinet,
  CabinetAnchor,
  DEFAULT_PRICING,
  ELEMENT_DEFAULT_COLOR,
  ELEMENT_DEFAULT_THICKNESS,
  ELEMENT_LABELS,
  PlinthType,
  PricingSettings,
  Project,
  Room,
  RoomAlcove,
  RoomLayout,
  RoomOpening,
  WallSide,
  WardrobeElement,
  ElementType,
} from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// ===== Domyślne elementy szafy =====

function buildDefaultWardrobeElements(
  W = 1000,
  H = 2200,
  D = 600
): Omit<WardrobeElement, "id">[] {
  const t = 18;
  const backT = 3;
  const plinthH = 100;
  const innerH = H - 2 * t - plinthH;
  const innerW = W - 2 * t;
  const els: Omit<WardrobeElement, "id">[] = [];

  // Cokół
  els.push({
    type: "cokol",
    name: "Cokół przedni",
    width: W,
    height: plinthH,
    depth: t,
    x: 0,
    y: plinthH / 2,
    z: D / 2 - t / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.cokol,
    quantity: 1,
  });
  // Wieniec dolny
  els.push({
    type: "wieniec",
    name: "Wieniec dolny",
    width: W - 2 * t,
    height: t,
    depth: D - backT,
    x: 0,
    y: plinthH + t / 2,
    z: -backT / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.wieniec,
    quantity: 1,
  });
  // Wieniec górny
  els.push({
    type: "wieniec",
    name: "Wieniec górny",
    width: W - 2 * t,
    height: t,
    depth: D - backT,
    x: 0,
    y: H - t / 2,
    z: -backT / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.wieniec,
    quantity: 1,
  });
  // Bok lewy
  els.push({
    type: "bok",
    name: "Bok lewy",
    width: t,
    height: H - plinthH,
    depth: D - backT,
    x: -W / 2 + t / 2,
    y: plinthH + (H - plinthH) / 2,
    z: -backT / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.bok,
    quantity: 1,
  });
  // Bok prawy
  els.push({
    type: "bok",
    name: "Bok prawy",
    width: t,
    height: H - plinthH,
    depth: D - backT,
    x: W / 2 - t / 2,
    y: plinthH + (H - plinthH) / 2,
    z: -backT / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.bok,
    quantity: 1,
  });
  // Plecy
  els.push({
    type: "plecy",
    name: "Plecy HDF",
    width: W,
    height: H - plinthH,
    depth: backT,
    x: 0,
    y: plinthH + (H - plinthH) / 2,
    z: -D / 2 + backT / 2,
    thickness: backT,
    material: "HDF 3 mm",
    color: ELEMENT_DEFAULT_COLOR.plecy,
    quantity: 1,
  });
  // Półka
  els.push({
    type: "polka",
    name: "Półka",
    width: innerW,
    height: t,
    depth: D - backT - 20,
    x: 0,
    y: plinthH + t + innerH / 2,
    z: 10 - backT / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.polka,
    quantity: 1,
  });
  // Drążek
  els.push({
    type: "drazek",
    name: "Drążek",
    width: innerW,
    height: 25,
    depth: 25,
    x: 0,
    y: H - t - 80,
    z: 0,
    thickness: 25,
    material: "Rurka metalowa Ø25",
    color: ELEMENT_DEFAULT_COLOR.drazek,
    quantity: 1,
  });
  // Drzwi lewe
  els.push({
    type: "drzwi",
    name: "Drzwi lewe",
    width: W / 2 - 3,
    height: H - plinthH - 4,
    depth: t,
    x: -W / 4,
    y: plinthH + (H - plinthH) / 2,
    z: D / 2 + t / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.drzwi,
    quantity: 1,
  });
  // Drzwi prawe
  els.push({
    type: "drzwi",
    name: "Drzwi prawe",
    width: W / 2 - 3,
    height: H - plinthH - 4,
    depth: t,
    x: W / 4,
    y: plinthH + (H - plinthH) / 2,
    z: D / 2 + t / 2,
    thickness: t,
    material: "Płyta meblowa 18 mm",
    color: ELEMENT_DEFAULT_COLOR.drzwi,
    quantity: 1,
  });

  return els;
}

// ===== Cokoły =====

function buildPlinthElements(
  type: PlinthType,
  outerWidth: number,
  outerDepth: number,
  height: number,
  recess: number,
  sideToFloor: boolean
): Omit<WardrobeElement, "id">[] {
  if (height <= 0 && type !== "brak") return [];
  const t = 18;
  const els: Omit<WardrobeElement, "id">[] = [];
  const halfW = outerWidth / 2;
  const halfD = outerDepth / 2;
  // Gdy boki sięgają do podłogi, panel cokołu przebiega MIĘDZY bokami,
  // więc jest węższy o 2 grubości boku.
  const panelWidth = sideToFloor ? Math.max(0, outerWidth - 2 * t) : outerWidth;

  const legSize = 50;
  const legInset = 60;
  const legPositions = (): Array<[number, number]> => [
    [-halfW + legInset + legSize / 2, -halfD + legInset + legSize / 2],
    [halfW - legInset - legSize / 2, -halfD + legInset + legSize / 2],
    [-halfW + legInset + legSize / 2, halfD - legInset - legSize / 2],
    [halfW - legInset - legSize / 2, halfD - legInset - legSize / 2],
  ];

  if (type === "staly") {
    els.push({
      type: "cokol",
      name: sideToFloor
        ? "Cokół przedni (między bokami)"
        : "Cokół przedni (zabudowany)",
      width: panelWidth,
      height,
      depth: t,
      x: 0,
      y: height / 2,
      z: halfD - t / 2,
      thickness: t,
      material: "Płyta meblowa 18 mm",
      color: ELEMENT_DEFAULT_COLOR.cokol,
      quantity: 1,
    });
  } else if (type === "regulowany") {
    legPositions().forEach(([x, z], i) => {
      els.push({
        type: "nozka",
        name: "Nóżka regulowana " + (i + 1),
        width: legSize,
        height,
        depth: legSize,
        x,
        y: height / 2,
        z,
        thickness: legSize,
        material: "Nóżka regulowana ABS / metal",
        color: ELEMENT_DEFAULT_COLOR.nozka,
        quantity: 1,
      });
    });
    const maskH = Math.max(20, height - 10);
    els.push({
      type: "cokol",
      name: "Maskownica frontowa",
      width: panelWidth,
      height: maskH,
      depth: t,
      x: 0,
      y: 10 + maskH / 2,
      z: halfD - t / 2,
      thickness: t,
      material: "Płyta meblowa 18 mm (na klipsach)",
      color: ELEMENT_DEFAULT_COLOR.cokol,
      quantity: 1,
    });
  } else if (type === "cofniety") {
    const r = Math.max(0, recess);
    els.push({
      type: "cokol",
      name: "Cokół cofnięty (shadow gap)",
      width: outerWidth - 2 * t,
      height,
      depth: t,
      x: 0,
      y: height / 2,
      z: halfD - r - t / 2,
      thickness: t,
      material: "Płyta meblowa 18 mm",
      color: ELEMENT_DEFAULT_COLOR.cokol,
      quantity: 1,
      notes: "Cofnięty o " + r + " mm względem frontu",
    });
  } else if (type === "brak") {
    if (height > 0) {
      const decoSize = 60;
      const decoInset = 30;
      const positions: Array<[number, number]> = [
        [-halfW + decoInset + decoSize / 2, -halfD + decoInset + decoSize / 2],
        [halfW - decoInset - decoSize / 2, -halfD + decoInset + decoSize / 2],
        [-halfW + decoInset + decoSize / 2, halfD - decoInset - decoSize / 2],
        [halfW - decoInset - decoSize / 2, halfD - decoInset - decoSize / 2],
      ];
      positions.forEach(([x, z], i) => {
        els.push({
          type: "nozka",
          name: "Nóżka ozdobna " + (i + 1),
          width: decoSize,
          height,
          depth: decoSize,
          x,
          y: height / 2,
          z,
          thickness: decoSize,
          material: "Nóżka drewniana ozdobna",
          color: "#5a4a35",
          quantity: 1,
        });
      });
    }
  } else if (type === "systemowy") {
    legPositions().forEach(([x, z], i) => {
      els.push({
        type: "nozka",
        name: "Nóżka systemowa " + (i + 1),
        width: legSize,
        height,
        depth: legSize,
        x,
        y: height / 2,
        z,
        thickness: legSize,
        material: "Nóżka systemowa regulowana",
        color: ELEMENT_DEFAULT_COLOR.nozka,
        quantity: 1,
      });
    });
    const stripH = Math.max(20, height - 5);
    els.push({
      type: "cokol",
      name: "Listwa cokołowa systemowa",
      width: panelWidth,
      height: stripH,
      depth: 5,
      x: 0,
      y: 5 + stripH / 2,
      z: halfD - 2.5,
      thickness: 5,
      material: "PVC / aluminium",
      color: "#aaaaaa",
      quantity: 1,
    });
  }

  return els;
}

// ===== Buildery =====

function buildDefaultCabinet(name = "Szafa"): Cabinet {
  return {
    id: uid(),
    name,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    outerWidth: 1000,
    outerHeight: 2200,
    outerDepth: 600,
    plinthType: "staly",
    plinthHeight: 100,
    plinthRecess: 30,
    elements: buildDefaultWardrobeElements(1000, 2200, 600).map((e) => ({
      id: uid(),
      ...e,
    })),
  };
}

function buildEmptyCabinet(name = "Pusty moduł"): Cabinet {
  return {
    id: uid(),
    name,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    outerWidth: 600,
    outerHeight: 2200,
    outerDepth: 600,
    plinthType: "staly",
    plinthHeight: 100,
    plinthRecess: 30,
    elements: [],
  };
}

function buildDefaultProject(roomId: string, name = "Nowa zabudowa"): Project {
  return {
    id: uid(),
    roomId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    cabinets: [buildDefaultCabinet("Szafa 1")],
  };
}

function buildEmptyProject(roomId: string, name = "Nowa zabudowa"): Project {
  return {
    id: uid(),
    roomId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    cabinets: [buildEmptyCabinet("Moduł 1")],
  };
}

function buildDefaultRoom(name = "Mieszkanie"): Room {
  return {
    id: uid(),
    name,
    createdAt: Date.now(),
  };
}

function buildDefaultLayout(): RoomLayout {
  return {
    width: 4000,
    depth: 3000,
    height: 2600,
    wallThickness: 100,
    enabled: true,
    openings: [],
    alcoves: [],
  };
}

// ===== Pomocnicze =====

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
}

/** Oblicza nowe X dla nowej szafy „dostawionej" obok najbardziej wysuniętej.
 *  Uwzględnia rotacje – po obrocie 90° X-extent szafy = outerDepth/2. */
function nextOffsetForNewCabinet(
  cabinets: Cabinet[],
  newWidth: number
): number {
  if (cabinets.length === 0) return 0;
  const maxRight = Math.max(
    ...cabinets.map((c) => {
      const rotY = ((c.rotationY ?? 0) * Math.PI) / 180;
      const horiz = Math.abs(Math.cos(rotY)) > 0.5;
      const halfX = horiz ? c.outerWidth / 2 : c.outerDepth / 2;
      return c.offsetX + halfX;
    })
  );
  return maxRight + newWidth / 2;
}

interface ProjectSnapshot {
  label: string;
  project: Project;
  timestamp: number;
}

interface AppState {
  rooms: Room[];
  projects: Project[];
  activeRoomId: string;
  activeId: string;
  /** ID aktywnej szafy/modułu wewnątrz aktywnego projektu. */
  activeCabinetId: string;
  selectedElementId: string | null;
  /** Stos ostatnich migawek aktywnego projektu (do Cofnij). */
  undoStack: ProjectSnapshot[];
  /** Czy pokazywać etykiety z wymiarami pojedynczych elementów. */
  showDimensions: boolean;
  /** Czy pokazywać etykiety nad szafami (nazwa + gabaryty). */
  showCabinetLabels: boolean;
  /** Czy renderować ściany pomieszczenia w 3D. */
  showWalls: boolean;
  /** Czy zamiast ścian pokazać tylko obrys podłogi. */
  showFloorOutlineOnly: boolean;
  /** Tryb widoku: 3D scena lub 2D rzut z góry. */
  viewMode: "3d" | "2d";
  /** Ustawienia wyceny dla wszystkich projektów (proste, globalne). */
  pricing: PricingSettings;

  // Layout pomieszczenia
  toggleRoomLayout: (roomId: string, enabled: boolean) => void;
  setRoomLayout: (roomId: string, patch: Partial<RoomLayout>) => void;
  addRoomOpening: (roomId: string, op: Omit<RoomOpening, "id">) => void;
  updateRoomOpening: (
    roomId: string,
    id: string,
    patch: Partial<RoomOpening>
  ) => void;
  removeRoomOpening: (roomId: string, id: string) => void;
  addRoomAlcove: (roomId: string, alcove: Omit<RoomAlcove, "id">) => void;
  updateRoomAlcove: (
    roomId: string,
    id: string,
    patch: Partial<RoomAlcove>
  ) => void;
  removeRoomAlcove: (roomId: string, id: string) => void;

  // Pokoje
  setActive: (id: string) => void;
  setSelected: (id: string | null) => void;
  /** Zachowuje migawkę aktywnego projektu w stack undo (max 10). */
  pushUndo: (label: string) => void;
  /** Cofa ostatnią destruktywną zmianę aktywnego projektu. */
  undo: () => boolean;
  setShowDimensions: (v: boolean) => void;
  setShowCabinetLabels: (v: boolean) => void;
  setShowWalls: (v: boolean) => void;
  setShowFloorOutlineOnly: (v: boolean) => void;
  setViewMode: (m: "3d" | "2d") => void;
  setPricing: (patch: Partial<PricingSettings>) => void;
  setActiveRoom: (roomId: string) => void;
  addRoom: (name?: string) => void;
  renameRoom: (id: string, name: string) => void;
  deleteRoom: (id: string) => void;

  // Projekty
  newProject: (opts?: { empty?: boolean; name?: string }) => void;
  duplicateProject: () => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  moveProjectToRoom: (projectId: string, roomId: string) => void;

  // Szafy / moduły
  setActiveCabinet: (id: string) => void;
  addCabinet: (opts?: { empty?: boolean; name?: string }) => void;
  duplicateCabinet: (id?: string) => void;
  deleteCabinet: (id: string) => void;
  renameCabinet: (id: string, name: string) => void;
  setCabinetOffset: (id: string, x: number, y: number, z: number) => void;
  setCabinetRotationY: (id: string, deg: number) => void;
  setCabinetAnchor: (id: string, anchor: CabinetAnchor | null) => void;
  /** Ustawia wymiary szafy bez skalowania elementów (tylko podgląd kamery). */
  setCabinetOuter: (id: string, w: number, h: number, d: number) => void;
  /** Skaluje aktywną szafę: rozciąga elementy konstrukcyjne. */
  scaleActiveCabinet: (w: number, h: number, d: number) => void;
  /** Wymienia elementy cokołu/nóżek aktywnej szafy. */
  applyPlinth: (
    type: PlinthType,
    height: number,
    recess?: number,
    sideToFloor?: boolean
  ) => void;

  // Elementy (operują na aktywnej szafie)
  addElement: (type: ElementType) => void;
  duplicateElement: (id: string) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, patch: Partial<WardrobeElement>) => void;
  toggleHidden: (id: string) => void;
  showAll: () => void;
  resetActiveCabinet: () => void;

  /** Importuje projekt z linku share – tworzy/przypina przestrzeń „Udostępnione" i ustawia ją jako aktywną. */
  importSharedProject: (payload: {
    project: Project;
    roomName: string;
    roomLayout?: Room["layout"];
  }) => void;

  // Kreatory wieloelementowe (szuflada, drzwi)
  addDrawerSet: (params: {
    width: number;
    height: number;
    length: number;
    x: number;
    y: number;
    name?: string;
  }) => void;
  addDoorSet: (params: {
    count: number;
    totalWidth: number;
    height: number;
    gap: number;
    x: number;
    y: number;
    namePrefix?: string;
  }) => void;
}

/**
 * Aktualizuje aktywną szafę w aktywnym projekcie.
 * Zwraca patch dla `set` z zaktualizowaną tablicą `projects`.
 */
function patchActiveCabinet(
  state: AppState,
  mutator: (cab: Cabinet) => Cabinet
): Partial<AppState> {
  return {
    projects: state.projects.map((p) => {
      if (p.id !== state.activeId) return p;
      return touch({
        ...p,
        cabinets: p.cabinets.map((c) =>
          c.id === state.activeCabinetId ? mutator(c) : c
        ),
      });
    }),
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const initialRoom = buildDefaultRoom();
      const initialProject = buildDefaultProject(initialRoom.id);
      return {
        rooms: [initialRoom],
        projects: [initialProject],
        activeRoomId: initialRoom.id,
        activeId: initialProject.id,
        activeCabinetId: initialProject.cabinets[0].id,
        selectedElementId: null,
        undoStack: [],
        showDimensions: false,
        showCabinetLabels: false,
        showWalls: true,
        showFloorOutlineOnly: false,
        viewMode: "3d",
        pricing: { ...DEFAULT_PRICING },

        setActive: (id) =>
          set((s) => {
            const proj = s.projects.find((p) => p.id === id);
            if (!proj) return {};
            return {
              activeId: id,
              activeRoomId: proj.roomId,
              activeCabinetId:
                proj.cabinets[0]?.id ?? s.activeCabinetId,
              selectedElementId: null,
            };
          }),
        pushUndo: (label) => {
          set((s) => {
            const proj = s.projects.find((p) => p.id === s.activeId);
            if (!proj) return {};
            const snap: ProjectSnapshot = {
              label,
              project: JSON.parse(JSON.stringify(proj)),
              timestamp: Date.now(),
            };
            // Trzymamy max 10 ostatnich migawek.
            const next = [...s.undoStack, snap].slice(-10);
            return { undoStack: next };
          });
        },
        undo: () => {
          const { undoStack, activeId } = get();
          if (undoStack.length === 0) return false;
          const last = undoStack[undoStack.length - 1];
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === activeId ? { ...last.project, id: p.id } : p
            ),
            undoStack: s.undoStack.slice(0, -1),
            selectedElementId: null,
          }));
          return true;
        },
        setSelected: (id) => {
          // Jeśli zaznaczamy element z innej szafy, przełączamy też aktywną
          // szafę żeby edytor pokazał właściwy moduł.
          set((s) => {
            if (!id) return { selectedElementId: null };
            const proj = s.projects.find((p) => p.id === s.activeId);
            if (!proj) return { selectedElementId: id };
            const cab = proj.cabinets.find((c) =>
              c.elements.some((e) => e.id === id)
            );
            return {
              selectedElementId: id,
              activeCabinetId: cab?.id ?? s.activeCabinetId,
            };
          });
        },
        setShowDimensions: (v) => set({ showDimensions: v }),
        setShowCabinetLabels: (v) => set({ showCabinetLabels: v }),
        setShowWalls: (v) => set({ showWalls: v }),
        setShowFloorOutlineOnly: (v) => set({ showFloorOutlineOnly: v }),
        setViewMode: (m) => set({ viewMode: m }),
        setPricing: (patch) =>
          set((s) => ({ pricing: { ...s.pricing, ...patch } })),

        toggleRoomLayout: (roomId, enabled) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId) return r;
              if (!enabled) {
                return r.layout
                  ? { ...r, layout: { ...r.layout, enabled: false } }
                  : r;
              }
              return {
                ...r,
                layout: r.layout
                  ? { ...r.layout, enabled: true }
                  : buildDefaultLayout(),
              };
            }),
          })),
        setRoomLayout: (roomId, patch) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId) return r;
              const base = r.layout ?? buildDefaultLayout();
              return { ...r, layout: { ...base, ...patch } };
            }),
          })),
        addRoomOpening: (roomId, op) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId) return r;
              const base = r.layout ?? buildDefaultLayout();
              return {
                ...r,
                layout: {
                  ...base,
                  openings: [...base.openings, { id: uid(), ...op }],
                },
              };
            }),
          })),
        updateRoomOpening: (roomId, id, patch) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId || !r.layout) return r;
              return {
                ...r,
                layout: {
                  ...r.layout,
                  openings: r.layout.openings.map((o) =>
                    o.id === id ? { ...o, ...patch } : o
                  ),
                },
              };
            }),
          })),
        removeRoomOpening: (roomId, id) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId || !r.layout) return r;
              return {
                ...r,
                layout: {
                  ...r.layout,
                  openings: r.layout.openings.filter((o) => o.id !== id),
                },
              };
            }),
          })),
        addRoomAlcove: (roomId, alcove) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId) return r;
              const base = r.layout ?? buildDefaultLayout();
              return {
                ...r,
                layout: {
                  ...base,
                  alcoves: [...base.alcoves, { id: uid(), ...alcove }],
                },
              };
            }),
          })),
        updateRoomAlcove: (roomId, id, patch) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId || !r.layout) return r;
              return {
                ...r,
                layout: {
                  ...r.layout,
                  alcoves: r.layout.alcoves.map((a) =>
                    a.id === id ? { ...a, ...patch } : a
                  ),
                },
              };
            }),
          })),
        removeRoomAlcove: (roomId, id) =>
          set((s) => ({
            rooms: s.rooms.map((r) => {
              if (r.id !== roomId || !r.layout) return r;
              return {
                ...r,
                layout: {
                  ...r.layout,
                  alcoves: r.layout.alcoves.filter((a) => a.id !== id),
                },
              };
            }),
          })),
        setActiveRoom: (roomId) =>
          set((s) => {
            const room = s.rooms.find((r) => r.id === roomId);
            if (!room) return {};
            const inRoom = s.projects.filter((p) => p.roomId === roomId);
            const nextProj = inRoom[0];
            return {
              activeRoomId: roomId,
              activeId: nextProj?.id ?? s.activeId,
              activeCabinetId:
                nextProj?.cabinets[0]?.id ?? s.activeCabinetId,
              selectedElementId: null,
            };
          }),
        addRoom: (name) => {
          const room = buildDefaultRoom(name || "Nowa przestrzeń");
          const proj = buildEmptyProject(room.id, "Nowa zabudowa");
          set((s) => ({
            rooms: [...s.rooms, room],
            projects: [...s.projects, proj],
            activeRoomId: room.id,
            activeId: proj.id,
            activeCabinetId: proj.cabinets[0].id,
            selectedElementId: null,
          }));
        },
        renameRoom: (id, name) => {
          set((s) => ({
            rooms: s.rooms.map((r) => (r.id === id ? { ...r, name } : r)),
          }));
        },
        deleteRoom: (id) => {
          set((s) => {
            const remainingRooms = s.rooms.filter((r) => r.id !== id);
            if (remainingRooms.length === 0) {
              const fresh = buildDefaultRoom();
              const freshProj = buildDefaultProject(fresh.id);
              return {
                rooms: [fresh],
                projects: [freshProj],
                activeRoomId: fresh.id,
                activeId: freshProj.id,
                activeCabinetId: freshProj.cabinets[0].id,
                selectedElementId: null,
              };
            }
            const remainingProjects = s.projects.filter(
              (p) => p.roomId !== id
            );
            const nextRoom =
              remainingRooms.find((r) => r.id === s.activeRoomId) ??
              remainingRooms[0];
            const nextProj = remainingProjects.find(
              (p) => p.roomId === nextRoom.id
            );
            return {
              rooms: remainingRooms,
              projects: remainingProjects,
              activeRoomId: nextRoom.id,
              activeId: nextProj?.id ?? s.activeId,
              activeCabinetId:
                nextProj?.cabinets[0]?.id ?? s.activeCabinetId,
              selectedElementId: null,
            };
          });
        },

        newProject: (opts) => {
          set((s) => {
            const roomId = s.activeRoomId || s.rooms[0]?.id;
            if (!roomId) return {};
            const p = opts?.empty
              ? buildEmptyProject(roomId, opts.name)
              : buildDefaultProject(roomId, opts?.name);
            return {
              projects: [...s.projects, p],
              activeId: p.id,
              activeRoomId: roomId,
              activeCabinetId: p.cabinets[0].id,
              selectedElementId: null,
            };
          });
        },
        duplicateProject: () => {
          const { projects, activeId } = get();
          const src = projects.find((p) => p.id === activeId);
          if (!src) return;
          const copy: Project = {
            ...src,
            id: uid(),
            name: src.name + " (kopia)",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cabinets: src.cabinets.map((c) => ({
              ...c,
              id: uid(),
              elements: c.elements.map((e) => ({ ...e, id: uid() })),
            })),
          };
          set((s) => ({
            projects: [...s.projects, copy],
            activeId: copy.id,
            activeRoomId: copy.roomId,
            activeCabinetId: copy.cabinets[0].id,
            selectedElementId: null,
          }));
        },
        deleteProject: (id) => {
          set((s) => {
            const removed = s.projects.find((p) => p.id === id);
            const remaining = s.projects.filter((p) => p.id !== id);
            const roomId = removed?.roomId ?? s.activeRoomId;
            const stillInRoom = remaining.filter((p) => p.roomId === roomId);
            const next =
              stillInRoom.length > 0
                ? remaining
                : [...remaining, buildDefaultProject(roomId)];
            const nextActive =
              next.find((p) => p.roomId === roomId) ?? next[0];
            return {
              projects: next,
              activeId: nextActive.id,
              activeRoomId: nextActive.roomId,
              activeCabinetId: nextActive.cabinets[0].id,
              selectedElementId: null,
            };
          });
        },
        moveProjectToRoom: (projectId, roomId) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId ? touch({ ...p, roomId }) : p
            ),
            activeRoomId:
              s.activeId === projectId ? roomId : s.activeRoomId,
          }));
        },
        renameProject: (id, name) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === id ? touch({ ...p, name }) : p
            ),
          }));
        },

        // ===== Szafy / moduły =====

        setActiveCabinet: (id) =>
          set({ activeCabinetId: id, selectedElementId: null }),

        addCabinet: (opts) => {
          set((s) => {
            const proj = s.projects.find((p) => p.id === s.activeId);
            if (!proj) return {};
            const newCab = opts?.empty
              ? buildEmptyCabinet(opts.name || `Moduł ${proj.cabinets.length + 1}`)
              : buildDefaultCabinet(
                  opts?.name || `Szafa ${proj.cabinets.length + 1}`
                );
            // Dostawiamy obok ostatniej szafy.
            newCab.offsetX = nextOffsetForNewCabinet(
              proj.cabinets,
              newCab.outerWidth
            );
            return {
              projects: s.projects.map((p) =>
                p.id === s.activeId
                  ? touch({ ...p, cabinets: [...p.cabinets, newCab] })
                  : p
              ),
              activeCabinetId: newCab.id,
              selectedElementId: null,
            };
          });
        },
        duplicateCabinet: (id) => {
          set((s) => {
            const proj = s.projects.find((p) => p.id === s.activeId);
            if (!proj) return {};
            const sourceId = id ?? s.activeCabinetId;
            const src = proj.cabinets.find((c) => c.id === sourceId);
            if (!src) return {};
            const copy: Cabinet = {
              ...src,
              id: uid(),
              name: src.name + " (kopia)",
              offsetX: nextOffsetForNewCabinet(proj.cabinets, src.outerWidth),
              elements: src.elements.map((e) => ({ ...e, id: uid() })),
            };
            return {
              projects: s.projects.map((p) =>
                p.id === s.activeId
                  ? touch({ ...p, cabinets: [...p.cabinets, copy] })
                  : p
              ),
              activeCabinetId: copy.id,
              selectedElementId: null,
            };
          });
        },
        deleteCabinet: (id) => {
          set((s) => {
            const proj = s.projects.find((p) => p.id === s.activeId);
            if (!proj) return {};
            const remaining = proj.cabinets.filter((c) => c.id !== id);
            const next =
              remaining.length > 0 ? remaining : [buildEmptyCabinet("Moduł 1")];
            // Aktywny pozostaje jeśli wciąż istnieje, inaczej pierwsza szafa.
            const newActive =
              next.find((c) => c.id === s.activeCabinetId)?.id ?? next[0].id;
            return {
              projects: s.projects.map((p) =>
                p.id === s.activeId ? touch({ ...p, cabinets: next }) : p
              ),
              activeCabinetId: newActive,
              selectedElementId: null,
            };
          });
        },
        renameCabinet: (id, name) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    cabinets: p.cabinets.map((c) =>
                      c.id === id ? { ...c, name } : c
                    ),
                  })
                : p
            ),
          }));
        },
        setCabinetOffset: (id, x, y, z) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    cabinets: p.cabinets.map((c) =>
                      c.id === id
                        ? { ...c, offsetX: x, offsetY: y, offsetZ: z }
                        : c
                    ),
                  })
                : p
            ),
          }));
        },
        setCabinetRotationY: (id, deg) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    cabinets: p.cabinets.map((c) =>
                      c.id === id ? { ...c, rotationY: deg } : c
                    ),
                  })
                : p
            ),
          }));
        },
        setCabinetAnchor: (id, anchor) => {
          // Gdy anchor staje się aktywny, zachowujemy aktualny manualny offset
          // i rotację jako fallback (do przywrócenia po odpięciu). Gdy anchor
          // staje się null, próbujemy odbudować pozycję ze snapshot albo
          // używamy obecnej resolved transform jako nowego manualnego offsetu,
          // żeby szafa nie skoczyła.
          set((s) => ({
            projects: s.projects.map((p) => {
              if (p.id !== s.activeId) return p;
              return touch({
                ...p,
                cabinets: p.cabinets.map((c) => {
                  if (c.id !== id) return c;
                  if (anchor) {
                    // Zachowaj snapshot manualnych pozycji w notes wewnętrznych
                    // (nie tworzymy osobnego pola żeby nie psuć migracji).
                    return {
                      ...c,
                      anchor,
                      // Wyzeruj manualną rotację – anchor nadpisuje, ale gdy
                      // odepniesz, lepiej zacząć od 0 niż mieć stary kąt.
                      rotationY: 0,
                    };
                  }
                  // Anchor → null: zostawiamy istniejące offsetX/Y/Z (które są
                  // ostatnimi manualnymi). Ewentualne dryfowanie napraw user
                  // ręcznie polem offset.
                  return { ...c, anchor: undefined };
                }),
              });
            }),
          }));
        },
        setCabinetOuter: (id, w, h, d) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    cabinets: p.cabinets.map((c) =>
                      c.id === id
                        ? { ...c, outerWidth: w, outerHeight: h, outerDepth: d }
                        : c
                    ),
                  })
                : p
            ),
          }));
        },
        scaleActiveCabinet: (newW, newH, newD) => {
          get().pushUndo("Skaluj szafę");
          set((s) =>
            patchActiveCabinet(s, (c) => {
              const rx = newW / Math.max(1, c.outerWidth);
              const ry = newH / Math.max(1, c.outerHeight);
              const rz = newD / Math.max(1, c.outerDepth);
              const round = (v: number) => Math.round(v * 10) / 10;
              const elements = c.elements.map((el) => {
                const t = Math.max(1, el.thickness);
                const stretchX = el.width > t * 4;
                const stretchY = el.height > t * 4;
                const stretchZ = el.depth > t * 4;
                return {
                  ...el,
                  width: stretchX ? Math.round(el.width * rx) : el.width,
                  height: stretchY ? Math.round(el.height * ry) : el.height,
                  depth: stretchZ ? Math.round(el.depth * rz) : el.depth,
                  x: round(el.x * rx),
                  y: round(el.y * ry),
                  z: round(el.z * rz),
                };
              });
              return {
                ...c,
                outerWidth: newW,
                outerHeight: newH,
                outerDepth: newD,
                elements,
              };
            })
          );
        },
        applyPlinth: (type, height, recess, sideToFloor) => {
          // Migawka pre-zmiana do undo.
          get().pushUndo("Zastosuj cokół");
          set((s) =>
            patchActiveCabinet(s, (c) => {
              // Walidacja: cokół musi zostawić sensowną wysokość boków.
              const safeHeight = Math.max(
                0,
                Math.min(height, c.outerHeight - 50)
              );
              const stf = sideToFloor ?? c.sideToFloor ?? false;
              const oldHeight = c.plinthHeight ?? 100;
              const dy = safeHeight - oldHeight;
              // Wyznaczamy docelowe wymiary boków:
              // - boki do podłogi: pełna wysokość szafy, środek na H/2,
              // - boki do cokołu (klasycznie): wysokość = H - cokol, siedzą
              //   na cokole.
              const sideH = stf
                ? c.outerHeight
                : Math.max(0, c.outerHeight - safeHeight);
              const sideY = stf
                ? c.outerHeight / 2
                : safeHeight + sideH / 2;
              const carcass = c.elements
                .filter((e) => e.type !== "cokol" && e.type !== "nozka")
                .map((e) => {
                  // Boki normalizujemy zawsze, niezależnie od ich starej
                  // wysokości / pozycji – żeby tryb był spójny.
                  if (e.type === "bok") {
                    return { ...e, height: sideH, y: sideY };
                  }
                  // Pozostałe elementy korpusu przesuwamy razem z cokołem.
                  return dy ? { ...e, y: e.y + dy } : e;
                });
              const plinth = buildPlinthElements(
                type,
                c.outerWidth,
                c.outerDepth,
                safeHeight,
                Math.max(0, recess ?? c.plinthRecess ?? 30),
                stf
              ).map((e) => ({ id: uid(), ...e }));
              return {
                ...c,
                elements: [...carcass, ...plinth],
                plinthType: type,
                plinthHeight: safeHeight,
                plinthRecess: recess ?? c.plinthRecess ?? 30,
                sideToFloor: stf,
              };
            })
          );
        },

        // ===== Elementy =====

        addElement: (type) => {
          const id = uid();
          const newEl: WardrobeElement = {
            id,
            type,
            name: ELEMENT_LABELS[type],
            width: type === "plecy" ? 800 : 600,
            height:
              type === "polka" || type === "wieniec" || type === "cokol"
                ? ELEMENT_DEFAULT_THICKNESS[type]
                : type === "drazek"
                  ? 25
                  : type === "nozka"
                    ? 100
                    : 800,
            depth:
              type === "bok" || type === "drzwi" || type === "front-szuflady"
                ? ELEMENT_DEFAULT_THICKNESS[type]
                : type === "plecy"
                  ? 3
                  : type === "drazek" || type === "nozka"
                    ? 50
                    : 580,
            x: 0,
            y: type === "nozka" ? 50 : 500,
            z: 0,
            thickness: ELEMENT_DEFAULT_THICKNESS[type],
            material:
              type === "plecy"
                ? "HDF 3 mm"
                : type === "drazek"
                  ? "Rurka metalowa Ø25"
                  : type === "nozka"
                    ? "Nóżka regulowana ABS / metal"
                    : "Płyta meblowa 18 mm",
            color: ELEMENT_DEFAULT_COLOR[type],
            quantity: 1,
          };
          set((s) =>
            patchActiveCabinet(s, (c) => ({
              ...c,
              elements: [...c.elements, newEl],
            }))
          );
          set({ selectedElementId: id });
        },
        duplicateElement: (id) => {
          set((s) =>
            patchActiveCabinet(s, (c) => {
              const src = c.elements.find((e) => e.id === id);
              if (!src) return c;
              const copy: WardrobeElement = {
                ...src,
                id: uid(),
                name: src.name + " (kopia)",
                x: src.x + 50,
              };
              return { ...c, elements: [...c.elements, copy] };
            })
          );
        },
        removeElement: (id) => {
          set((s) => ({
            ...patchActiveCabinet(s, (c) => ({
              ...c,
              elements: c.elements.filter((e) => e.id !== id),
            })),
            selectedElementId:
              s.selectedElementId === id ? null : s.selectedElementId,
          }));
        },
        updateElement: (id, patch) => {
          set((s) =>
            patchActiveCabinet(s, (c) => ({
              ...c,
              elements: c.elements.map((e) =>
                e.id === id ? { ...e, ...patch } : e
              ),
            }))
          );
        },
        toggleHidden: (id) => {
          set((s) =>
            patchActiveCabinet(s, (c) => ({
              ...c,
              elements: c.elements.map((e) =>
                e.id === id ? { ...e, hidden: !e.hidden } : e
              ),
            }))
          );
        },
        showAll: () => {
          set((s) =>
            patchActiveCabinet(s, (c) => ({
              ...c,
              elements: c.elements.map((e) => ({ ...e, hidden: false })),
            }))
          );
        },
        resetActiveCabinet: () => {
          get().pushUndo("Reset szafy do szablonu");
          set((s) =>
            patchActiveCabinet(s, (c) => ({
              ...c,
              elements: buildDefaultWardrobeElements(
                c.outerWidth,
                c.outerHeight,
                c.outerDepth
              ).map((e) => ({ id: uid(), ...e })),
            }))
          );
          set({ selectedElementId: null });
        },

        importSharedProject: (payload) => {
          set((s) => {
            // Znajdź lub utwórz przestrzeń „Udostępnione".
            let target = s.rooms.find(
              (r) => r.name === "Udostępnione (link)"
            );
            const newRooms = [...s.rooms];
            if (!target) {
              target = {
                id: uid(),
                name: "Udostępnione (link)",
                createdAt: Date.now(),
                layout: payload.roomLayout,
              };
              newRooms.push(target);
            }
            // Wzbogać nazwę o timestamp gdy ta sama nazwa już jest w środku –
            // chroni przed duplikatami wizualnymi przy podwójnym imporcie.
            const baseName =
              payload.project.name +
              " (z linku · " +
              payload.roomName +
              ")";
            const existingNames = s.projects
              .filter((p) => p.roomId === target!.id)
              .map((p) => p.name);
            const finalName = existingNames.includes(baseName)
              ? baseName +
                " " +
                new Date().toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : baseName;
            // Skopiuj projekt z całkiem nowymi ID (cabinet, elementy).
            const importedProject: Project = {
              ...payload.project,
              id: uid(),
              roomId: target.id,
              name: finalName,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              cabinets: payload.project.cabinets.map((c) => ({
                ...c,
                id: uid(),
                elements: c.elements.map((e) => ({ ...e, id: uid() })),
              })),
            };
            return {
              rooms: newRooms,
              projects: [...s.projects, importedProject],
              activeRoomId: target.id,
              activeId: importedProject.id,
              activeCabinetId: importedProject.cabinets[0]?.id ?? "",
              selectedElementId: null,
            };
          });
        },

        addDrawerSet: (params) => {
          // Budujemy 5 elementów szuflady wg standardu 18 mm korpus + 3 mm HDF dno.
          const { width: W, height: H, x, y, name } = params;
          const t = 18;
          const baseName = name?.trim() || "Szuflada";
          if (W <= 0 || H <= 0 || params.length <= 0) return;
          set((s) =>
            patchActiveCabinet(s, (c) => {
              // Klampuj długość boków do głębokości szafy minus margines na prowadnicę.
              const L = Math.max(
                50,
                Math.min(params.length, c.outerDepth - 30)
              );
              const cabinetHalfDepth = c.outerDepth / 2;
              // Front = z lekkim wystawaniem na zewnątrz.
              const frontZ = cabinetHalfDepth + t / 2;
              const backOfFrontZ = cabinetHalfDepth;
              const drawerInsideEndZ = backOfFrontZ - L;
              const sidesCenterZ = (backOfFrontZ + drawerInsideEndZ) / 2;
              const els: WardrobeElement[] = [
                {
                  id: uid(),
                  type: "front-szuflady",
                  name: baseName + " – front",
                  width: W,
                  height: H,
                  depth: t,
                  x,
                  y,
                  z: frontZ,
                  thickness: t,
                  material: "Płyta meblowa 18 mm",
                  color: ELEMENT_DEFAULT_COLOR["front-szuflady"],
                  quantity: 1,
                },
                {
                  id: uid(),
                  type: "bok",
                  name: baseName + " – bok lewy",
                  width: t,
                  height: Math.max(20, H - 20),
                  depth: L,
                  x: x - W / 2 + t / 2,
                  y,
                  z: sidesCenterZ,
                  thickness: t,
                  material: "Płyta meblowa 18 mm",
                  color: ELEMENT_DEFAULT_COLOR.bok,
                  quantity: 1,
                  notes: "Bok szuflady",
                },
                {
                  id: uid(),
                  type: "bok",
                  name: baseName + " – bok prawy",
                  width: t,
                  height: Math.max(20, H - 20),
                  depth: L,
                  x: x + W / 2 - t / 2,
                  y,
                  z: sidesCenterZ,
                  thickness: t,
                  material: "Płyta meblowa 18 mm",
                  color: ELEMENT_DEFAULT_COLOR.bok,
                  quantity: 1,
                  notes: "Bok szuflady",
                },
                {
                  id: uid(),
                  type: "plecy",
                  name: baseName + " – tył",
                  width: Math.max(20, W - 2 * t - 4),
                  height: Math.max(20, H - 30),
                  depth: t,
                  x,
                  y,
                  z: drawerInsideEndZ + t / 2,
                  thickness: t,
                  material: "Płyta meblowa 18 mm",
                  color: ELEMENT_DEFAULT_COLOR.plecy,
                  quantity: 1,
                  notes: "Tył szuflady (płyta)",
                },
                {
                  id: uid(),
                  type: "polka",
                  name: baseName + " – dno HDF",
                  width: Math.max(20, W - 2 * t - 4),
                  height: 3,
                  depth: Math.max(20, L - t - 4),
                  x,
                  y: y - H / 2 + 5,
                  z: sidesCenterZ,
                  thickness: 3,
                  material: "HDF 3 mm",
                  color: ELEMENT_DEFAULT_COLOR.polka,
                  quantity: 1,
                  notes: "Dno szuflady",
                },
              ];
              return { ...c, elements: [...c.elements, ...els] };
            })
          );
        },

        addDoorSet: (params) => {
          const {
            count,
            totalWidth,
            height,
            gap,
            x,
            y,
            namePrefix,
          } = params;
          const n = Math.max(1, Math.min(6, Math.round(count)));
          const safeGap = Math.max(0, gap);
          const t = 18;
          const eachW = (totalWidth - (n - 1) * safeGap) / n;
          if (eachW <= 0 || height <= 0 || totalWidth <= 0) {
            console.warn(
              "addDoorSet: parametry niepoprawne (eachW=" +
                eachW +
                ", height=" +
                height +
                ", totalWidth=" +
                totalWidth +
                ")"
            );
            return;
          }
          const prefix = namePrefix?.trim() || "Drzwi";
          set((s) =>
            patchActiveCabinet(s, (c) => {
              const z = c.outerDepth / 2 + t / 2;
              const startX = x - totalWidth / 2 + eachW / 2;
              const els: WardrobeElement[] = [];
              for (let i = 0; i < n; i++) {
                els.push({
                  id: uid(),
                  type: "drzwi",
                  name:
                    prefix +
                    " " +
                    (n === 1
                      ? ""
                      : i === 0
                        ? "(lewe)"
                        : i === n - 1
                          ? "(prawe)"
                          : "(środk. " + i + ")"),
                  width: eachW,
                  height,
                  depth: t,
                  x: startX + i * (eachW + safeGap),
                  y,
                  z,
                  thickness: t,
                  material: "Płyta meblowa 18 mm",
                  color: ELEMENT_DEFAULT_COLOR.drzwi,
                  quantity: 1,
                });
              }
              return { ...c, elements: [...c.elements, ...els] };
            })
          );
        },
      };
    },
    {
      name: "meble3d-store-v1",
      version: 4,
      migrate: (persistedState: any, fromVersion: number) => {
        if (!persistedState) return persistedState;
        let state = persistedState;

        // v1 -> v2: dodaj pokoje
        if (fromVersion < 2) {
          const defaultRoom = buildDefaultRoom("Mieszkanie");
          const projects = (state.projects ?? []).map((p: any) => ({
            ...p,
            roomId: defaultRoom.id,
          }));
          state = {
            ...state,
            rooms: [defaultRoom],
            activeRoomId: defaultRoom.id,
            projects: projects.length
              ? projects
              : [buildDefaultProject(defaultRoom.id)],
            activeId: projects[0]?.id ?? state.activeId,
          };
        }
        // v3 -> v4: dodano opcjonalny `layout` do Room. Normalizujemy też
        // szafy bez wymaganych pól (fallback na sensowne defaulty żeby
        // stara skażona perystencja nie wywaliła app).
        if (fromVersion < 4) {
          state = {
            ...state,
            rooms: (state.rooms ?? []).map((r: any) => ({ ...r })),
            projects: (state.projects ?? []).map((p: any) => ({
              ...p,
              cabinets: (p.cabinets ?? []).map((c: any) => ({
                id: c.id ?? uid(),
                name: c.name ?? "Szafa",
                offsetX: Number.isFinite(c.offsetX) ? c.offsetX : 0,
                offsetY: Number.isFinite(c.offsetY) ? c.offsetY : 0,
                offsetZ: Number.isFinite(c.offsetZ) ? c.offsetZ : 0,
                outerWidth: Number.isFinite(c.outerWidth) ? c.outerWidth : 1000,
                outerHeight: Number.isFinite(c.outerHeight)
                  ? c.outerHeight
                  : 2200,
                outerDepth: Number.isFinite(c.outerDepth) ? c.outerDepth : 600,
                plinthType: c.plinthType ?? "staly",
                plinthHeight: Number.isFinite(c.plinthHeight)
                  ? c.plinthHeight
                  : 100,
                plinthRecess: Number.isFinite(c.plinthRecess)
                  ? c.plinthRecess
                  : 30,
                sideToFloor: !!c.sideToFloor,
                rotationY: Number.isFinite(c.rotationY) ? c.rotationY : 0,
                anchor: c.anchor,
                elements: Array.isArray(c.elements) ? c.elements : [],
              })),
            })),
          };
        }
        // v2 -> v3: zawiń elementy projektu w pierwszą szafę (Cabinet)
        if (fromVersion < 3) {
          const projects = (state.projects ?? []).map((p: any) => {
            if (Array.isArray(p.cabinets) && p.cabinets.length > 0) return p;
            const cabinet: Cabinet = {
              id: uid(),
              name: "Szafa 1",
              offsetX: 0,
              offsetY: 0,
              offsetZ: 0,
              outerWidth: p.outerWidth ?? 1000,
              outerHeight: p.outerHeight ?? 2200,
              outerDepth: p.outerDepth ?? 600,
              plinthType: p.plinthType ?? "staly",
              plinthHeight: p.plinthHeight ?? 100,
              plinthRecess: p.plinthRecess ?? 30,
              elements: p.elements ?? [],
            };
            const {
              elements: _e,
              outerWidth: _w,
              outerHeight: _h,
              outerDepth: _d,
              plinthType: _pt,
              plinthHeight: _ph,
              plinthRecess: _pr,
              ...rest
            } = p;
            return { ...rest, cabinets: [cabinet] };
          });
          const activeProj = projects.find(
            (p: Project) => p.id === state.activeId
          );
          state = {
            ...state,
            projects,
            activeCabinetId:
              activeProj?.cabinets?.[0]?.id ??
              projects[0]?.cabinets?.[0]?.id,
          };
        }
        return state;
      },
    }
  )
);

// ===== Hooki =====

export function useActiveProject(): Project {
  const { projects, activeId } = useStore();
  return projects.find((p) => p.id === activeId) ?? projects[0];
}

export function useActiveRoom(): Room {
  const { rooms, activeRoomId } = useStore();
  return rooms.find((r) => r.id === activeRoomId) ?? rooms[0];
}

export function useProjectsInActiveRoom(): Project[] {
  const { projects, activeRoomId } = useStore();
  return projects.filter((p) => p.roomId === activeRoomId);
}

export function useActiveCabinet(): Cabinet {
  const project = useActiveProject();
  const activeCabinetId = useStore((s) => s.activeCabinetId);
  return (
    project.cabinets.find((c) => c.id === activeCabinetId) ??
    project.cabinets[0]
  );
}

export function useActiveRoomLayout(): RoomLayout | undefined {
  const room = useActiveRoom();
  return room.layout;
}

/**
 * Wylicza końcową pozycję i rotację (Y) szafy w świecie.
 * Gdy szafa ma `anchor` i layout pomieszczenia jest aktywny – pozycja oraz
 * rotacja są pochodne z anchor + wymiarów ściany. W przeciwnym razie zwracamy
 * manualne offset* + rotationY (lub 0).
 */
export function resolveCabinetTransform(
  cabinet: Cabinet,
  layout: RoomLayout | undefined
): {
  position: [number, number, number];
  rotationY: number;
  anchored: boolean;
} {
  const manual = {
    position: [cabinet.offsetX, cabinet.offsetY, cabinet.offsetZ] as [
      number,
      number,
      number,
    ],
    rotationY: ((cabinet.rotationY ?? 0) * Math.PI) / 180,
    anchored: false,
  };
  if (!cabinet.anchor || !layout || !layout.enabled) return manual;
  const a = cabinet.anchor;
  const halfW = layout.width / 2;
  const halfD = layout.depth / 2;
  const gap = a.gap ?? 0;
  const w = cabinet.outerWidth;
  const d = cabinet.outerDepth;
  const wall: WallSide = a.wall;
  let x = 0;
  let z = 0;
  let rot = 0;
  switch (wall) {
    case "N":
      // Tył szafy przy z=-halfD+gap, lewa krawędź szafy przy x=-halfW+offset.
      x = -halfW + a.offset + w / 2;
      z = -halfD + gap + d / 2;
      rot = 0;
      break;
    case "S":
      // Tył przy z=halfD-gap; offset od „lewej z wewnątrz" = +X strona.
      x = halfW - a.offset - w / 2;
      z = halfD - gap - d / 2;
      rot = Math.PI;
      break;
    case "W":
      // Tył przy x=-halfW+gap; offset od „lewej z wewnątrz" = +Z strona.
      x = -halfW + gap + d / 2;
      z = halfD - a.offset - w / 2;
      rot = Math.PI / 2;
      break;
    case "E":
      // Tył przy x=halfW-gap; offset od „lewej z wewnątrz" = -Z strona.
      x = halfW - gap - d / 2;
      z = -halfD + a.offset + w / 2;
      rot = -Math.PI / 2;
      break;
  }
  return {
    position: [x, cabinet.offsetY, z],
    rotationY: rot,
    anchored: true,
  };
}
