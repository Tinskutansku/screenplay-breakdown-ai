# Screenplay Breakdown AI

Käsikirjoitusten automaattinen purku ja tuotannon aikataulutustyökalu elokuva- ja tv-tuotannoille. Yhdistää viisi vuotta tuotantokoordinoinnin kokemusta (mm. Ivalo-sarja) käytännön ohjelmistokehitykseen — projekti ratkaisee oikean, itse koetun ongelman: käsikirjoitusten manuaalinen purkaminen kuvausaikataulua varten on hidasta ja virhealtista.

## Mitä sovellus tekee

- Parsii `.txt`- ja `.fdx`-muotoiset käsikirjoitukset automaattisesti: tunnistaa kohtaukset, INT/EXT-merkinnät, sijainnit, ajankohdan ja hahmot
- Poimii kohtauksista tuotannollisesti relevantin datan avainsanapohjaisesti (ääni, ajoneuvot, stuntit, puvustus, maskeeraus, taustanäyttelijät, SFX/VFX) sekä suomeksi että englanniksi
- Tarjoaa React-käyttöliittymän kohtaustaulukon selaamiseen, hakuun ja tilastojen (uniikit sijainnit/hahmot, esiintymismäärät) tarkasteluun
- Tietokantaskeema (21 taulua) kattaa koko tuotannon aikataulutuksen: script-revisiot, joustava stripboard, call sheetit, oikeat kuvauspaikat osoitteineen, cast-numerointi ja agenttien yhteystiedot

## Teknologiat

**Backend:** Python, FastAPI, SQLAlchemy, JWT-autentikointi (access/refresh-tokenit), bcrypt, pytest (53 testiä)
**Frontend:** React, TypeScript, Vite
**Tietokanta:** PostgreSQL (21 taulun skeema, validoitu `pglast`-kirjastolla)
**Dokumentaatio:** Arkkitehtuuripäätökset (ADR) jokaisesta suuremmasta datamallin päätöksestä

## Projektin tila

Aktiivisessa kehityksessä. Backend-logiikka, autentikaatio ja tietokantaskeema ovat valmiit ja testatut; tietokannan kytkeminen backendiin on seuraava vaihe. Yksityiskohtainen kehitysloki ja tekninen tilannekatsaus: [STATUS.md](./STATUS.md).

## Tausta

UI-suunnittelu (Script Breakdown, Strips Board, Call Sheet) tehty itsenäisesti Figmassa ja käyty tietokantaskeemaa vasten kohta kohdalta läpi — neljä puuttuvaa kenttää/taulua löytyi ja korjattiin tässä prosessissa ennen kuin niistä olisi tullut kalliimpi migraatio-ongelma myöhemmin.
