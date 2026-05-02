import { useEffect, useState } from "react";
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
    scaleProject,
    resetActive,
  } = useStore();
  const project = useActiveProject();

  const [scaleW, setScaleW] = useState<string>(String(project.outerWidth));
  const [scaleH, setScaleH] = useState<string>(String(project.outerHeight));
  const [scaleD, setScaleD] = useState<string>(String(project.outerDepth));

  useEffect(() => {
    setScaleW(String(project.outerWidth));
    setScaleH(String(project.outerHeight));
    setScaleD(String(project.outerDepth));
  }, [project.id, project.outerWidth, project.outerHeight, project.outerDepth]);

  const applyScale = () => {
    const w = Math.max(100, parseFloat(scaleW) || project.outerWidth);
    const h = Math.max(100, parseFloat(scaleH) || project.outerHeight);
    const d = Math.max(100, parseFloat(scaleD) || project.outerDepth);
    if (
      w === project.outerWidth &&
      h === project.outerHeight &&
      d === project.outerDepth
    )
      return;
    if (
      confirm(
        "Przeskalować szafę z " +
          project.outerWidth +
          " × " +
          project.outerHeight +
          " × " +
          project.outerDepth +
          " mm na " +
          w +
          " × " +
          h +
          " × " +
          d +
          " mm?\n\nWymiary konstrukcyjne (boki, plecy, drzwi) zostaną rozciągnięte. Półki, wieńce i drążki zachowają swoją grubość, ale ich pozycje zostaną przeliczone."
      )
    ) {
      scaleProject(w, h, d);
    }
  };

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

      <div className="form-section-title">Skaluj projekt</div>
      <p className="hint">
        Wpisz docelowe wymiary szafy w&nbsp;mm. Boki, plecy i drzwi zostaną
        rozciągnięte do nowej wysokości / szerokości, a&nbsp;półki i wieńce
        zachowają grubość 18 mm – tylko ich pozycje się przeliczą.
      </p>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Szerokość [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={scaleW}
              onChange={(e) => setScaleW(e.target.value)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Wysokość [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={scaleH}
              onChange={(e) => setScaleH(e.target.value)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Głębokość [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={scaleD}
              onChange={(e) => setScaleD(e.target.value)}
            />
          </span>
        </label>
      </div>
      <div className="form-actions">
        <button className="btn primary" onClick={applyScale}>
          Skaluj wszystkie elementy
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setScaleW(String(project.outerWidth));
            setScaleH(String(project.outerHeight));
            setScaleD(String(project.outerDepth));
          }}
        >
          Cofnij wpis
        </button>
      </div>
      <p className="hint">
        Aktualne gabaryty: {project.outerWidth} × {project.outerHeight} ×{" "}
        {project.outerDepth} mm.
      </p>

      <div className="form-section-title">Gabaryty bez skalowania (tylko podgląd)</div>
      <p className="hint">
        Pozwala ręcznie zmienić wartości używane przez kamerę, bez ruszania
        elementów. Użyj, jeśli sam ręcznie poprawiłeś elementy.
      </p>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">W [mm]</span>
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
          <span className="field-label">H [mm]</span>
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
          <span className="field-label">D [mm]</span>
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
