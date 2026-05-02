import { useEffect, useState } from "react";
import {
  useStore,
  useActiveProject,
  useActiveRoom,
  useProjectsInActiveRoom,
} from "../store";
import {
  PLINTH_DESCRIPTIONS,
  PLINTH_LABELS,
  PlinthType,
} from "../types";

const PLINTH_TYPES: PlinthType[] = [
  "staly",
  "regulowany",
  "cofniety",
  "brak",
  "systemowy",
];

export function ProjectPanel() {
  const {
    rooms,
    projects,
    activeId,
    activeRoomId,
    setActive,
    setActiveRoom,
    addRoom,
    renameRoom,
    deleteRoom,
    moveProjectToRoom,
    newProject,
    duplicateProject,
    deleteProject,
    renameProject,
    setOuter,
    scaleProject,
    applyPlinth,
    resetActive,
  } = useStore();
  const project = useActiveProject();
  const room = useActiveRoom();
  const projectsInRoom = useProjectsInActiveRoom();

  const [scaleW, setScaleW] = useState<string>(String(project.outerWidth));
  const [scaleH, setScaleH] = useState<string>(String(project.outerHeight));
  const [scaleD, setScaleD] = useState<string>(String(project.outerDepth));

  const [plinthType, setPlinthType] = useState<PlinthType>(
    project.plinthType ?? "staly"
  );
  const [plinthHeight, setPlinthHeight] = useState<string>(
    String(project.plinthHeight ?? 100)
  );
  const [plinthRecess, setPlinthRecess] = useState<string>(
    String(project.plinthRecess ?? 30)
  );

  useEffect(() => {
    setScaleW(String(project.outerWidth));
    setScaleH(String(project.outerHeight));
    setScaleD(String(project.outerDepth));
    setPlinthType(project.plinthType ?? "staly");
    setPlinthHeight(String(project.plinthHeight ?? 100));
    setPlinthRecess(String(project.plinthRecess ?? 30));
  }, [
    project.id,
    project.outerWidth,
    project.outerHeight,
    project.outerDepth,
    project.plinthType,
    project.plinthHeight,
    project.plinthRecess,
  ]);

  const handleApplyPlinth = () => {
    const h = Math.max(0, parseFloat(plinthHeight) || 0);
    const r = Math.max(0, parseFloat(plinthRecess) || 0);
    if (
      confirm(
        "Wymienić elementy cokołu na: „" +
          PLINTH_LABELS[plinthType] +
          "” (wys. " +
          h +
          " mm)?\n\nIstniejące elementy typu cokół i nóżka zostaną usunięte. Korpus szafy zostanie podniesiony / opuszczony tak, by spasował się z nowym cokołem."
      )
    ) {
      applyPlinth(plinthType, h, r);
    }
  };

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

  const handleAddRoom = () => {
    const name = prompt("Nazwa nowego pokoju (np. Sypialnia):", "");
    if (name && name.trim()) {
      addRoom(name.trim());
    }
  };

  const handleDeleteRoom = () => {
    const inRoom = projects.filter((p) => p.roomId === room.id);
    const msg =
      "Usunąć pokój „" +
      room.name +
      "”" +
      (inRoom.length > 0
        ? " razem z " + inRoom.length + " projektami w środku?"
        : "?");
    if (confirm(msg)) {
      deleteRoom(room.id);
    }
  };

  return (
    <div className="panel-content">
      <div className="form-section-title">Pokój</div>
      <div className="form">
        <div className="form-row">
          <label className="field">
            <span className="field-label">Aktywny pokój</span>
            <span className="field-input">
              <select
                value={activeRoomId}
                onChange={(e) => setActiveRoom(e.target.value)}
              >
                {rooms.map((r) => {
                  const count = projects.filter(
                    (p) => p.roomId === r.id
                  ).length;
                  return (
                    <option key={r.id} value={r.id}>
                      {r.name} ({count})
                    </option>
                  );
                })}
              </select>
            </span>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">Nazwa pokoju</span>
            <span className="field-input">
              <input
                type="text"
                value={room.name}
                onChange={(e) => renameRoom(room.id, e.target.value)}
              />
            </span>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn primary" onClick={handleAddRoom}>
            + Nowy pokój
          </button>
          <button
            className="btn danger"
            onClick={handleDeleteRoom}
            disabled={rooms.length === 1 && projects.length <= 1}
          >
            Usuń pokój
          </button>
        </div>
      </div>

      <div className="form-section-title">
        Projekty w pokoju „{room.name}" ({projectsInRoom.length})
      </div>
      <div className="form">
        <div className="form-row">
          <label className="field">
            <span className="field-label">Aktywny projekt</span>
            <span className="field-input">
              <select
                value={activeId}
                onChange={(e) => setActive(e.target.value)}
              >
                {projectsInRoom.map((p) => (
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
        {rooms.length > 1 && (
          <div className="form-row">
            <label className="field">
              <span className="field-label">Przenieś projekt do pokoju</span>
              <span className="field-input">
                <select
                  value={project.roomId}
                  onChange={(e) =>
                    moveProjectToRoom(project.id, e.target.value)
                  }
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        )}
        <div className="form-actions">
          <button
            className="btn primary"
            onClick={() => newProject()}
            title="Dodaj nowy projekt z szablonem domyślnej szafy"
          >
            + Z szablonu
          </button>
          <button
            className="btn ghost"
            onClick={() =>
              newProject({ empty: true, name: "Nowa zabudowa" })
            }
            title="Dodaj pusty projekt do samodzielnego zaprojektowania"
          >
            + Pusty
          </button>
          <button className="btn ghost" onClick={duplicateProject}>
            Duplikuj
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (
                confirm(
                  "Usunąć projekt „" + project.name + "”? (nieodwracalne)"
                )
              ) {
                deleteProject(project.id);
              }
            }}
          >
            Usuń
          </button>
        </div>
      </div>

      <ul className="elist">
        {projectsInRoom.map((p) => (
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

      <div className="form-section-title">Cokół</div>
      <p className="hint">
        Wybierz typ cokołu – po zastosowaniu odpowiednie elementy zostaną
        wygenerowane (cokół, maskownica, nóżki) i pojawią się w&nbsp;liście
        elementów dla stolarza.
      </p>
      <div className="plinth-options">
        {PLINTH_TYPES.map((t) => (
          <label
            key={t}
            className={
              "plinth-card" + (plinthType === t ? " active" : "")
            }
          >
            <input
              type="radio"
              name="plinth-type"
              value={t}
              checked={plinthType === t}
              onChange={() => setPlinthType(t)}
            />
            <div className="plinth-card-body">
              <div className="plinth-title">{PLINTH_LABELS[t]}</div>
              <div className="plinth-desc">{PLINTH_DESCRIPTIONS[t]}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Wysokość cokołu [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={plinthHeight}
              onChange={(e) => setPlinthHeight(e.target.value)}
            />
          </span>
        </label>
        {plinthType === "cofniety" && (
          <label className="field">
            <span className="field-label">Cofnięcie [mm]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={plinthRecess}
                onChange={(e) => setPlinthRecess(e.target.value)}
              />
            </span>
          </label>
        )}
      </div>
      <div className="form-actions">
        <button className="btn primary" onClick={handleApplyPlinth}>
          Zastosuj cokół
        </button>
      </div>
      {project.plinthType && (
        <p className="hint">
          Aktualny cokół: <strong>{PLINTH_LABELS[project.plinthType]}</strong>{" "}
          · wysokość {project.plinthHeight ?? 0} mm
          {project.plinthType === "cofniety"
            ? ", cofnięty o " + (project.plinthRecess ?? 0) + " mm"
            : ""}
          .
        </p>
      )}

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
    </div>
  );
}
