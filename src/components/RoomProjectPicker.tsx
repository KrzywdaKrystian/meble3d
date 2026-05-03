import { useEffect } from "react";
import {
  useStore,
  useActiveProject,
  useActiveRoom,
  useProjectsInActiveRoom,
} from "../store";
import {
  RoomAlcove,
  RoomLayout,
  RoomOpening,
  WallSide,
  WALL_LABELS,
} from "../types";

const WALL_OPTIONS: WallSide[] = ["N", "E", "S", "W"];

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
    toggleRoomLayout,
    setRoomLayout,
    addRoomOpening,
    updateRoomOpening,
    removeRoomOpening,
    addRoomAlcove,
    updateRoomAlcove,
    removeRoomAlcove,
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
    const name = prompt("Nazwa nowej przestrzeni (np. Sypialnia):", "");
    if (name && name.trim()) {
      addRoom(name.trim());
    }
  };

  const handleDeleteRoom = () => {
    const inRoom = projects.filter((p) => p.roomId === room.id);
    const msg =
      "Usunąć przestrzeń „" +
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
      aria-label="Wybór przestrzeni i projektu"
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
          <span className="field-label">Wybierz przestrzeń</span>
          <div className="picker-room-row">
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
            <button
              type="button"
              className="btn primary picker-add-room"
              onClick={handleAddRoom}
              title="Dodaj nową przestrzeń"
            >
              + Nowa przestrzeń
            </button>
          </div>
        </div>

        <div className="form-section-title">Przestrzeń „{room.name}"</div>
        <div className="form">
          <div className="form-row">
            <label className="field">
              <span className="field-label">Nazwa przestrzeni</span>
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
            <button
              className="btn danger"
              onClick={handleDeleteRoom}
              disabled={rooms.length === 1 && projects.length <= 1}
            >
              Usuń przestrzeń
            </button>
          </div>
        </div>

        <RoomLayoutSection
          roomId={room.id}
          layout={room.layout}
          onToggle={(v) => toggleRoomLayout(room.id, v)}
          onSetLayout={(patch) => setRoomLayout(room.id, patch)}
          onAddOpening={(op) => addRoomOpening(room.id, op)}
          onUpdateOpening={(id, patch) =>
            updateRoomOpening(room.id, id, patch)
          }
          onRemoveOpening={(id) => removeRoomOpening(room.id, id)}
          onAddAlcove={(a) => addRoomAlcove(room.id, a)}
          onUpdateAlcove={(id, patch) =>
            updateRoomAlcove(room.id, id, patch)
          }
          onRemoveAlcove={(id) => removeRoomAlcove(room.id, id)}
        />

        <div className="form-section-title">
          Projekt w przestrzeni „{room.name}" ({projectsInRoom.length})
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

        <div className="form-section-title">Aktywny projekt</div>
        <div className="form">
          <div className="form-row">
            <label className="field">
              <span className="field-label">Wybierz projekt</span>
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
                <span className="field-label">Przenieś projekt do przestrzeni</span>
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
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  suffix = "mm",
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isFinite(n) ? Math.max(min, n) : min);
          }}
        />
        <span className="suffix">{suffix}</span>
      </span>
    </label>
  );
}

function wallLength(layout: RoomLayout, side: WallSide): number {
  return side === "N" || side === "S" ? layout.width : layout.depth;
}

/** Czy [a,b] i [c,d] zachodzą na siebie (otwarcie na końcach). */
function rangesOverlap(
  a: number,
  b: number,
  c: number,
  d: number
): boolean {
  return Math.max(a, c) < Math.min(b, d);
}

