# Screenplay Breakdown – nykytila ja kehitysloki

Projekti on päätetty valmiiksi demoksi (ks. `docs/adr/0005-finish-as-parser-demo.md`). Alla ensin nykytila, sen jälkeen kehitysloki aikajärjestyksessä.

## Nykytila (2026-11-05)

Kaikki sovelluksessa näkyvä toimii oikeasti, mitään puolivalmista reittiä ei ole jäljellä.

- FastAPI-backend, reitit `/parse-script`, `/upload-script` ja `/health`
- `.txt`- ja `.fdx`-käsikirjoitusten parsinta: kohtaukset, INT/EXT, paikka alipaikkoineen, ajankohta, hahmot, sääntöpohjaiset tuotantoelementit
- React-frontend: esimerkkikäsikirjoitus, kohtaustaulukko stripboard-väreillä, haku, tilastot
- Yksi Docker-image, jossa FastAPI tarjoilee myös buildatun frontendin; `render.yaml` julkaisua varten
- 39 backend-testiä, frontendin `tsc` ja `eslint` puhtaita

Tietoiset rajaukset:

- `props`, `set_dressing` ja `notes` jäävät tyhjiksi, koska sääntöpohjainen poiminta ei tunnista niitä luotettavasti
- Avainsanapoiminnan kattavuus on rajallinen eikä Figma-UI:n "Music/Playback"-kategoriaa tunnisteta
- Hahmo, joka ei koskaan puhu ja mainitaan vain virkkeen alussa, jää tunnistamatta (hinta siitä, ettei virkkeen alun substantiiveja tulkita hahmoiksi)
- Tietokantaskeemaa (`SQL/schema.sql`) ja autentikointia ei ole kytketty. Autentikoinnin toteutus testeineen on tagissa `auth-groundwork`.

## Kehitysloki

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

## Autentikointi ja auktorisointi 2026-07-07

Päätös dokumentoitu: `docs/adr/0001-authentication-and-authorization.md`. Lyhyesti: JWT (access + refresh) sekä sähköposti/salasana että Google-kirjautuminen, koska roadmapissa on jaettu tiimityö (stripboard, call sheetit) joka vaatii useamman käyttäjän pääsyn samaan projektiin - siksi `projects.user_id`-mallin sijaan `project_members`-taulu rooleilla.

- `SQL/schema.sql`: lisätty `users.password_hash`, `users.email_verified`, `oauth_accounts`, `refresh_tokens`, `project_members`. `projects.user_id` muutettu `projects.created_by`:ksi (näyttöä varten) - varsinainen pääsynhallinta menee jatkossa `project_members`-taulun kautta.
- `backend/config.py`: ympäristömuuttujat (SECRET_KEY, token-vanhenemisajat, Google OAuth -asetukset), dev-oletusarvoilla jos `.env` puuttuu.
- `backend/services/security.py`: salasanan hashays (bcrypt via passlib) ja JWT-tokenit. Access- ja refresh-tokenit erotettu `type`-claimilla toisistaan tahattomien sekaannusten estämiseksi - yleinen JWT-virhe jota moni ei muista suojata.
- `backend/routers/auth.py`: `/auth/register`, `/auth/login` (palauttavat 501, DB puuttuu), `/auth/refresh` (toimii jo oikeasti, koska tokenin validius ei vaadi DB:tä - vain sen mahdollinen peruutus DB:ssä puuttuu vielä), `/auth/me` (toimiva esimerkki suojatusta reitistä), `/auth/google/login` + `/auth/google/callback` (rungot, vaativat oikeat Google-tunnukset).
- `backend/dependencies.py`: `get_current_user_id` (validoi Bearer-tokenin - toimii täysin jo nyt) ja `get_current_user` (palauttaa toistaiseksi pelkän id:n, täydennetään profiililla kun DB on kytketty).
- `.env.example` lisätty: SECRET_KEY, token-vanhenemisajat, Google OAuth -paikkamerkit, DATABASE_URL. `.env` on jo `.gitignore`:ssa.
- Uudet riippuvuudet: `passlib[bcrypt]`, `python-jose[cryptography]`, `authlib`, `httpx`, `email-validator`.
- Testit: 21 uutta pytest-testiä (`test_security.py`, `test_auth_router.py`) - salasanan hashaus/tarkistus, tokenien luonti/validointi/vanheneminen/tyyppitarkistus/väärennössuoja, `/auth/me`:n hyväksyntä/hylkäys eri tokeneilla. Yhteensä 53 backend-testiä.
- Ei vielä tehty: mitään olemassa olevaa reittiä (`/scenes`, `/parse-script`, `/upload-script`) ei ole suojattu - tämä tulee osana DB-integraatiota, koska ilman DB:tä ei ole vielä mitä suojata (kaikki data on kovakoodattua/ei-omistettua).
- Varmistettu: kaikki 53 testiä läpi, `/auth/register` + `/auth/login` palauttavat oikein 501:n, `/auth/refresh` ja `/auth/me` toimivat oikeasti jo nyt oikeilla ja vääränlaisilla tokeneilla testattuna, frontendin `tsc` ja `eslint` puhtaita (ei koskettu tässä kierroksessa).

