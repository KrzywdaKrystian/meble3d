import { parseNumber } from "../lib/validation";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  error?: string | null;
}

/**
 * Liczbowe pole formularza z bezpiecznym parsowaniem (NaN-safe), klampem
 * i opcjonalnym komunikatem błędu. Kompatybilne z istniejącym CSS `.field`.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "mm",
  placeholder,
  disabled,
  hint,
  error,
}: NumberFieldProps) {
  return (
    <label className={"field" + (error ? " field-error" : "")}>
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) =>
            onChange(parseNumber(e.target.value, value, { min, max }))
          }
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </span>
      {error && <span className="field-error-text">{error}</span>}
      {hint && !error && <span className="field-hint-text">{hint}</span>}
    </label>
  );
}
