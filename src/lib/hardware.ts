import {
  Cabinet,
  DEFAULT_HARDWARE_PRICES,
  HardwareItem,
  HardwareKind,
  Project,
} from "../types";

/**
 * Wylicza listę okuć dla pojedynczej szafy na podstawie jej elementów oraz
 * konfiguracji cokołu. Heurystyka jest celowo zachowawcza – stolarz może
 * dopisać brakujące pozycje ręcznie.
 */
export function computeHardwareForCabinet(cabinet: Cabinet): HardwareItem[] {
  const items: HardwareItem[] = [];
  const drzwi = cabinet.elements.filter(
    (e) => !e.hidden && e.type === "drzwi"
  );
  const fronty = cabinet.elements.filter(
    (e) => !e.hidden && e.type === "front-szuflady"
  );
  const drazki = cabinet.elements.filter(
    (e) => !e.hidden && e.type === "drazek"
  );
  const polki = cabinet.elements.filter(
    (e) => !e.hidden && e.type === "polka"
  );

  // Zawiasy: 2 dla drzwi do 1000 mm wysokości, 3 do 1700, 4 wyżej.
  let zawiasy = 0;
  for (const d of drzwi) {
    if (d.height <= 1000) zawiasy += 2 * d.quantity;
    else if (d.height <= 1700) zawiasy += 3 * d.quantity;
    else zawiasy += 4 * d.quantity;
  }
  if (zawiasy > 0) {
    items.push({
      kind: "zawias",
      name: "Zawias puszkowy 35 mm (samodomyk)",
      quantity: zawiasy,
      pricePerUnit: DEFAULT_HARDWARE_PRICES.zawias,
      sourceCabinetName: cabinet.name,
    });
  }

  // Uchwyty: 1 na drzwi + 1 na front szuflady.
  const uchwyty =
    drzwi.reduce((s, d) => s + d.quantity, 0) +
    fronty.reduce((s, f) => s + f.quantity, 0);
  if (uchwyty > 0) {
    items.push({
      kind: "uchwyt-meblowy",
      name: "Uchwyt meblowy",
      quantity: uchwyty,
      pricePerUnit: DEFAULT_HARDWARE_PRICES["uchwyt-meblowy"],
      sourceCabinetName: cabinet.name,
    });
  }

  // Prowadnice szuflad: 1 komplet na każdy front szuflady.
  const prowadnice = fronty.reduce((s, f) => s + f.quantity, 0);
  if (prowadnice > 0) {
    items.push({
      kind: "prowadnica-szuflady",
      name: "Prowadnica szuflady (komplet, 450 mm)",
      quantity: prowadnice,
      pricePerUnit: DEFAULT_HARDWARE_PRICES["prowadnica-szuflady"],
      sourceCabinetName: cabinet.name,
    });
  }

  // Drążki: 1 komplet wieszaków + 2 mocowania na drążek.
  const drazkiTotal = drazki.reduce((s, d) => s + d.quantity, 0);
  if (drazkiTotal > 0) {
    items.push({
      kind: "wieszak-drazek",
      name: "Mocowanie drążka (komplet)",
      quantity: drazkiTotal,
      pricePerUnit: DEFAULT_HARDWARE_PRICES["wieszak-drazek"],
      sourceCabinetName: cabinet.name,
    });
  }

  // Półki: 4 podpórki na każdą półkę.
  const podporki = polki.reduce((s, p) => s + p.quantity * 4, 0);
  if (podporki > 0) {
    items.push({
      kind: "kolek",
      name: "Podpórka półki (regulowana)",
      quantity: podporki,
      pricePerUnit: 1.2,
      sourceCabinetName: cabinet.name,
    });
  }

  // Stopy: tylko gdy projekt cokołu wymaga - liczymy z elementów typu nozka.
  const nozki = cabinet.elements.filter(
    (e) => !e.hidden && e.type === "nozka"
  );
  if (nozki.length > 0) {
    const reg = nozki.filter((n) => n.material.toLowerCase().includes("regul"));
    const ozd = nozki.filter((n) => !reg.includes(n));
    if (reg.length > 0) {
      items.push({
        kind: "stopa-regulowana",
        name: "Stopa regulowana ABS / metal",
        quantity: reg.reduce((s, n) => s + n.quantity, 0),
        pricePerUnit: DEFAULT_HARDWARE_PRICES["stopa-regulowana"],
        sourceCabinetName: cabinet.name,
      });
    }
    if (ozd.length > 0) {
      items.push({
        kind: "stopa-ozdobna",
        name: "Stopa ozdobna drewniana",
        quantity: ozd.reduce((s, n) => s + n.quantity, 0),
        pricePerUnit: DEFAULT_HARDWARE_PRICES["stopa-ozdobna"],
        sourceCabinetName: cabinet.name,
      });
    }
  }

  // Konfirmaty: heurystyka 8 na typowy korpus + 4 na każde drzwi/szufladę.
  const korpusElements = cabinet.elements.filter(
    (e) =>
      !e.hidden &&
      (e.type === "bok" || e.type === "wieniec" || e.type === "polka")
  ).length;
  const konfirmaty = korpusElements * 4 + drzwi.length * 2 + fronty.length * 2;
  if (konfirmaty > 0) {
    items.push({
      kind: "konfirmat",
      name: "Konfirmat 7 × 50 mm",
      quantity: konfirmaty,
      pricePerUnit: DEFAULT_HARDWARE_PRICES.konfirmat,
      sourceCabinetName: cabinet.name,
    });
  }

  return items;
}

export function computeHardwareForProject(project: Project): HardwareItem[] {
  const all = project.cabinets.flatMap((c) => computeHardwareForCabinet(c));
  // Scal pozycje tego samego rodzaju + nazwy + ceny: sumuj ilości.
  const map = new Map<string, HardwareItem>();
  for (const item of all) {
    const key = item.kind + "|" + item.name + "|" + item.pricePerUnit;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      const sources = new Set(
        (existing.sourceCabinetName ?? "").split(", ").filter(Boolean)
      );
      if (item.sourceCabinetName) sources.add(item.sourceCabinetName);
      existing.sourceCabinetName = Array.from(sources).join(", ");
    } else {
      map.set(key, { ...item });
    }
  }
  // Zsumuj porządek po cenie malejąco.
  return Array.from(map.values()).sort(
    (a, b) => b.pricePerUnit * b.quantity - a.pricePerUnit * a.quantity
  );
}

export function hardwareLineTotal(item: HardwareItem): number {
  return item.quantity * item.pricePerUnit;
}

export function hardwareSubtotal(items: HardwareItem[]): number {
  return items.reduce((s, i) => s + hardwareLineTotal(i), 0);
}

export function formatHardwareKind(kind: HardwareKind): string {
  return kind.replace(/-/g, " ");
}
