/**
 * Bezpieczne parsowanie wartości liczbowej z inputu.
 * - zwraca `prev` gdy raw nie jest poprawną liczbą,
 * - klampuje do [min, max] gdy podane.
 */
export function parseNumber(
  raw: string,
  prev: number,
  opts?: { min?: number; max?: number }
): number {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return prev;
  return clampNumber(n, opts?.min, opts?.max);
}

export function clampNumber(n: number, min?: number, max?: number): number {
  let v = n;
  if (typeof min === "number" && v < min) v = min;
  if (typeof max === "number" && v > max) v = max;
  return v;
}

/** Zaokrągla do najbliższej wielokrotności kroku (np. 1 mm). */
export function snapNumber(n: number, step: number = 1): number {
  return Math.round(n / step) * step;
}

/**
 * Walidator par „range" – sprawdza czy [offset, offset+width] mieści się w
 * [0, max]. Zwraca komunikat błędu lub null.
 */
export function validateRange(
  offset: number,
  width: number,
  max: number,
  label: string = "wartość"
): string | null {
  if (offset < 0) return label + ": offset nie może być ujemny.";
  if (width <= 0) return label + ": szerokość musi być dodatnia.";
  if (offset + width > max) {
    return (
      label +
      ": koniec (" +
      Math.round(offset + width) +
      " mm) wystaje poza dostępne " +
      Math.round(max) +
      " mm."
    );
  }
  return null;
}
