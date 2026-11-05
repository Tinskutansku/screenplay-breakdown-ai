# Screenplay Breakdown — frontend

React + TypeScript + Vite -käyttöliittymä käsikirjoitusten purkuun.

Käynnistys kehitystilassa (backend käynnissä osoitteessa `http://localhost:8000`, Vite välittää API-kutsut sinne):

```bash
npm install
npm run dev
```

Rakenne lyhyesti:

- `src/App.tsx` — tilanhallinta ja backend-kutsut (`/parse-script`, `/upload-script`)
- `src/components/` — syöttölomake, kohtaustaulukko, hakukontrollit, kohtauksen tiedot, tilastot
- `src/utils/sceneHelpers.ts` — suodatus, tilastot, elementtikategoriat ja stripboard-värit
- `src/types/scene.ts` — jaettu `Scene`-tyyppi backendin `Scene`-mallin kanssa
- `public/esimerkit/` — esimerkkikäsikirjoitus (.txt ja .fdx)

Tuotannossa FastAPI tarjoilee buildatun `dist`-kansion, ks. juuren `Dockerfile`.
