import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Cabinet,
  ELEMENT_DEFAULT_COLOR,
  ELEMENT_DEFAULT_THICKNESS,
  ELEMENT_LABELS,
  PlinthType,
  Project,
  Room,
  RoomAlcove,
  RoomLayout,
  RoomOpening,
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

/** Oblicza nowe X dla nowej szafy "dostawionej" obok najbardziej wysuniętej. */
function nextOffsetForNewCabinet(
  cabinets: Cabinet[],
  newWidth: number
): number {
  if (cabinets.length === 0) return 0;
  const maxRight = Math.max(
    ...cabinets.map((c) => c.offsetX + c.outerWidth / 2)
  );
  return maxRight + newWidth / 2;
}

interface AppState {
  rooms: Room[];
  projects: Project[];
  activeRoomId: string;
  activeId: string;
  /** ID aktywnej szafy/modułu wewnątrz aktywnego projektu. */
  activeCabinetId: string;
  selectedElementId: string | null;
  /** Czy pokazywać etykiety z wymiarami pojedynczych elementów. */
  showDimensions: boolean;
  /** Czy pokazywać etykiety nad szafami (nazwa + gabaryty). */
  showCabinetLabels: boolean;
  /** Czy renderować ściany pomieszczenia w 3D. */
  showWalls: boolean;
  /** Czy zamiast ścian pokazać tylko obrys podłogi. */
  showFloorOutlineOnly: boolean;

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
  setShowDimensions: (v: boolean) => void;
  setShowCabinetLabels: (v: boolean) => void;
  setShowWalls: (v: boolean) => void;
  setShowFloorOutlineOnly: (v: boolean) => void;
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
        showDimensions: false,
        showCabinetLabels: false,
        showWalls: true,
        showFloorOutlineOnly: false,

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
            const newActive = next.find((c) => c.id === s.activeCabinetId)
              ? s.activeCabinetId
              : next[0].id;
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
          set((s) =>
            patchActiveCabinet(s, (c) => {
              const stf = sideToFloor ?? c.sideToFloor ?? false;
              const oldHeight = c.plinthHeight ?? 100;
              const dy = height - oldHeight;
              // Wyznaczamy docelowe wymiary boków:
              // - boki do podłogi: pełna wysokość szafy, środek na H/2,
              // - boki do cokołu (klasycznie): wysokość = H - cokol, siedzą
              //   na cokole.
              const sideH = stf
                ? c.outerHeight
                : Math.max(0, c.outerHeight - height);
              const sideY = stf
                ? c.outerHeight / 2
                : height + sideH / 2;
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
                Math.max(0, height),
                Math.max(0, recess ?? c.plinthRecess ?? 30),
                stf
              ).map((e) => ({ id: uid(), ...e }));
              return {
                ...c,
                elements: [...carcass, ...plinth],
                plinthType: type,
                plinthHeight: height,
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
        // v3 -> v4: dodano opcjonalny `layout` do Room. Nic nie zmieniamy
        // w danych - po prostu pole pozostaje undefined dla starych przestrzeni.
        if (fromVersion < 4) {
          // no-op - dla pewności normalizujemy tablice
          state = {
            ...state,
            rooms: (state.rooms ?? []).map((r: any) => ({ ...r })),
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
