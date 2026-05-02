# Meble3D – konfigurator szafy 3D

Aplikacja webowa (React + Three.js) do projektowania szaf z elementów o
zadanych wymiarach (szerokość × wysokość × głębokość). Każdy element pojawia
się od razu w widoku 3D, a po zakończeniu projektowania można wygenerować
listę elementów do zamówienia u stolarza.

## Funkcje

- Widok 3D z obrotem, zoomem i przesuwaniem (działa na telefonie – obsługa
  gestów dotykowych).
- Dodawanie elementów z gotowymi typami: bok, wieniec, półka, plecy, drzwi,
  front szuflady, drążek, cokół, „inny”.
- Każdy element ma osobno zadawane wymiary, pozycję, materiał, grubość,
  ilość sztuk, kolor i notatkę dla stolarza.
- Domyślny szablon szafy 1000 × 2200 × 600 mm jako punkt startu.
- Lista elementów dla stolarza – pogrupowana po wymiarach + podsumowanie
  liczby sztuk i powierzchni płyt.
- Eksport listy do CSV (otwiera się w Excelu/Numbers/Google Sheets).
- Drukowanie / zapis do PDF z poziomu przeglądarki.
- Wiele projektów zapisywanych w `localStorage` – każdy projekt można
  duplikować, zmieniać nazwę i kasować.
- Layout responsywny: na telefonie panel sterowania jest pod widokiem 3D.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Domyślnie Vite uruchamia się na `http://localhost:5173`. Dzięki opcji
`--host` serwer nasłuchuje też na adresie LAN, więc po wpisaniu w telefonie
adresu typu `http://192.168.x.x:5173` aplikacja działa na komórce (telefon
i komputer muszą być w tej samej sieci Wi‑Fi).

## Build produkcyjny

```bash
npm run build
npm run preview
```

Wygenerowane pliki w `dist/` to statyczna strona – można ją opublikować na
GitHub Pages, Netlify, Vercel, Cloudflare Pages itp. Po publikacji aplikacja
będzie dostępna z telefonu z dowolnej sieci.

## Układ współrzędnych

- jednostka: milimetry,
- `X` – szerokość (lewo / prawo, środek szafy = 0),
- `Y` – wysokość (podłoga = 0),
- `Z` – głębokość (przód szafy w +Z, plecy w −Z),
- pozycja elementu = środek bryły.

## Stack

- React 18 + TypeScript
- Vite
- Three.js + React Three Fiber + drei
- Zustand (z persystencją w localStorage)
