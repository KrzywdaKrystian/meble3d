import { useState } from "react";
import {
  useStore,
  useActiveProject,
  useActiveCabinet,
} from "../store";
import {
  DEFAULT_MATERIALS,
  ELEMENT_LABELS,
  ElementType,
  WardrobeElement,
} from "../types";

const TYPES: ElementType[] = [
  "bok",
  "wieniec",
  "polka",
  "plecy",
  "drzwi",
  "front-szuflady",
  "drazek",
  "cokol",
  "nozka",
  "inny",
];

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  suffix = "mm",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
        />
        <span className="suffix">{suffix}</span>
      </span>
    </label>
  );
}

function ElementForm({ el }: { el: WardrobeElement }) {
  const updateElement = useStore((s) => s.updateElement);
  const removeElement = useStore((s) => s.removeElement);
  const duplicateElement = useStore((s) => s.duplicateElement);
  const setSelected = useStore((s) => s.setSelected);

  const u = (patch: Partial<WardrobeElement>) => updateElement(el.id, patch);

  return (
    <div className="form">
      <div className="form-row">
        <label className="field">
          <span className="field-label">Nazwa</span>
          <span className="field-input">
            <input
              type="text"
              value={el.name}
              onChange={(e) => u({ name: e.target.value })}
            />
          </span>
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span className="field-label">Typ</span>
          <span className="field-input">
            <select
              value={el.type}
              onChange={(e) => u({ type: e.target.value as ElementType })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {ELEMENT_LABELS[t]}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <div className="form-section-title">Wymiary</div>
      <div className="form-row grid-3">
        <NumberField
          label="Szerokość"
          value={el.width}
          onChange={(v) => u({ width: Math.max(1, v) })}
        />
        <NumberField
          label="Wysokość"
          value={el.height}
          onChange={(v) => u({ height: Math.max(1, v) })}
        />
        <NumberField
          label="Głębokość"
          value={el.depth}
          onChange={(v) => u({ depth: Math.max(1, v) })}
        />
      </div>

      <div className="form-section-title">
        Pozycja w obrębie szafy (środek elementu)
      </div>
      <div className="form-row grid-3">
        <NumberField
          label="X (lewo / prawo)"
          value={el.x}
          onChange={(v) => u({ x: v })}
        />
        <NumberField label="Y (góra)" value={el.y} onChange={(v) => u({ y: v })} />
        <NumberField label="Z (przód)" value={el.z} onChange={(v) => u({ z: v })} />
      </div>

      <div className="form-section-title">Obrót (stopnie, wokół środka elementu)</div>
      <div className="form-row grid-3">
        <NumberField
          label="Wokół X (przechył)"
          value={el.rotationX ?? 0}
          onChange={(v) => u({ rotationX: v })}
          suffix="°"
        />
        <NumberField
          label="Wokół Y (obrót pionowy)"
          value={el.rotationY ?? 0}
          onChange={(v) => u({ rotationY: v })}
          suffix="°"
        />
        <NumberField
          label="Wokół Z (przechył boczny)"
          value={el.rotationZ ?? 0}
          onChange={(v) => u({ rotationZ: v })}
          suffix="°"
        />
      </div>
      {(el.rotationX || el.rotationY || el.rotationZ) ? (
        <div className="form-actions">
          <button
            className="btn ghost btn-sm"
            onClick={() =>
              u({ rotationX: 0, rotationY: 0, rotationZ: 0 })
            }
            title="Wyzeruj obrót elementu"
          >
            Wyzeruj obrót
          </button>
        </div>
      ) : null}

      <div className="form-section-title">Materiał</div>
      <div className="form-row">
        <label className="field">
          <span className="field-label">
            Opis materiału (lub wybierz z biblioteki)
          </span>
          <span className="field-input">
            <input
              type="text"
              list="material-presets"
              value={el.material}
              onChange={(e) => {
                const value = e.target.value;
                const preset = DEFAULT_MATERIALS.find(
                  (m) => m.name === value
                );
                if (preset) {
                  u({
                    material: preset.name,
                    thickness: preset.thickness,
                  });
                } else {
                  u({ material: value });
                }
              }}
            />
            <datalist id="material-presets">
              {DEFAULT_MATERIALS.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.note ?? ""} ({m.thickness} mm)
                </option>
              ))}
            </datalist>
          </span>
        </label>
      </div>
      <div className="form-row grid-3">
        <NumberField
          label="Grubość"
          value={el.thickness}
          onChange={(v) => u({ thickness: Math.max(0, v) })}
        />
        <NumberField
          label="Sztuk"
          value={el.quantity}
          onChange={(v) => u({ quantity: Math.max(1, Math.round(v)) })}
          suffix="szt."
        />
        <label className="field">
          <span className="field-label">Kolor</span>
          <span className="field-input">
            <input
              type="color"
              value={el.color}
              onChange={(e) => u({ color: e.target.value })}
            />
          </span>
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Notatka</span>
          <span className="field-input">
            <textarea
              rows={2}
              value={el.notes ?? ""}
              onChange={(e) => u({ notes: e.target.value })}
              placeholder="Np. okleić ABS od frontu"
            />
          </span>
        </label>
      </div>

      <div className="form-actions">
        <button className="btn ghost" onClick={() => setSelected(null)}>
          Zamknij
        </button>
        <button
          className="btn ghost"
          onClick={() => updateElement(el.id, { hidden: !el.hidden })}
        >
          {el.hidden ? "Pokaż" : "Ukryj"}
        </button>
        <button className="btn ghost" onClick={() => duplicateElement(el.id)}>
          Duplikuj
        </button>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm("Usunąć element „" + el.name + "”?")) {
              removeElement(el.id);
            }
          }}
        >
          Usuń
        </button>
      </div>
    </div>
  );
}

