import { useStore, useActiveProject } from "../store";

export function ProjectPanel() {
  const {
    projects,
    activeId,
    setActive,
    newProject,
    duplicateProject,
    deleteProject,
    renameProject,
    setOuter,
    resetActive,
  } = useStore();
  const project = useActiveProject();

  return (
    <div className="panel-content">
      <div className="form-section-title">Projekt</div>
      <div className="form">
        <div className="form-row">
          <label className="field">
            <span className="field-label">Aktywny projekt</span>
            <span className="field-input">
              <select
                value={activeId}
                onChange={(e) => setActive(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">Nazwa projektu</span>
            <span className="field-input">
              <input
                type="text"
                value={project.name}
                onChange={(e) => renameProject(project.id, e.target.value)}
              />
            </span>
          </label>
        </div>

        <div className="form-actions">
          <button className="btn primary" onClick={newProject}>
            + Nowy
          </button>
          <button className="btn ghost" onClick={duplicateProject}>
            Duplikuj
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (
                confirm("Usunąć projekt „" + project.name + "”? (nieodwracalne)")
              ) {
                deleteProject(project.id);
              }
            }}
          >
            Usuń
          </button>
        </div>
      </div>

      <div className="form-section-title">Wymiary gabarytowe (informacyjnie)</div>
      <p className="hint">
        Te wartości pomagają tylko w pozycjonowaniu kamery i rysowaniu
        pomocniczego boxu. Faktyczna szafa to suma elementów.
      </p>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Szerokość [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={project.outerWidth}
              onChange={(e) =>
                setOuter(
                  Math.max(100, parseFloat(e.target.value) || 0),
                  project.outerHeight,
                  project.outerDepth
                )
              }
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Wysokość [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={project.outerHeight}
              onChange={(e) =>
                setOuter(
                  project.outerWidth,
                  Math.max(100, parseFloat(e.target.value) || 0),
                  project.outerDepth
                )
              }
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Głębokość [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={project.outerDepth}
              onChange={(e) =>
                setOuter(
                  project.outerWidth,
                  project.outerHeight,
                  Math.max(100, parseFloat(e.target.value) || 0)
                )
              }
            />
          </span>
        </label>
      </div>

      <div className="form-section-title">Szablony</div>
      <div className="form-actions">
        <button
          className="btn ghost"
          onClick={() => {
            if (
              confirm(
                "Zastąpić obecne elementy domyślnym szablonem szafy 1000×2200×600?"
              )
            ) {
              resetActive();
            }
          }}
        >
          Wczytaj szablon: szafa 2-drzwiowa
        </button>
      </div>

      <div className="form-section-title">Twoje projekty</div>
      <ul className="elist">
        {projects.map((p) => (
          <li
            key={p.id}
            className={"elist-item" + (p.id === activeId ? " active" : "")}
            onClick={() => setActive(p.id)}
          >
            <span
              className="elist-color"
              style={{ background: p.id === activeId ? "#3b82f6" : "#475569" }}
            />
            <span className="elist-name">
              <strong>{p.name}</strong>
              <small>
                {p.elements.length} elementów ·{" "}
                {new Date(p.updatedAt).toLocaleDateString("pl-PL")}
              </small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