interface OpeningProblem {
  msg: string;
}
function validateOpening(
  layout: RoomLayout,
  op: RoomOpening
): OpeningProblem | null {
  const wl = wallLength(layout, op.wall);
  if (op.offset < 0 || op.offset + op.width > wl) {
    return { msg: "Otwór wystaje poza ścianę (długość " + wl + " mm)." };
  }
  if (op.sillHeight < 0 || op.sillHeight + op.height > layout.height) {
    return { msg: "Otwór wystaje poza wysokość pomieszczenia." };
  }
  for (const a of layout.alcoves) {
    if (a.wall !== op.wall) continue;
    if (rangesOverlap(op.offset, op.offset + op.width, a.offset, a.offset + a.width)) {
      return { msg: "Otwór koliduje z wnęką na tej samej ścianie." };
    }
  }
  return null;
}
function validateAlcove(
  layout: RoomLayout,
  alcove: RoomAlcove
): OpeningProblem | null {
  const wl = wallLength(layout, alcove.wall);
  if (alcove.offset < 0 || alcove.offset + alcove.width > wl) {
    return { msg: "Wnęka wystaje poza ścianę (długość " + wl + " mm)." };
  }
  if (alcove.depth <= 0) {
    return { msg: "Głębokość wnęki musi być dodatnia." };
  }
  for (const op of layout.openings) {
    if (op.wall !== alcove.wall) continue;
    if (rangesOverlap(alcove.offset, alcove.offset + alcove.width, op.offset, op.offset + op.width)) {
      return { msg: "Wnęka koliduje z otworem na tej samej ścianie." };
    }
  }
  for (const other of layout.alcoves) {
    if (other.id === alcove.id || other.wall !== alcove.wall) continue;
    if (rangesOverlap(alcove.offset, alcove.offset + alcove.width, other.offset, other.offset + other.width)) {
      return { msg: "Wnęka koliduje z inną wnęką na tej samej ścianie." };
    }
  }
  return null;
}

