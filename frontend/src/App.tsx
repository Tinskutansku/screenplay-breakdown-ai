import { useState } from "react"
import type { Scene } from "./types/scene"

import ScriptInput from "./components/ScriptInput"
import SceneControl from "./components/SceneControl"
import SceneTable from "./components/SceneTable"
import SceneStatistics from "./components/SceneStatistics"

import { filterScenes, getSceneStatistics } from "./utils/sceneHelpers"

// Empty in production: the backend serves this app, so API calls go to the
// same origin. In local dev, Vite proxies these paths to the backend (see
// vite.config.ts). VITE_API_URL can point the UI at a separately hosted API.
const API_BASE = import.meta.env.VITE_API_URL ?? ""

const EXAMPLE_SCRIPT_URL = "/esimerkit/viimeinen-juna.txt"

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    if (data && typeof data.detail === "string" && data.detail.trim()) {
      return data.detail
    }
  } catch {
    // Response body wasn't JSON (or was empty) - fall back to a generic message.
  }

  return fallback
}

function App() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [hasParsed, setHasParsed] = useState<boolean>(false)
  const [expandedSceneIds, setExpandedSceneIds] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [scriptText, setScriptText] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const runParse = async (request: () => Promise<Response>, fallback: string) => {
    try {
      setLoading(true)
      setActionError(null)

      const response = await request()

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, fallback))
      }

      setScenes(await response.json())
      setHasParsed(true)
      setExpandedSceneIds([])
      setSearchTerm("")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : fallback)
    } finally {
      setLoading(false)
    }
  }

  const parseText = (text: string) => {
    if (!text.trim()) {
      setActionError("Liitä käsikirjoitusteksti ennen purkamista.")
      return
    }

    return runParse(
      () =>
        fetch(`${API_BASE}/parse-script`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script_text: text })
        }),
      "Käsikirjoituksen purkaminen epäonnistui."
    )
  }

  const uploadScriptFile = () => {
    if (!selectedFile) {
      setActionError("Valitse ensin .txt- tai .fdx-tiedosto.")
      return
    }

    const formData = new FormData()
    formData.append("file", selectedFile)

    return runParse(
      () => fetch(`${API_BASE}/upload-script`, { method: "POST", body: formData }),
      "Tiedoston lataaminen ja purkaminen epäonnistui."
    )
  }

  const loadExample = async () => {
    try {
      const response = await fetch(EXAMPLE_SCRIPT_URL)
      if (!response.ok) throw new Error()
      const text = await response.text()
      setScriptText(text)
      await parseText(text)
    } catch {
      setActionError("Esimerkkikäsikirjoituksen lataaminen epäonnistui.")
    }
  }

  const toggleSceneDetails = (sceneNumber: string) => {
    setExpandedSceneIds((current) =>
      current.includes(sceneNumber)
        ? current.filter((id) => id !== sceneNumber)
        : [...current, sceneNumber]
    )
  }

  const filteredScenes = filterScenes(scenes, searchTerm)
  const statistics = getSceneStatistics(filteredScenes)

  return (
    <div className="page">
      <header className="masthead">
        <p className="eyebrow">Tuotannon työkalu · demo</p>
        <h1>Screenplay Breakdown</h1>
        <p className="lede">
          Pura käsikirjoitus kohtauksiksi: paikat, ajankohdat, hahmot ja tuotannolle
          olennaiset elementit poimitaan automaattisesti .txt- tai .fdx-tiedostosta.
        </p>
      </header>

      <ScriptInput
        scriptText={scriptText}
        onScriptTextChange={setScriptText}
        onParseScript={() => parseText(scriptText)}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        onUploadFile={uploadScriptFile}
        onLoadExample={loadExample}
        loading={loading}
      />

      {actionError && (
        <p className="error-banner" role="alert">
          {actionError}
        </p>
      )}

      {hasParsed && (
        <section className="results" aria-live="polite">
          <SceneStatistics
            totalScenes={scenes.length}
            visibleScenes={filteredScenes.length}
            uniqueLocationsCount={statistics.uniqueLocationsCount}
            uniqueCharactersCount={statistics.uniqueCharactersCount}
            sortedCharacterAppearances={statistics.sortedCharacterAppearances}
          />

          <SceneControl
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onOpenAll={() => setExpandedSceneIds(filteredScenes.map((scene) => scene.scene_number))}
            onCloseAll={() => setExpandedSceneIds([])}
          />

          <SceneTable
            scenes={filteredScenes}
            expandedSceneIds={expandedSceneIds}
            onToggleScene={toggleSceneDetails}
          />
        </section>
      )}

      <footer className="footer">
        <div className="legend" aria-label="Stripboardin värikoodit">
          <span className="legend-item"><i className="swatch strip-int-day" />INT päivä</span>
          <span className="legend-item"><i className="swatch strip-ext-day" />EXT päivä</span>
          <span className="legend-item"><i className="swatch strip-int-night" />INT yö</span>
          <span className="legend-item"><i className="swatch strip-ext-night" />EXT yö</span>
        </div>
        <p>
          Tanja Lilja ·{" "}
          <a href="https://github.com/Tinskutansku/screenplay-breakdown-ai">Lähdekoodi GitHubissa</a>
        </p>
      </footer>
    </div>
  )
}

export default App
