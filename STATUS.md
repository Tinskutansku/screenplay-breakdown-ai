# Film AI Breakdown – nykytila ja seuraavat askeleet

Tarkoitus: yksi paikka josta näkee mikä oikeasti toimii, mikä on vain näytöstä, ja missä järjestyksessä kannattaa jatkaa. Ei vaadi uudelleenkirjoitusta — perusrakenne (FastAPI + React, routers/services/models-jako) on ihan toimiva.

## Toimii jo oikeasti

- FastAPI-backend, reitit `/scenes`, `/parse-script`, `/upload-script`
- `.txt`- ja `.fdx`-käsikirjoitusten parsinta: kohtauksen numero, INT/EXT, sijainti, aika
- React-frontend: kohtaustaulukko, haku, avaa/sulje kaikki, tilastonäkymä (uniikit sijainnit/hahmot, esiintymismäärät)

## Näyttää valmiilta mutta on stub

- `GET /scenes` palauttaa aina saman yhden kovakoodatun esimerkkikohtauksen — mitään ei oikeasti tallenneta
- `SQL/schema.sql` on olemassa (users, projects, scripts, scenes, scene_elements, shooting_days...) mutta **mikään backend-koodi ei koske siihen** — tietokantaa ei ole kytketty ollenkaan
- `Scene`-mallissa on kentät propsille, äänelle, vaatetukselle, sfx:lle, vfx:lle, stunteille jne., mutta parseri ei koskaan täytä niitä — ne jäävät aina tyhjiksi listoiksi UI:ssa

## Karkeat kohdat

- Hahmontunnistus (`extract_character_names_from_text`) on pelkkä "iso alkukirjain" -regex kuvaustekstistä → poimii myös paikannimiä ja muita vääriä positiivisia osumia
- Ei virhekäsittelyä väärin muotoilluille tai puutteellisille käsikirjoituksille
- Ei yhtään testiä parserille, joka on koko sovelluksen ydin

## Ehdotettu järjestys

1. ~~Siivoa koodi~~ — **tehty** (ks. alla)
2. **Kytke tietokanta** — schema on jo valmis, joten tämä poistaa kovakoodauksen ja tekee sovelluksesta oikeasti käyttökelpoisen useammalle projektille/käsikirjoitukselle ⬅ *seuraava askel*
3. **Paranna hahmontunnistusta** — poimi nimet dialogin CHARACTER-riveiltä (isot kirjaimet omalla rivillä ennen repliikkiä) kuvaustekstin sijaan
4. **Täytä loput Scene-kentät** — joko parempaan parsintaan tai antamalla käyttäjän täydentää props/sfx/vfx yms. käsin UI:ssa
5. **Lisää perustestit parseriin** ennen kuin siihen koskee enempää, koska regressioiden huomaaminen on tällä hetkellä mahdotonta

## Siivous 2026-07-06

- `parser_service.py`: `parse_screenplay` ja `parse_fdx` toistivat 