function WallSelect({
  value,
  onChange,
}: {
  value: WallSide;
  onChange: (v: WallSide) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as WallSide)}>
      {WALL_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {WALL_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

function OpeningRow({
  layout,
  opening,
  onUpdate,
  onRemove,
}: {
  layout: RoomLayout;
  opening: RoomOpening;
  onUpdate: (patch: Partial<RoomOpening>) => void;
  onRemove: () => void;
}) {
  const problem = validateOpening(layout, opening);
  return (
    <div className={"form sub-form" + (problem ? " has-error" : "")}>
      <div className="form-row">
        <label className="field">
          <span className="field-label">Ściana</span>
          <span className="field-input">
            <WallSelect
              value={opening.wall}
              onChange={(v) => onUpdate({ wall: v })}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Typ</span>
          <span className="field-input">
            <select
              value={opening.kind}
              onChange={(e) =>
                onUpdate({ kind: e.target.value as "door" | "window" })
              }
            >
              <option value="door">Drzwi</option>
              <option value="window">Okno</option>
            </select>
          </span>
        </label>
      </div>
      <div className="form-row grid-3">
        <NumField
          label="Offset od lewej"
          value={opening.offset}
          onChange={(v) => onUpdate({ offset: v })}
        />
        <NumField
          label="Szerokość"
          value={opening.width}
          onChange={(v) => onUpdate({ width: Math.max(50, v) })}
        />
        <NumField
          label="Wysokość"
          value={opening.height}
          onChange={(v) => onUpdate({ height: Math.max(50, v) })}
        />
      </div>
      <div className="form-row grid-3">
        <NumField
          label="Wys. parapetu"
          value={opening.sillHeight}
          onChange={(v) => onUpdate({ sillHeight: v })}
        />
        <div className="field" />
        <div className="form-actions">
          <button className="btn danger btn-sm" onClick={onRemove}>
            Usuń
          </button>
        </div>
      </div>
      {problem && <p className="error-hint">{problem.msg}</p>}
    </div>
  );
}

function AlcoveRow({
  layout,
  alcove,
  onUpdate,
  onRemove,
}: {
  layout: RoomLayout;
  alcove: RoomAlcove;
  onUpdate: (patch: Partial<RoomAlcove>) => void;
  onRemove: () => void;
}) {
  const problem = validateAlcove(layout, alcove);
  return (
    <div className={"form sub-form" + (problem ? " has-error" : "")}>
      <div className="form-row">
        <label className="field">
          <span className="field-label">Ściana</span>
          <span className="field-input">
            <WallSelect
              value={alcove.wall}
              onChange={(v) => onUpdate({ wall: v })}
            />
          </span>
        </label>
      </div>
      <div className="form-row grid-3">
        <NumField
          label="Offset od lewej"
          value={alcove.offset}
          onChange={(v) => onUpdate({ offset: v })}
        />
        <NumField
          label="Szerokość"
          value={alcove.width}
          onChange={(v) => onUpdate({ width: Math.max(100, v) })}
        />
        <NumField
          label="Głębokość"
          value={alcove.depth}
          onChange={(v) => onUpdate({ depth: Math.max(50, v) })}
        />
      </div>
      <div className="form-actions">
        <button className="btn danger btn-sm" onClick={onRemove}>
          Usuń
        </button>
      </div>
      {problem && <p className="error-hint">{problem.msg}</p>}
    </div>
  );
}

function RoomLayoutSection({
  roomId,
  layout,
  onToggle,
  onSetLayout,
  onAddOpening,
  onUpdateOpening,
  onRemoveOpening,
  onAddAlcove,
  onUpdateAlcove,
  onRemoveAlcove,
}: {
  roomId: string;
  layout: RoomLayout | undefined;
  onToggle: (v: boolean) => void;
  onSetLayout: (patch: Partial<RoomLayout>) => void;
  onAddOpening: (op: Omit<RoomOpening, "id">) => void;
  onUpdateOpening: (id: string, patch: Partial<RoomOpening>) => void;
  onRemoveOpening: (id: string) => void;
  onAddAlcove: (a: Omit<RoomAlcove, "id">) => void;
  onUpdateAlcove: (id: string, patch: Partial<RoomAlcove>) => void;
  onRemoveAlcove: (id: string) => void;
}) {
  const enabled = !!layout?.enabled;
  return (
    <>
      <div className="form-section-title">Pomieszczenie</div>
      <div className="form">
        <div className="form-row">
          <label className="field-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
            />
            <span>Włącz pomieszczenie 3D (ściany, otwory, wnęki)</span>
          </label>
        </div>
        {enabled && layout && (
          <>
            <div className="form-row grid-3">
              <NumField
                label="Szerokość (X)"
                value={layout.width}
                onChange={(v) => onSetLayout({ width: Math.max(500, v) })}
              />
              <NumField
                label="Głębokość (Z)"
                value={layout.depth}
                onChange={(v) => onSetLayout({ depth: Math.max(500, v) })}
              />
              <NumField
                label="Wysokość"
                value={layout.height}
                onChange={(v) => onSetLayout({ height: Math.max(500, v) })}
              />
            </div>
            <div className="form-row">
              <NumField
                label="Grubość ścian"
                value={layout.wallThickness}
                onChange={(v) =>
                  onSetLayout({ wallThickness: Math.max(20, v) })
                }
              />
            </div>

            <div className="form-section-title">
              Otwory ({layout.openings.length})
            </div>
            <div className="form-actions">
              <button
                className="btn primary btn-sm"
                onClick={() =>
                  onAddOpening({
                    wall: "S",
                    kind: "door",
                    offset: 200,
                    width: 900,
                    height: 2050,
                    sillHeight: 0,
                  })
                }
              >
                + Drzwi
              </button>
              <button
                className="btn ghost btn-sm"
                onClick={() =>
                  onAddOpening({
                    wall: "E",
                    kind: "window",
                    offset: 400,
                    width: 1200,
                    height: 1400,
                    sillHeight: 900,
                  })
                }
              >
                + Okno
              </button>
            </div>
            {layout.openings.map((op) => (
              <OpeningRow
                key={op.id}
                layout={layout}
                opening={op}
                onUpdate={(patch) => onUpdateOpening(op.id, patch)}
                onRemove={() => onRemoveOpening(op.id)}
              />
            ))}

            <div className="form-section-title">
              Wnęki ({layout.alcoves.length})
            </div>
            <div className="form-actions">
              <button
                className="btn primary btn-sm"
                onClick={() =>
                  onAddAlcove({
                    wall: "N",
                    offset: 500,
                    width: 1000,
                    depth: 400,
                  })
                }
              >
                + Wnęka
              </button>
            </div>
            {layout.alcoves.map((a) => (
              <AlcoveRow
                key={a.id}
                layout={layout}
                alcove={a}
                onUpdate={(patch) => onUpdateAlcove(a.id, patch)}
                onRemove={() => onRemoveAlcove(a.id)}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
