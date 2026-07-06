# Film AI Breakdown — frontend

React + TypeScript + Vite -käyttöliittymä käsikirjoitusten kohtausanalyysiin.

Käynnistys kehitystilassa (backend pitää olla käynnissä osoitteessa `http://localhost:8000`):

```bash
npm install
npm run dev
```

Rakenne lyhyesti:

- `src/App.tsx` — tilanhallinta ja backend-kutsut (`/scenes`, `/parse-script`, `/upload-script`)
- `src/components/` — kohtaustaulukko, hakukontrollit, kohtauksen tiedot, tilastot
- `src/utils/sceneHelpers.ts` — suodatus ja tilastojen laskenta
- `src/types/scene.ts` — jaettu `Scene`-tyyppi backendin `Scene`-mallin kanssa

Projektin kokonaistila ja seuraavat askeleet: ks. `../STATUS.md`.
