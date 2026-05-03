import { useEffect } from "react";
import {
  useStore,
  useActiveProject,
  useActiveRoom,
  useProjectsInActiveRoom,
} from "../store";

export function RoomProjectPicker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
  } = useStore();
  const project = useActiveProject();
  const room = useActiveRoom();
  const projectsInRoom = useProjectsInActiveRoom();

  // Zablokuj scroll body kiedy modal otwarty (lepsze UX na mobile).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc zamyka modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
    <div
      className="picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Wybór pokoju i projektu"
    >
      <header className="picker-header">
        <button
          className="picker-back"
          onClick={onClose}
          aria-label="Zamknij"
        >
          ← Zamknij
        </button>
        <div className="picker-title">
          <div className="picker-title-room">{room.name}</div>
          <div className="picker-title-project">{project.name}</div>
        </div>
      </header>

      <div className="picker-body">
        <div className="picker-room-select">
          <label className="field">
            <span className="field-label">Wybierz pokój</span>
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
                      {r.name} ({count} projektów)
                    </option>
                  );
                })}
              </select>
            </span>
          </label>
        </div>

        <div className="form-section-title">Pokój „{room.name}"</div>
        <div className="form">
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

        <ul className="elist">
          {projectsInRoom.map((p) => (
            <li
              key={p.id}
              className={
                "elist-item" + (p.id === activeId ? " active" : "")
              }
              onClick={() => {
                setActive(p.id);
                onClose();
              }}
            >
              <span
                className="elist-color"
                style={{
                  background: p.id === activeId ? "#3b82f6" : "#475569",
                }}
              />
              <span className="elist-name">
                <strong>{p.name}</strong>
                <small>
                  {p.cabinets.length} szaf ·{" "}
                  {p.cabinets.reduce((s, c) => s + c.elements.length, 0)}{" "}
                  elementów ·{" "}
                  {new Date(p.updatedAt).toLocaleDateString("pl-PL")}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
