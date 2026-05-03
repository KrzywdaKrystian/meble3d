import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { useStore } from "./store";
import { clearShareFromUrl, readSharedFromHash } from "./lib/share";

// Auto-import projektu z #p=... w adresie URL przed pierwszym renderem.
const shared = readSharedFromHash();
if (shared) {
  // Użyj API store bezpośrednio – persist załaduje stan asynchronicznie,
  // ale rehydrate jest synchroniczny dla zustand/persist v4 z localStorage.
  useStore.getState().importSharedProject({
    project: shared.project,
    roomName: shared.roomName,
    roomLayout: shared.roomLayout,
  });
  clearShareFromUrl();
  if (typeof window !== "undefined") {
    setTimeout(() => {
      alert(
        'Otrzymano projekt z linku.\nZapisany w przestrzeni „Udostępnione (link)" jako nowa pozycja.'
      );
    }, 50);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
