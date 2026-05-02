import { useEffect, useState } from "react";
import {
  useStore,
  useActiveProject,
  useActiveRoom,
  useActiveCabinet,
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
    activeCabinetId,
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
    setActiveCabinet,
    addCabinet,
    duplicateCabinet,
    deleteCabinet,
    renameCabinet,
    setCabinetOffset,
    setCabinetOuter,
    scaleActiveCabinet,
    applyPlinth,
    resetActiveCabinet,
  } = useStore();
  const project = useActiveProject();
  const room = useActiveRoom();
  const projectsInRoom = useProjectsInActiveRoom();
  const cabinet = useActiveCabinet();

  // Lokalny state dla edytowalnych pól, żeby user mógł wpisać wartość
  // bez natychmiastowego zatwierdzenia (mniej rerenderów / mniej skoków).
  const [scaleW, setScaleW] = useState<string>(String(cabinet.outerWidth));
  const [scaleH, setScaleH] = useState<string>(String(cabinet.outerHeight));
  const [scaleD, setScaleD] = useState<string>(String(cabinet.outerDepth));
  const [plinthType, setPlinthType] = useState<PlinthType>(
    cabinet.plinthType ?? "staly"
  );
  const [plinthHeight, setPlinthHeight] = useState<string>(
    String(cabinet.plinthHeight ?? 100)
  );
  const [plinthRecess, setPlinthRecess] = useState<string>(
    String(cabinet.plinthRecess ?? 30)
  );

  useEffect(() => {
    setScaleW(String(cabinet.outerWidth));
    setScaleH(String(cabinet.outerHeight));
    setScaleD(String(cabinet.outerDepth));
    setPlinthType(cabinet.plinthType ?? "staly");
    setPlinthHeight(String(cabinet.plinthHeight ?? 100));
    setPlinthRecess(String(cabinet.plinthRecess ?? 30));
  }, [
    cabinet.id,
    cabinet.outerWidth,
    cabinet.outerHeight,
    cabinet.outerDepth,
    cabinet.plinthType,
    cabinet.plinthHeight,
    cabinet.plinthRecess,
  ]);

  const applyScale = () => {
    const w = Math.max(100, parseFloat(scaleW) || cabinet.outerWidth);
    const h = Math.max(100, parseFloat(scaleH) || cabinet.outerHeight);
    const d = Math.max(100, parseFloat(scaleD) || cabinet.outerDepth);
    if (
      w === cabinet.outerWidth &&
      h === cabinet.outerHeight &&
      d === cabinet.outerDepth
    )
      return;
    if (
      confirm(
        "Przeskalować szafę „" +
          cabinet.name +
          "” z " +
          cabinet.outerWidth +
          " × " +
          cabinet.outerHeight +
          " × " +
          cabinet.outerDepth +
          " mm na " +
          w +
          " × " +
          h +
          " × " +
          d +
          " mm?\n\nWymiary konstrukcyjne (boki, plecy, drzwi) zostaną rozciągnięte. Półki, wieńce i drążki zachowają swoją grubość."
      )
    ) {
      scaleActiveCabinet(w, h, d);
    }
  };

  const handleApplyPlinth = () => {
    const h = Math.max(0, parseFloat(plinthHeight) || 0);
    const r = Math.max(0, parseFloat(plinthRecess) || 0);
    if (
      confirm(
        "Wymienić cokół w szafie „" +
          cabinet.name +
          "” na: „" +
          PLINTH_LABELS[plinthType] +
          "” (wys. " +
          h +
          " mm)?\n\nIstniejące elementy typu cokół i nóżka zostaną usunięte. Korpus szafy zostanie podniesiony / opuszczony tak, by spasował się z nowym cokołem."
      )
    ) {
      applyPlinth(plinthType, h, r);
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

  const handleAddCabinet = (empty: boolean) => {
    const defaultName = empty
      ? "Moduł " + (project.cabinets.length + 1)
      : "Szafa " + (project.cabinets.length + 1);
    const name = prompt("Nazwa nowej szafy / modułu:", defaultName);
    if (name === null) return;
    addCabinet({ empty, name: name.trim() || defaultName });
  };

  const handleDeleteCabinet = () => {
    if (project.cabinets.length === 1) {
      alert("Nie można usunąć ostatniej szafy w projekcie.");
      return;
    }
    if (
      confirm(
        "Usunąć szafę „" + cabinet.name + "” razem z jej elementami?"
      )
    ) {
      deleteCabinet(cabinet.id);
    }
  };

  return (
    <div className="panel-content">
      {/* ===== Pokój ===== */}
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

      {/* ===== Projekt ===== */}
      <div className="form-section-title">
        Projekt w pokoju „{room.name}" ({projectsInRoom.length})
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
          <button className="btn primary" onClick={() => newProject()}>
            + Z szablonu
          </button>
          <button
            className="btn ghost"
            onClick={() =>
              newProject({ empty: true, name: "Nowa zabudowa" })
            }
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

      {/* ===== Szafy / moduły ===== */}
      <div className="form-section-title">
        Szafy / moduły w projekcie ({project.cabinets.length})
      </div>
      <p className="hint">
        Jeden projekt może składać się z kilku szaf ustawionych obok siebie
        (np. sekcja z drzwiami + sekcja z pralką). Każda ma własne wymiary,
        cokół i listę elementów. Lista dla stolarza zsumuje wszystkie.
      </p>
      <div className="form">
        <div className="form-row">
          <label className="field">
            <span className="field-label">Aktywna szafa</span>
            <span className="field-input">
              <select
                value={activeCabinetId}
                onChange={(e) => setActiveCabinet(e.target.value)}
              >
                {project.cabinets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">Nazwa szafy</span>
            <span className="field-input">
              <input
                type="text"
                value={cabinet.name}
                onChange={(e) => renameCabinet(cabinet.id, e.target.value)}
              />
            </span>
          </label>
        </div>
        <div className="form-actions">
          <button
            className="btn primary"
            onClick={() => handleAddCabinet(false)}
            title="Dostaw nową szafę z domyślnym korpusem obok ostatniej"
          >
            + Dostaw szafę
          </button>
          <button
            className="btn ghost"
            onClick={() => handleAddCabinet(true)}
            title="Dostaw pusty moduł obok ostatniej szafy"
          >
            + Pusty moduł
          </button>
          <button
            className="btn ghost"
            onClick={() => duplicateCabinet(cabinet.id)}
          >
            Duplikuj
          </button>
          <button
            className="btn danger"
            onClick={handleDeleteCabinet}
            disabled={project.cabinets.length === 1}
          >
            Usuń szafę
          </button>
        </div>

        <div className="form-section-title">Pozycja szafy w zabudowie</div>
        <p className="hint">
          Przesunięcie środka tej szafy względem środka projektu. Domyślnie
          „+ Dostaw szafę” ustawia X tak, by szafa stanęła równo obok
          poprzedniej.
        </p>
        <div className="form-row grid-3">
          <label className="field">
            <span className="field-label">Offset X [mm]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={cabinet.offsetX}
                onChange={(e) =>
                  setCabinetOffset(
                    cabinet.id,
                    parseFloat(e.target.value) || 0,
                    cabinet.offsetY,
                    cabinet.offsetZ
                  )
                }
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Offset Y [mm]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={cabinet.offsetY}
                onChange={(e) =>
                  setCabinetOffset(
                    cabinet.id,
                    cabinet.offsetX,
                    parseFloat(e.target.value) || 0,
                    cabinet.offsetZ
                  )
                }
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Offset Z [mm]</span>
            <span className="field-input">
              <input
                type="number"
                inputMode="numeric"
                value={cabinet.offsetZ}
                onChange={(e) =>
                  setCabinetOffset(
                    cabinet.id,
                    cabinet.offsetX,
                    cabinet.offsetY,
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </span>
          </label>
        </div>
      </div>

      <ul className="elist">
        {project.cabinets.map((c) => (
          <li
            key={c.id}
            className={
              "elist-item" + (c.id === activeCabinetId ? " active" : "")
            }
            onClick={() => setActiveCabinet(c.id)}
          >
            <span
              className="elist-color"
              style={{
                background: c.id === activeCabinetId ? "#3b82f6" : "#475569",
              }}
            />
            <span className="elist-name">
              <strong>{c.name}</strong>
              <small>
                {c.outerWidth} × {c.outerHeight} × {c.outerDepth} mm ·{" "}
                {c.elements.length} el.
              </small>
            </span>
          </li>
        ))}
      </ul>

      {/* ===== Cokół (per szafa) ===== */}
      <div className="form-section-title">Cokół w szafie „{cabinet.name}"</div>
      <p className="hint">
        Każda szafa ma własny cokół. Zmiana tutaj dotyczy tylko aktywnej
        szafy.
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
      {cabinet.plinthType && (
        <p className="hint">
          Aktualny cokół tej szafy:{" "}
          <strong>{PLINTH_LABELS[cabinet.plinthType]}</strong> · wysokość{" "}
          {cabinet.plinthHeight ?? 0} mm
          {cabinet.plinthType === "cofniety"
            ? ", cofnięty o " + (cabinet.plinthRecess ?? 0) + " mm"
            : ""}
          .
        </p>
      )}

      {/* ===== Skaluj aktywną szafę ===== */}
      <div className="form-section-title">Skaluj szafę</div>
      <p className="hint">
        Wpisz docelowe wymiary aktywnej szafy w&nbsp;mm. Boki, plecy i
        drzwi zostaną rozciągnięte; półki i wieńce zachowają grubość 18 mm.
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
            setScaleW(String(cabinet.outerWidth));
            setScaleH(String(cabinet.outerHeight));
            setScaleD(String(cabinet.outerDepth));
          }}
        >
          Cofnij wpis
        </button>
      </div>
      <p className="hint">
        Aktualne gabaryty szafy: {cabinet.outerWidth} × {cabinet.outerHeight}{" "}
        × {cabinet.outerDepth} mm.
      </p>

      <div className="form-section-title">
        Gabaryty bez skalowania (tylko podgląd)
      </div>
      <p className="hint">
        Pozwala ręcznie zmienić wartości używane przez kamerę i obwiednię
        szafy, bez ruszania elementów.
      </p>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">W [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={cabinet.outerWidth}
              onChange={(e) =>
                setCabinetOuter(
                  cabinet.id,
                  Math.max(100, parseFloat(e.target.value) || 0),
                  cabinet.outerHeight,
                  cabinet.outerDepth
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
              value={cabinet.outerHeight}
              onChange={(e) =>
                setCabinetOuter(
                  cabinet.id,
                  cabinet.outerWidth,
                  Math.max(100, parseFloat(e.target.value) || 0),
                  cabinet.outerDepth
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
              value={cabinet.outerDepth}
              onChange={(e) =>
                setCabinetOuter(
                  cabinet.id,
                  cabinet.outerWidth,
                  cabinet.outerHeight,
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
                "Zastąpić elementy szafy „" +
                  cabinet.name +
                  "” domyślnym szablonem szafy 2-drzwiowej?"
              )
            ) {
              resetActiveCabinet();
            }
          }}
        >
          Wczytaj szablon: szafa 2-drzwiowa
        </button>
      </div>
    </div>
  );
}
