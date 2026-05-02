import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ELEMENT_DEFAULT_COLOR,
  ELEMENT_DEFAULT_THICKNESS,
  ELEMENT_LABELS,
  Project,
  Room,
  WardrobeElement,
  ElementType,
} from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function buildDefaultWardrobe(): WardrobeElement[] {
  // Domyślna szafa 1000 x 2200 x 600 mm zbudowana z typowych elementów.
  const W = 1000;
  const H = 2200;
  const D = 600;
  const t = 18;
  const backT = 3;
  const plinthH = 100;

  const innerH = H - 2 * t - plinthH;
  const innerW = W - 2 * t;

  const els: WardrobeElement[] = [];
  const push = (e: Omit<WardrobeElement, "id">) =>
    els.push({ id: uid(), ...e });

  // Cokół
  push({
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
  push({
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
  push({
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
  push({
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
  push({
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

  // Plecy HDF
  push({
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

  // Półka środkowa
  push({
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

  // Drążek na ubrania (w górnej części)
  push({
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
  push({
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
  push({
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

function buildDefaultProject(roomId: string, name = "Nowa szafa"): Project {
  return {
    id: uid(),
    roomId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: buildDefaultWardrobe(),
    outerWidth: 1000,
    outerHeight: 2200,
    outerDepth: 600,
  };
}

function buildEmptyProject(roomId: string, name = "Nowy projekt"): Project {
  return {
    id: uid(),
    roomId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [],
    outerWidth: 1000,
    outerHeight: 2200,
    outerDepth: 600,
  };
}

function buildDefaultRoom(name = "Mieszkanie"): Room {
  return {
    id: uid(),
    name,
    createdAt: Date.now(),
  };
}

interface AppState {
  rooms: Room[];
  projects: Project[];
  activeRoomId: string;
  activeId: string;
  selectedElementId: string | null;
  setActive: (id: string) => void;
  setSelected: (id: string | null) => void;
  setActiveRoom: (roomId: string) => void;
  addRoom: (name?: string) => void;
  renameRoom: (id: string, name: string) => void;
  deleteRoom: (id: string) => void;
  newProject: (opts?: { empty?: boolean; name?: string }) => void;
  duplicateProject: () => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  moveProjectToRoom: (projectId: string, roomId: string) => void;
  setOuter: (w: number, h: number, d: number) => void;
  scaleProject: (w: number, h: number, d: number) => void;
  addElement: (type: ElementType) => void;
  duplicateElement: (id: string) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, patch: Partial<WardrobeElement>) => void;
  toggleHidden: (id: string) => void;
  showAll: () => void;
  resetActive: () => void;
}

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
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
        selectedElementId: null,
        setActive: (id) =>
          set((s) => {
            const proj = s.projects.find((p) => p.id === id);
            if (!proj) return {};
            return {
              activeId: id,
              activeRoomId: proj.roomId,
              selectedElementId: null,
            };
          }),
        setSelected: (id) => set({ selectedElementId: id }),
        setActiveRoom: (roomId) =>
          set((s) => {
            const room = s.rooms.find((r) => r.id === roomId);
            if (!room) return {};
            // Wybieramy pierwszy projekt z tego pokoju (lub bieżący, gdy
            // pokój jest pusty – wtedy 3D pokaże komunikat).
            const inRoom = s.projects.filter((p) => p.roomId === roomId);
            return {
              activeRoomId: roomId,
              activeId: inRoom[0]?.id ?? s.activeId,
              selectedElementId: null,
            };
          }),
        addRoom: (name) => {
          const room = buildDefaultRoom(name || "Nowy pokój");
          // Każdy pokój dostaje pusty placeholder, żeby UI miał co zaznaczyć.
          const proj = buildEmptyProject(room.id, "Nowa zabudowa");
          set((s) => ({
            rooms: [...s.rooms, room],
            projects: [...s.projects, proj],
            activeRoomId: room.id,
            activeId: proj.id,
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
            // Jeśli usuwamy ostatni pokój, tworzymy nowy domyślny żeby app
            // zawsze miała co pokazać.
            if (remainingRooms.length === 0) {
              const fresh = buildDefaultRoom();
              const freshProj = buildDefaultProject(fresh.id);
              return {
                rooms: [fresh],
                projects: [freshProj],
                activeRoomId: fresh.id,
                activeId: freshProj.id,
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
            elements: src.elements.map((e) => ({ ...e, id: uid() })),
          };
          set((s) => ({
            projects: [...s.projects, copy],
            activeId: copy.id,
            activeRoomId: copy.roomId,
            selectedElementId: null,
          }));
        },
        deleteProject: (id) => {
          set((s) => {
            const removed = s.projects.find((p) => p.id === id);
            const remaining = s.projects.filter((p) => p.id !== id);
            const roomId = removed?.roomId ?? s.activeRoomId;
            // Jeśli właśnie usunęliśmy ostatni projekt w tym pokoju,
            // tworzymy w nim nowy domyślny, żeby pokój nie był martwy.
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
        setOuter: (w, h, d) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({ ...p, outerWidth: w, outerHeight: h, outerDepth: d })
                : p
            ),
          }));
        },
        scaleProject: (newW, newH, newD) => {
          set((s) => ({
            projects: s.projects.map((p) => {
              if (p.id !== s.activeId) return p;
              const rx = newW / Math.max(1, p.outerWidth);
              const ry = newH / Math.max(1, p.outerHeight);
              const rz = newD / Math.max(1, p.outerDepth);
              const round = (v: number) => Math.round(v * 10) / 10;
              const elements = p.elements.map((el) => {
                // Wymiar skalujemy tylko, jeśli jest "konstrukcyjny" (znacznie
                // większy od grubości materiału). Dzięki temu półki i wieńce
                // zostają 18 mm, a boki / drzwi rozciągają się z szafą.
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
              return touch({
                ...p,
                outerWidth: newW,
                outerHeight: newH,
                outerDepth: newD,
                elements,
              });
            }),
          }));
        },
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
                  : 800,
            depth:
              type === "bok" || type === "drzwi" || type === "front-szuflady"
                ? ELEMENT_DEFAULT_THICKNESS[type]
                : type === "plecy"
                  ? 3
                  : type === "drazek"
                    ? 25
                    : 580,
            x: 0,
            y: 500,
            z: 0,
            thickness: ELEMENT_DEFAULT_THICKNESS[type],
            material:
              type === "plecy"
                ? "HDF 3 mm"
                : type === "drazek"
                  ? "Rurka metalowa Ø25"
                  : "Płyta meblowa 18 mm",
            color: ELEMENT_DEFAULT_COLOR[type],
            quantity: 1,
          };
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({ ...p, elements: [...p.elements, newEl] })
                : p
            ),
            selectedElementId: id,
          }));
        },
        duplicateElement: (id) => {
          set((s) => ({
            projects: s.projects.map((p) => {
              if (p.id !== s.activeId) return p;
              const src = p.elements.find((e) => e.id === id);
              if (!src) return p;
              const copy: WardrobeElement = {
                ...src,
                id: uid(),
                name: src.name + " (kopia)",
                x: src.x + 50,
              };
              return touch({ ...p, elements: [...p.elements, copy] });
            }),
          }));
        },
        removeElement: (id) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    elements: p.elements.filter((e) => e.id !== id),
                  })
                : p
            ),
            selectedElementId:
              s.selectedElementId === id ? null : s.selectedElementId,
          }));
        },
        updateElement: (id, patch) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    elements: p.elements.map((e) =>
                      e.id === id ? { ...e, ...patch } : e
                    ),
                  })
                : p
            ),
          }));
        },
        toggleHidden: (id) => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    elements: p.elements.map((e) =>
                      e.id === id ? { ...e, hidden: !e.hidden } : e
                    ),
                  })
                : p
            ),
          }));
        },
        showAll: () => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({
                    ...p,
                    elements: p.elements.map((e) => ({ ...e, hidden: false })),
                  })
                : p
            ),
          }));
        },
        resetActive: () => {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === s.activeId
                ? touch({ ...p, elements: buildDefaultWardrobe() })
                : p
            ),
            selectedElementId: null,
          }));
        },
      };
    },
    {
      name: "meble3d-store-v1",
      version: 2,
      migrate: (persistedState: any, fromVersion: number) => {
        if (!persistedState) return persistedState;
        if (fromVersion < 2) {
          // Stara wersja: tylko `projects[]` bez pokoi. Tworzymy domyślny
          // pokój i przypisujemy do niego wszystkie istniejące projekty.
          const defaultRoom = buildDefaultRoom("Mieszkanie");
          const projects: Project[] = (persistedState.projects ?? []).map(
            (p: any) => ({
              ...p,
              roomId: defaultRoom.id,
            })
          );
          return {
            ...persistedState,
            rooms: [defaultRoom],
            activeRoomId: defaultRoom.id,
            projects: projects.length
              ? projects
              : [buildDefaultProject(defaultRoom.id)],
            activeId: projects[0]?.id ?? persistedState.activeId,
          };
        }
        return persistedState;
      },
    }
  )
);

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
