# Film AI Breakdown – nykytila ja seuraavat askeleet

Tarkoitus: yksi paikka josta näkee mikä oikeasti toimii, mikä on vain näytöstä, ja missä järjestyksessä kannattaa jatkaa. Ei vaadi uudelleenkirjoitusta — perusrakenne (FastAPI + React, routers/services/models-jako) on ihan toimiva.

## Toimii jo oikeasti

- FastAPI-backend, reitit `/scenes`, `/parse-script`, `/upload-script`
- `.txt`- ja `.fdx`-käsikirjoitusten parsinta: kohtauksen numero, INT/EXT, sijainti, aika
- React-frontend: kohtaustaulukko, haku, avaa/sulje kaikki, tilastonäkymä (uniikit sijainnit/hahmot, esiintymismäärät)

## Näyttää valmiilta mutta on stub

- `GET /scenes` palauttaa aina saman yhden kovakoodatun esimerkkikohtauksen — mitään ei oikeasti tallenneta
- `SQL/schema.sql` on olemassa (users, projects, scripts, scenes, scene_elements, shooting_days...) mutta **mikään backend-koodi ei koske siihen** — tietokantaa ei ole kytketty ollenkaan
- `Scene`-mallissa `props`, `set_dressing` ja `notes` jäävät yhä aina tyhjiksi (ei luotettavaa tekstisignaalia ilman oikeaa NLP/AI-poimintaa) — loput kentät saavat nyt kevyen sääntöpohjaisen arvauksen, ks. alla

## Karkeat kohdat (yhä auki)

- `props`, `set_dressing`, `notes` -kentät jäävät tyhjiksi — vaatisivat oikean AI-pohjaisen poiminnan tai käyttäjän manuaalisen täydennyksen UI:ssa
- Sääntöpohjainen avainsanapoiminta (sound/vehicles/stunts/wardrobe/makeup_hair/background_actors) on väistämättä epätarkka: kattavuus rajallinen eikä kaikkia tapauksia voi kattaa avainsanalistalla

## Ehdotettu järjestys

1. Siivoa koodi — tehty
2. Paranna hahmontunnistusta, täytä tyhjät kentät, lisää testit ja virheenkäsittely — tehty (ks. alla)
3. Kytke tietokanta — schema on jo valmis, joten tämä poistaa kovakoodauksen ja tekee sovelluksesta oikeasti käyttökelpoisen useammalle projektille/käsikirjoitukselle - seuraava askel
4. Myöhemmin: oikea AI/NLP-pohjainen poiminta props/set_dressing/notes-kentille (sääntöpohjainen ei riitä näihin)

## Siivous 2026-07-06

- `parser_service.py`: `parse_screenplay` ja `parse_fdx` toistivat saman ~30 rivin INT/EXT/sijainti/aika-parsintalogiikan - eriytetty yhteiseksi `parse_scene_heading`-funktioksi. Käytös testattu identtiseksi.
- Poistettu käyttämätön `analysis_service.py` (kukaan ei kutsunut sitä, ja frontend laskee samat tilastot jo itse `sceneHelpers.ts`:ssä). Voidaan tuoda takaisin palvelinpuolen versiona kun DB on kytketty.
- Poistettu käyttämätön Vite-boilerplate: `App.css` (ei importoitu mistään) ja `src/assets/react.svg`
- `index.css`: siivottu pois Vite-templaatin tumma oletusteema, joka oli ristiriidassa sovelluksen omien vaaleiden inline-tyylien kanssa (huono kontrasti tumman tilan käyttäjillä)
- `frontend/README.md`: korvattu oletus-Vite-readme lyhyellä projektikuvauksella
- Lisätty `.gitattributes` normalisoimaan rivinvaihdot (CRLF/LF-sotku sai `git status`:n näyttämään koko repon muokattuna)

## Hahmontunnistus, tyhjät kentät, testit ja virheenkäsittely 2026-07-06