export function ElementEditor() {
  const project = useActiveProject();
  const cabinet = useActiveCabinet();
  const selectedId = useStore((s) => s.selectedElementId);
  const activeCabinetId = useStore((s) => s.activeCabinetId);
  const setActiveCabinet = useStore((s) => s.setActiveCabinet);
  const addElement = useStore((s) => s.addElement);
  const addDrawerSet = useStore((s) => s.addDrawerSet);
  const addDoorSet = useStore((s) => s.addDoorSet);
  const setSelected = useStore((s) => s.setSelected);
  const toggleHidden = useStore((s) => s.toggleHidden);
  const showAll = useStore((s) => s.showAll);

  const [openWizard, setOpenWizard] = useState<"none" | "drawer" | "door">(
    "none"
  );

  const selected = cabinet.elements.find((e) => e.id === selectedId);
  const hiddenCount = cabinet.elements.filter((e) => e.hidden).length;

  return (
    <div className="panel-content">
      {project.cabinets.length > 1 && (
        <div className="form">
          <div className="form-row">
            <label className="field">
              <span className="field-label">Szafa / moduł do edycji</span>
              <span className="field-input">
                <select
                  value={activeCabinetId}
                  onChange={(e) => setActiveCabinet(e.target.value)}
                >
                  {project.cabinets.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.elements.length} el.)
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="add-bar">
        <span className="add-bar-label">
          Dodaj element do <strong>{cabinet.name}</strong>:
        </span>
        <div className="chips">
          {TYPES.map((t) => (
            <button
              key={t}
              className="chip"
              onClick={() => addElement(t)}
              title={"Dodaj: " + ELEMENT_LABELS[t]}
            >
              + {ELEMENT_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="add-bar-label" style={{ marginTop: 10 }}>
          Szybkie kreatory:
        </div>
        <div className="chips">
          <button
            className={
              "chip" + (openWizard === "drawer" ? " chip-active" : "")
            }
            onClick={() =>
              setOpenWizard((v) => (v === "drawer" ? "none" : "drawer"))
            }
          >
            ▾ Szuflada (5 elementów)
          </button>
          <button
            className={
              "chip" + (openWizard === "door" ? " chip-active" : "")
            }
            onClick={() =>
              setOpenWizard((v) => (v === "door" ? "none" : "door"))
            }
          >
            ▾ Komplet drzwi
          </button>
        </div>
        {openWizard === "drawer" && (
          <DrawerWizardForm
            cabinet={cabinet}
            onSubmit={(p) => {
              addDrawerSet(p);
              setOpenWizard("none");
            }}
            onCancel={() => setOpenWizard("none")}
          />
        )}
        {openWizard === "door" && (
          <DoorWizardForm
            cabinet={cabinet}
            onSubmit={(p) => {
              addDoorSet(p);
              setOpenWizard("none");
            }}
            onCancel={() => setOpenWizard("none")}
          />
        )}
      </div>

      {selected ? (
        <ElementForm el={selected} />
      ) : (
        <div className="empty-hint">
          <p>
            Kliknij element na liście lub w widoku 3D, aby zmieniać jego
            wymiary i pozycję. Element trafi do szafy, w&nbsp;której się
            znajduje.
          </p>
        </div>
      )}

      <div className="elist-header">
        <div className="form-section-title">
          Elementy szafy „{cabinet.name}" ({cabinet.elements.length})
          {hiddenCount > 0 && (
            <span className="hidden-badge"> · ukryte: {hiddenCount}</span>
          )}
        </div>
        {hiddenCount > 0 && (
          <button className="btn ghost btn-sm" onClick={showAll}>
            Pokaż wszystkie
          </button>
        )}
      </div>
      <ul className="elist">
        {cabinet.elements.map((el) => (
          <li
            key={el.id}
            className={
              "elist-item" +
              (selectedId === el.id ? " active" : "") +
              (el.hidden ? " hidden" : "")
            }
            onClick={() => setSelected(el.id)}
          >
            <span className="elist-color" style={{ background: el.color }} />
            <span className="elist-name">
              <strong>{el.name}</strong>
              <small>
                {Math.round(el.width)} × {Math.round(el.height)} ×{" "}
                {Math.round(el.depth)} mm
              </small>
            </span>
            <span className="elist-type">{ELEMENT_LABELS[el.type]}</span>
            <button
              className="icon-btn"
              title={el.hidden ? "Pokaż" : "Ukryj"}
              aria-label={el.hidden ? "Pokaż element" : "Ukryj element"}
              onClick={(e) => {
                e.stopPropagation();
                toggleHidden(el.id);
              }}
            >
              {el.hidden ? "👁" : "⦸"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DrawerWizardForm({
  cabinet,
  onSubmit,
  onCancel,
}: {
  cabinet: ReturnType<typeof useActiveCabinet>;
  onSubmit: (p: {
    width: number;
    height: number;
    length: number;
    x: number;
    y: number;
    name?: string;
  }) => void;
  onCancel: () => void;
}) {
  const innerW = Math.max(100, cabinet.outerWidth - 36);
  const [width, setWidth] = useState(innerW);
  const [height, setHeight] = useState(200);
  const [length, setLength] = useState(
    Math.max(100, cabinet.outerDepth - 50)
  );
  const [x, setX] = useState(0);
  const [y, setY] = useState(400);
  const [name, setName] = useState("Szuflada");
  return (
    <div className="form sub-form" style={{ marginTop: 10 }}>
      <div className="form-row">
        <label className="field">
          <span className="field-label">Nazwa zestawu</span>
          <span className="field-input">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </span>
        </label>
      </div>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Szerokość frontu [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={width}
              onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Wysokość frontu [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Głębokość boków [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
      </div>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Pozycja X frontu [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={x}
              onChange={(e) => setX(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Wysokość Y środka [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={y}
              onChange={(e) => setY(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
      </div>
      <div className="form-actions">
        <button
          className="btn primary"
          onClick={() =>
            onSubmit({ width, height, length, x, y, name })
          }
        >
          Utwórz szufladę (5 elementów)
        </button>
        <button className="btn ghost" onClick={onCancel}>
          Anuluj
        </button>
      </div>
      <p className="hint">
        Generuje: front, 2 boki, tył (płyta) i dno HDF 3 mm. Pozycje są
        wyliczone tak, by szuflada wsunęła się w aktywną szafę. Po dodaniu
        możesz dowolnie poprawić pojedyncze elementy.
      </p>
    </div>
  );
}

function DoorWizardForm({
  cabinet,
  onSubmit,
  onCancel,
}: {
  cabinet: ReturnType<typeof useActiveCabinet>;
  onSubmit: (p: {
    count: number;
    totalWidth: number;
    height: number;
    gap: number;
    x: number;
    y: number;
    namePrefix?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [count, setCount] = useState(2);
  const [totalWidth, setTotalWidth] = useState(
    Math.max(100, cabinet.outerWidth - 6)
  );
  const [height, setHeight] = useState(
    Math.max(100, cabinet.outerHeight - 110)
  );
  const [gap, setGap] = useState(3);
  const [x, setX] = useState(0);
  const [y, setY] = useState(
    Math.round((cabinet.plinthHeight ?? 100) + (cabinet.outerHeight - (cabinet.plinthHeight ?? 100)) / 2)
  );
  const [namePrefix, setNamePrefix] = useState("Drzwi");
  return (
    <div className="form sub-form" style={{ marginTop: 10 }}>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Liczba drzwi</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={6}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 1)))
              }
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Szczelina [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={gap}
              onChange={(e) => setGap(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Prefiks nazwy</span>
          <span className="field-input">
            <input
              type="text"
              value={namePrefix}
              onChange={(e) => setNamePrefix(e.target.value)}
            />
          </span>
        </label>
      </div>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Łączna szerokość [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={totalWidth}
              onChange={(e) =>
                setTotalWidth(parseFloat(e.target.value) || 0)
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
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
      </div>
      <div className="form-row grid-3">
        <label className="field">
          <span className="field-label">Środek X [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={x}
              onChange={(e) => setX(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Środek Y [mm]</span>
          <span className="field-input">
            <input
              type="number"
              inputMode="numeric"
              value={y}
              onChange={(e) => setY(parseFloat(e.target.value) || 0)}
            />
          </span>
        </label>
      </div>
      <div className="form-actions">
        <button
          className="btn primary"
          onClick={() =>
            onSubmit({ count, totalWidth, height, gap, x, y, namePrefix })
          }
        >
          Utwórz {count} {count === 1 ? "drzwi" : "drzwi"}
        </button>
        <button className="btn ghost" onClick={onCancel}>
          Anuluj
        </button>
      </div>
      <p className="hint">
        Każde drzwi otrzymują równą szerokość = (szerokość − (n−1)×szczelina) / n.
        Z = przed frontem szafy (na zewnątrz korpusu).
      </p>
    </div>
  );
}
