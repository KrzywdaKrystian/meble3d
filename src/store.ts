import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ELEMENT_DEFAULT_COLOR,
  ELEMENT_DEFAULT_THICKNESS,
  ELEMENT_LABELS,
  Project,
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

function buildDefaultProject(): Project {
  return {
    id: uid(),
    name: "Nowa szafa",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: buildDefaultWardrobe(),
    outerWidth: 1000,
    outerHeight: 2200,
    outerDepth: 600,
  };
}

interface AppState {
  projects: Project[];
  activeId: string;
  selectedElementId: string | null;
  setActive: (id: string) => void;
  setSelected: (id: string | null) => void;
  newProject: () => void;
  duplicateProject: () => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  setOuter: (w: number, h: number, d: number) => void;
  addElement: (type: ElementType) => void;
  duplicateElement: (id: string) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, patch: Partial<WardrobeElement>) => void;
  resetActive: () => void;
}

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const initial = buildDefaultProject();
      return {
        projects: [initial],
        activeId: initial.id,
        selectedElementId: null,
        setActive: (id) => set({ activeId: id, selectedElementId: null }),
        setSelected: (id) => set({ selectedElementId: id }),
        newProject: () => {
          const p = buildDefaultProject();
          set((s) => ({
            projects: [...s.projects, p],
            activeId: p.id,
            selectedElementId: null,
          }));
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
            selectedElementId: null,
          }));
        },
        deleteProject: (id) => {
          set((s) => {
            const remaining = s.projects.filter((p) => p.id !== id);
            const next = remaining.length ? remaining : [buildDefaultProject()];
            return {
              projects: next,
              activeId: next[0].id,
              selectedElementId: null,
            };
          });
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
      version: 1,
    }
  )
);

export function useActiveProject(): Project {
  const { projects, activeId } = useStore();
  return projects.find((p) => p.id === activeId) ?? projects[0];
}