- FDX-hahmontunnistus: `.fdx`-tiedostot sisältävät koneluettavan `Character`-kappaletyypin, jota parseri ei aiemmin käyttänyt ollenkaan (arvasi hahmot vain Action-tekstistä regexillä). Nyt Character-rivit luetaan suoraan luotettavana lähteenä.
- TXT-hahmontunnistus: plain-tekstissä ei ole kappaletyyppejä, joten lisätty pieni tilakone joka tunnistaa yksinäiset ISOT KIRJAIMET -rivit hahmoreplikoiden vetäjiksi (kuten oikeassa käsikirjoitusformaatissa) ja jättää niitä seuraavan repliikkitekstin pois `description`-kentästä - sama periaate kuin FDX:ssä jo oli Action- vs. Dialogue-tyyppien kanssa.
- Tämä korjasi myös ison piilevän bugin: repliikkiteksti vuoti aiemmin `description`-kenttään ja joka lauseen alkukirjain tulkittiin mahdolliseksi hahmoksi ("Puhelin soi" -> "Puhelin" hahmoksi). Laajennettu myös suomenkielisten täytesanojen (pronominit, konjunktiot, yleiset substantiivit) ohituslista, koska alkuperäinen lista oli kirjoitettu vain englanniksi.
- Tyhjät Scene-kentät: lisätty kevyt avainsanapohjainen poiminta kentille `sound`, `vehicles`, `stunts`, `wardrobe`, `makeup_hair`, `background_actors`, `sfx`, `vfx` (englanti + suomi, taivutusmuodot huomioiden). `props`, `set_dressing`, `notes` jätetty tarkoituksella tyhjiksi - niille ei ole luotettavaa sääntöpohjaista signaalia.
- Kaksi tarkkuusbugia korjattu poiminnassa: (1) avainsanan piti täsmätä sanan alkuun, ei mihin tahansa kohtaan, koska esim. "van" osui suomen taivutuspäätteeseen sanassa "pakenevan"; (2) liian yleiset sanat (esim. "hyppää", "Taustalla") poistettu/lisätty ohituslistoihin vääriä positiivisia varten.
- Testit: `backend/tests/` sisältää nyt 32 pytest-testiä (`parser_service.py`:lle, `/parse-script` + `/upload-script` -reiteille, ja globaalille poikkeuskäsittelijälle), `backend/requirements.txt` + `requirements-dev.txt` + `pytest.ini` lisätty (ei ollut aiemmin mitään riippuvuuslistaa).
- Virheenkäsittely: backend palauttaa nyt oikeat HTTP 400 -vastaukset selkeällä suomenkielisellä virheviestillä: tyhjä käsikirjoitusteksti, tyhjä tiedosto, väärä tiedostomuoto, väärä merkistö (.txt), viallinen XML (.fdx). Aiemmin väärä tiedostomuoto palautti `{"error": ...}` HTTP 200:lla, mikä olisi rikkonut frontendin (odotti taulukkoa, sai dictin). Frontend lukee nyt backendin virheviestin (`detail`-kentän) ja näyttää sen erillisenä bannerina lomakkeen alla - käyttäjän kirjoittama teksti/valittu tiedosto ei enää katoa virhetilanteessa (aiemmin koko sivu vaihtui virhenäkymäksi).
- Globaali poikkeuskäsittelijä (`main.py`): täysin odottamaton sisäinen virhe (bugi, ei käyttäjän syöttövirhe) palautti aiemmin paljasta tekstiä "Internal Server Error" HTTP 500:lla, kun kaikki muut virheet palauttavat JSONia (`{"detail": ...}`). Lisätty catch-all-käsittelijä joka palauttaa saman JSON-muodon myös näissä tapauksissa, jotta frontendin ei tarvitse erikseen varautua muihin vastausmuotoihin.
- Varmistettu: kaikki 32 testiä läpi, backendin virhepolut (mukaan lukien odottamaton sisäinen virhe) testattu TestClientilla, frontendin `tsc` ja `eslint` puhtaita.

Muutokset ovat työhakemistossa, ei vielä committoitu.

Päivitä tätä tiedostoa sitä mukaa kun kohtia ratkeaa, niin kokonaiskuva pysyy hallussa ilman että pitää lukea koko koodikanta uudelleen joka kerta.