## Tuotannon aikataulutuksen datamalli 2026-07-07

Päätös dokumentoitu: `docs/adr/0002-production-scheduling-data-model.md`. Kolme aukkoa löydettiin ja korjattiin, kaikki ennen tietokannan kytkemistä, koska korjaaminen jälkikäteen olisi vaatinut oikean datan migraatiota:

- **Script-revisiot**: uusi `script_revisions`-taulu `scripts`-taulun alle (värikoodatut sivut: White, Blue, Pink...). `scenes` viittaa nyt `script_revision_id`:hen `script_id`:n sijaan. Vain yksi revisio per script voi olla `is_current` (osittainen uniikki-indeksi varmistaa tämän).
- **Joustava stripboard**: uusi `strips`-taulu ja `strip_scenes`-liitostaulu `strips`:n ja `scenes`:n välillä. `schedule_items` sijoittaa nyt stripin (ei suoraan kohtausta) kuvauspäivälle. Tämä mahdollistaa sekä yhden kohtauksen jakamisen useaksi stripiksi (pitkä kohtaus kuvataan monena päivänä) että useamman kohtauksen yhdistämisen yhdeksi stripiksi (sama setup kattaa monta lyhyttä kohtausta) - alkuperäinen malli (schedule_items suoraan scene_id:hen) ei tukenut kumpaakaan.
- **Call sheetit**: uusi `contacts`-taulu oikeille ihmisille (näyttelijät, kruunu - puhelinnumero, rooli, osasto), koska `characters`-taulu on vain fiktiivisiä hahmoja eikä sisällä yhteystietoja. `characters.played_by_contact_id` linkittää hahmon oikeaan näyttelijään. Uudet `call_sheets` (yksi per kuvauspäivä) ja `call_sheet_entries` (henkilökohtainen call-aika per call sheet) -taulut kattavat call sheetin logistiikkakerroksen ilman että aikataulutieto duplikoituu.
- Varmistettu: koko skeema jäsentyi virheettä oikealla Postgres-kieliopilla (`pglast`-kirjasto, koska tässä ympäristössä ei ole ajettavaa Postgresia), ja jokainen `REFERENCES`-viittaus tarkistettiin osoittavan aiemmin määriteltyyn tauluun (taulujen luontijärjestys on oikea). Ei ole vielä ajettu oikeaa tietokantaa vastaan.

Committoitu (`916d119`, `ab7107f`).

## Oikean maailman kuvauspaikat 2026-07-07

Päätös dokumentoitu: `docs/adr/0003-real-world-shooting-locations.md`. Sama kuvio kuin ADR-0002:ssa hahmot vs. yhteystiedot, nyt paikoille: `locations`-taulu sisälsi vain käsikirjoituksen fiktiivisen paikan nimen ("Annan koti"), ei mitään tapaa liittää siihen oikeaa kuvausosoitetta.

- Uusi `shooting_locations`-taulu: osoite, kaupunki, postinumero, koordinaatit, paikan yhteyshenkilö, parkkeeraus-/kulkuohjeet, lupatilanne.
- `locations.shooting_location_id` (nullable FK) linkittää fiktiivisen paikan yhteen `shooting_locations`-riviin. Moni `locations`-rivi voi osoittaa samaan `shooting_locations`-riviin - yksi oikea osoite kattaa usein monta scriptin paikkaa (esim. "Annan koti - keittiö" ja "Annan koti - piha" kuvataan samassa talossa).
- Mallinnettu tarkoituksella samalla periaatteella kuin `characters.played_by_contact_id`: yksi nykyinen linkki, ei historiaa eikä useita ehdokkaita. Paikkaskoutaus-workflow (useita ehdokasosoitteita) jätetty tulevaisuuteen, jos sille joskus tulee tarvetta.
- Varmistettu: skeema jäsentyy virheettä `pglast`:lla (42 SQL-lausetta), ja `shooting_locations` on määritelty ennen `locations`:ia skeemassa niin että viittaus osoittaa jo olemassa olevaan tauluun.

## Figma-UI:n katselmointi: cast-numerointi, agentin yhteystiedot, jaetut call-ajat, osastokohtaiset huomiot 2026-07-07

Päätös dokumentoitu: `docs/adr/0004-call-sheet-and-cast-ui-gaps.md`. Tanja oli suunnitellut UI:n (Script Breakdown, Strips Board, Call Sheet) itsenäisesti Figmassa; käytiin se läpi selaimen kautta ja verrattiin skeemaan ennen tietokannan kytkemistä. Suurin osa täsmäsi jo suoraan (script-revisiot, stripit, sivut kahdeksasosina, real-world-lokaatiot), mutta neljä aukkoa löytyi:

