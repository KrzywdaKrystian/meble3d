import { useState } from "react";
import { Wardrobe3D } from "./components/Wardrobe3D";
import { ElementEditor } from "./components/ElementEditor";
import { PartsList } from "./components/PartsList";
import { ProjectPanel } from "./components/ProjectPanel";
import { RoomProjectPicker } from "./components/RoomProjectPicker";
import {
  useActiveProject,
  useActiveRoom,
  useActiveCabinet,
  useStore,
} from "./store";

type Tab = "elements" | "parts" | "project";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "elements", label: "Elementy", icon: "▦" },
  { id: "parts", label: "Lista", icon: "≣" },
  { id: "project", label: "Projekt", icon: "⛬" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("elements");
  const [pickerOpen, setPickerOpen] = useState(false);
  const project = useActiveProject();
  const room = useActiveRoom();
  const cabinet = useActiveCabinet();
  const showDimensions = useStore((s) => s.showDimensions);
  const setShowDimensions = useStore((s) => s.setShowDimensions);
  const showCabinetLabels = useStore((s) => s.showCabinetLabels);
  const setShowCabinetLabels = useStore((s) => s.setShowCabinetLabels);
  const showWalls = useStore((s) => s.showWalls);
  const setShowWalls = useStore((s) => s.setShowWalls);
  const showFloorOutlineOnly = useStore((s) => s.showFloorOutlineOnly);
  const setShowFloorOutlineOnly = useStore((s) => s.setShowFloorOutlineOnly);

  const totalElements = project.cabinets.reduce(
    (s, c) => s + c.elements.length,
    0
  );

  return (
    <div className="app">
      <header className="topbar no-print">
        <button
          className="brand brand-button"
          onClick={() => setPickerOpen((v) => !v)}
          title="Zmień przestrzeń / projekt"
          aria-label="Otwórz wybór przestrzeni i projektu"
        >
          <span className="brand-mark">M3D</span>
          <div className="brand-text">
            <div className="brand-title">
              {room.name} · {project.name}
            </div>
            <div className="brand-sub">
              {project.cabinets.length > 1
                ? cabinet.name +
                  " · " +
                  project.cabinets.length +
                  " szaf w projekcie"
                : cabinet.name}
            </div>
          </div>
          <span className="brand-chevron" aria-hidden="true">
            ▾
          </span>
        </button>
        <div className="topbar-meta">{totalElements} elementów</div>
      </header>

      <main className="main">
        <section className="canvas-wrap no-print">
          <Wardrobe3D />
          <div className="canvas-controls">
            <button
              className={
                "canvas-toggle" + (showDimensions ? " active" : "")
              }
              onClick={() => setShowDimensions(!showDimensions)}
              title={
                showDimensions
                  ? "Ukryj wymiary elementów"
                  : "Pokaż wymiary elementów na modelu"
              }
            >
              {showDimensions ? "Wymiary el.: ON" : "Wymiary el.: OFF"}
            </button>
            <button
              className={
                "canvas-toggle" + (showCabinetLabels ? " active" : "")
              }
              onClick={() => setShowCabinetLabels(!showCabinetLabels)}
              title={
                showCabinetLabels
                  ? "Ukryj etykiety szaf"
                  : "Pokaż etykiety nad szafami (nazwa + gabaryty)"
              }
            >
              {showCabinetLabels ? "Etykiety szaf: ON" : "Etykiety szaf: OFF"}
            </button>
            <button
              className={"canvas-toggle" + (showWalls ? " active" : "")}
              onClick={() => setShowWalls(!showWalls)}
              title={
                showWalls
                  ? "Ukryj ściany pomieszczenia"
                  : "Pokaż ściany pomieszczenia (jeśli przestrzeń ma layout)"
              }
            >
              {showWalls ? "Ściany: ON" : "Ściany: OFF"}
            </button>
            <button
              className={
                "canvas-toggle" +
                (showFloorOutlineOnly ? " active" : "") +
                (!showWalls ? " disabled" : "")
              }
              onClick={() =>
                showWalls && setShowFloorOutlineOnly(!showFloorOutlineOnly)
              }
              disabled={!showWalls}
              title={
                !showWalls
                  ? "Włącz najpierw Ściany"
                  : showFloorOutlineOnly
                    ? "Pokaż pełne ściany"
                    : "Pokaż tylko obrys podłogi (bez ścian)"
              }
            >
              {showFloorOutlineOnly ? "Tylko obrys: ON" : "Tylko obrys: OFF"}
            </button>
          </div>
          <div className="canvas-hint">
            Obróć: 1 palec · Przybliż: szczypta · Przesuń: 2 palce
          </div>
        </section>

        <section className="panel">
          <nav className="tabs no-print">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={"tab" + (tab === t.id ? " active" : "")}
                onClick={() => setTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="panel-body">
            {tab === "elements" && <ElementEditor />}
            {tab === "parts" && <PartsList />}
            {tab === "project" && <ProjectPanel />}
          </div>
        </section>
      </main>

      <RoomProjectPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />

      {/* Wersja drukowana */}
      <section className="print-only">
        <h1>Lista elementów – {project.name}</h1>
        <PartsList />
      </section>
    </div>
  );
}
