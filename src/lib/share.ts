import { Project, Room } from "../types";

export interface SharedPayload {
  v: 1;
  /** Nazwa przestrzeni z której pochodzi projekt - dla informacji. */
  roomName: string;
  /** Opcjonalny layout pomieszczenia - jeśli oryginał miał włączony. */
  roomLayout?: Room["layout"];
  /** Sam projekt (z szafami i elementami). */
  project: Project;
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function encodeShared(payload: SharedPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  // Base64 URL-safe: zamiana znaków + i / na - i _, usunięcie =
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeShared(s: string): SharedPayload | null {
  try {
    let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const bytes = base64ToBytes(b64);
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json);
    if (obj && obj.v === 1 && obj.project) return obj as SharedPayload;
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(payload: SharedPayload): string {
  const encoded = encodeShared(payload);
  const base =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "";
  return base + "#p=" + encoded;
}

export function readSharedFromHash(): SharedPayload | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const m = hash.match(/(?:^|[#&])p=([^&]+)/);
  if (!m) return null;
  return decodeShared(m[1]);
}

export function clearShareFromUrl(): void {
  if (typeof window === "undefined") return;
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname);
  }
}