- **Cast-numerointi**: `characters.cast_number` (nullable, osittainen uniikki-indeksi per projekti). UI näyttää joka näkymässä hahmot pysyvällä numerolla ("1 - Hayes"), joka on tuotannon itse asettama (billausjärjestyksen mukaan, ei kohtausjärjestyksen) - täytyy siis tallentaa, ei laskea.
- **Agentin yhteystiedot**: `contacts.agent_name`, `agent_phone`, `agent_email`. Call sheetin cast-taulukossa on oma sarake agentin tiedoille, erillään näyttelijän omista yhteystiedoista.
- **Jaetut call-ajat**: `call_sheet_entries.call_time` korvattu kolmella: `makeup_hair_time`, `on_set_time`, `unit_call_time` - call sheet näyttää jokaiselle henkilölle kolme erillistä aikaa yhden sijaan.
- **Osastokohtaiset call sheet -huomiot**: uusi `call_sheet_department_notes`-taulu (rivi per huomio, ryhmitelty osastolla, järjestettävissä) korvaamaan yhden `call_sheets.general_notes`-tekstikentän. Tanja oli itse pyytänyt Figman AI:lta, että call sheet -osio pitää saada täysin muokattavaksi (add/remove-napit per huomio) - vain rivipohjainen malli tukee sitä.
- Ei skeemamuutosta, mutta huomioitu jatkoa varten: Figma-UI:ssa on myös "Music/Playback"-elementtikategoria, jota parserin avainsanapoiminta ei vielä tunnista - `scene_elements.element_type` on jo vapaata tekstiä joten skeema tukee sitä valmiiksi, kyse on vain `parser_service.py`:n avainsanalistan laajentamisesta myöhemmin.
- Varmistettu: skeema jäsentyy virheettä `pglast`:lla (45 SQL-lausetta, 21 taulua), FK-järjestys tarkistettu koko skeeman läpi.

## Viimeistely valmiiksi demoksi 2026-11-05

Päätös dokumentoitu: `docs/adr/0005-finish-as-parser-demo.md`.

- Poistettu keskeneräiset osat: auth-reitit (501), Google OAuth -rungot, kovakoodattu `GET /scenes`, `config.py`, `dependencies.py`, `.env.example`. Autentikoinnin toteutus säilyy tagissa `auth-groundwork`.
- Korjattu: puhtaalta pöydältä asennettuna 4 testiä kaatui, koska lukitsematon `bcrypt` 5.x ei toimi `passlib` 1.7.4:n kanssa. Riippuvuus poistui auth-koodin mukana.
- Parserin bugikorjaukset (esimerkkikäsikirjoitus paljasti ne):
  - INT/EXT-merkintä poistettiin mistä tahansa otsikon kohdasta, joten "ASEMARAVINTOLA" muuttui muotoon "ASEMARAVOLA". Nyt merkintä poistetaan vain otsikon alusta.
  - Kolmiosaisessa otsikossa ("ANNAN KOTI - KEITTIÖ - AAMU") ajankohdaksi tuli "KEITTIÖ". Nyt ajankohta on aina viimeinen osa ja muut osat ovat paikkaa.
  - Toimintatekstin virkkeen alun substantiivit ("Kolahdus", "Hiljaisuus", "Juna") päätyivät hahmoiksi. Nyt kohtaukset viimeistellään vasta koko käsikirjoituksen luvun jälkeen, ja virkkeen alun sana hyväksytään hahmoksi vain, jos se on jonkin repliikin vetäjä.
  - Avainsanavartalot näkyivät käyttöliittymässä sellaisenaan ("väkijoukk", "hiukse"). Nyt niille näytetään perusmuoto.
- Uusi esimerkkikäsikirjoitus `frontend/public/esimerkit/` (.txt + .fdx) ja testi, joka purkaa molemmat.
- Frontend: suomenkieliset tekstit, esimerkki yhdellä napilla, stripboard-värikoodit, tuotantoelementit ryhmiteltyinä, näppäimistökäytettävät rivit, mobiiliasettelu, fontit paketoitu sovellukseen (ei ulkoisia pyyntöjä). API-osoitteet suhteellisia; kehityksessä Vite välittää ne backendille.
- Julkaisu: `Dockerfile` (frontend buildataan ja FastAPI tarjoilee sen), `render.yaml`, `/health`. CORS rajattu kehityspalvelimen osoitteisiin.
- Varmistettu: 39 testiä läpi, `tsc` ja `eslint` puhtaita, sovellus ajettu tuotantotilassa (FastAPI + buildattu frontend) ja käyty läpi selaimessa työpöytä- ja mobiilileveydellä. Docker-imagea ei voitu rakentaa tässä ympäristössä (Docker Hub estetty).
