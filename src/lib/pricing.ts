import {
  Cabinet,
  DEFAULT_PRICING,
  PricingSettings,
  Project,
  WardrobeElement,
} from "../types";
import {
  computeHardwareForProject,
  hardwareSubtotal,
} from "./hardware";

/** Powierzchnia panelu w m² (największe dwa wymiary). */
export function elementBoardArea(el: WardrobeElement): number {
  const dims = [el.width, el.height, el.depth].sort((a, b) => b - a);
  return (dims[0] * dims[1] * el.quantity) / 1_000_000;
}

export function cabinetBoardArea(cabinet: Cabinet): number {
  return cabinet.elements
    .filter((e) => !e.hidden && e.type !== "nozka" && e.type !== "drazek")
    .reduce((s, e) => s + elementBoardArea(e), 0);
}

export function projectBoardArea(project: Project): number {
  return project.cabinets.reduce((s, c) => s + cabinetBoardArea(c), 0);
}

/**
 * Estymacja liczby standardowych płyt 2800 × 2070 (lub innego rozmiaru
 * z `pricing.sheetWidth/Height`) z zapasem 18% na rozkrój.
 */
export function estimateSheetCount(
  area: number,
  pricing: PricingSettings = DEFAULT_PRICING
): number {
  const sheetArea = (pricing.sheetWidth * pricing.sheetHeight) / 1_000_000;
  if (sheetArea <= 0) return 0;
  return Math.ceil((area * 1.18) / sheetArea);
}

export interface QuoteBreakdown {
  boardAreaM2: number;
  sheetCount: number;
  boardCost: number;
  hardwareCost: number;
  laborCost: number;
  subtotal: number;
  margin: number;
  net: number;
  vat: number;
  total: number;
}

export function buildQuote(
  project: Project,
  pricing: PricingSettings = DEFAULT_PRICING
): QuoteBreakdown {
  const boardArea = projectBoardArea(project);
  const sheetCount = estimateSheetCount(boardArea, pricing);
  const boardCost = boardArea * pricing.defaultBoardPricePerM2;
  const hardwareCost = hardwareSubtotal(computeHardwareForProject(project));
  const laborCost = project.cabinets.length * pricing.laborPerCabinet;
  const subtotal = boardCost + hardwareCost + laborCost;
  const margin = subtotal * (pricing.marginPercent / 100);
  const net = subtotal + margin;
  const vat = net * (pricing.vatPercent / 100);
  const total = net + vat;
  return {
    boardAreaM2: boardArea,
    sheetCount,
    boardCost,
    hardwareCost,
    laborCost,
    subtotal,
    margin,
    net,
    vat,
    total,
  };
}

export function formatPLN(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 2,
  }).format(amount);
}
