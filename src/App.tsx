import { useState } from "react";
import { Wardrobe3D } from "./components/Wardrobe3D";
import { ElementEditor } from "./components/ElementEditor";
import { PartsList } from "./components/PartsList";
import { ProjectPanel } from "./components/ProjectPanel";
import {
  useActiveProject,
  useActiveRoom,
  useActiveCabinet,
} from "./store";

type Tab = "elements" | "parts" | "project";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "elements", label: "Elementy", icon: "▦" },
  { id: "parts", label: "Lista", icon: "≣" },
  { id: "project", label: "Projekt", icon: "⛬" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("elements");
  const project = useActiveProject();
  const room = useActiveRoom();
  const cabinet = useActiveCabinet();

  const totalElements = project.cabinets.reduce(
    (s, c) => s + c.elements.length,
    0
  );

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="brand">
          <span className="brand-mark">M3D</span>
          <div>
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
        </div>
        <div className="topbar-meta">{totalElements} elementów</div>
      </header>

      <main className="main">
        <section className="canvas-wrap no-print">
          <Wardrobe3D />
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

      {/* Wersja drukowana */}
      <section className="print-only">
        <h1>Lista elementów – {project.name}</h1>
        <PartsList />
      </section>
    </div>
  );
}
