import {
  useStore,
  useActiveProject,
  useActiveCabinet,
} from "../store";
import { ELEMENT_LABELS, ElementType, WardrobeElement } from "../types";

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

      <div className="form-section-title">Materiał</div>
      <div className="form-row">
        <label className="field">
          <span className="field-label">Opis materiału</span>
          <span className="field-input">
            <input
              type="text"
              value={el.material}
              onChange={(e) => u({ material: e.target.value })}
            />
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
  const setSelected = useStore((s) => s.setSelected);
  const toggleHidden = useStore((s) => s.toggleHidden);
  const showAll = useStore((s) => s.showAll);

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
