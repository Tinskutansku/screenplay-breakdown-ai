import { useEffect, useState } from "react"
import type { Scene } from "./types/scene"

import ScriptInput from "./components/ScriptInput"
import SceneControl from "./components/SceneControl"
import SceneTable from "./components/SceneTable"
import SceneStatistics from "./components/SceneStatistics"

import { filterScenes, getSceneStatistics } from "./utils/sceneHelpers"
import { pageStyle, actionErrorStyle } from "./styles/sceneStyles"

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
  const [expandedSceneIds, setExpandedSceneIds] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [scriptText, setScriptText] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchScenes = async () => {
    try {
      setLoading(true)
      setFetchError(null)

      const response = await fetch("http://localhost:8000/scenes")

      if (!response.ok) {
        const message = await extractErrorMessage(response, "Kohtausten hakeminen epäonnistui.")
        throw new Error(message)
      }

      const data = await response.json()
      setScenes(data)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Kohtausten hakeminen epäonnistui.")
    } finally {
      setLoading(false)
    }
  }

  const parseScript = async () => {
    const trimmedScript = scriptText.trim()

    if (!trimmedScript) {
      setActionError("Liitä käsikirjoitusteksti ennen jäsentämistä.")
      return
    }

    try {
      setLoading(true)
      setActionError(null)

      const response = await fetch("http://localhost:8000/parse-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          script_text: scriptText
        })
      })

      if (!response.ok) {
        const message = await extractErrorMessage(response, "Käsikirjoituksen jäsentäminen epäonnistui.")
        throw new Error(message)
      }

      const parsedScenes = await response.json()

      setScenes(parsedScenes)
      setExpandedSceneIds([])
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Käsikirjoituksen jäsentäminen epäonnistui.")
    } finally {
      setLoading(false)
    }
  }

  const uploadScriptFile = async () => {
    if (!selectedFile) {
      setActionError("Valitse ensin .txt- tai .fdx-tiedosto.")
      return
    }

    try {
      setLoading(true)
      setActionError(null)

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("http://localhost:8000/upload-script", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const message = await extractErrorMessage(response, "Tiedoston lataaminen ja jäsentäminen epäonnistui.")
        throw new Error(message)
      }

      const parsedScenes = await response.json()

      setScenes(parsedScenes)
      setExpandedSceneIds([])
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Tiedoston lataaminen ja jäsentäminen epäonnistui.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScenes()
  }, [])

  const toggleSceneDetails = (sceneNumber: string) => {
    setExpandedSceneIds((current) => {
      if (current.includes(sceneNumber)) {
        return current.filter((id) => id !== sceneNumber)
      }

      return [...current, sceneNumber]
    })
  }

  const filteredScenes = filterScenes(scenes, searchTerm)

  const openAllScenes = () => {
    const visibleSceneIds = filteredScenes.map((scene) => scene.scene_number)
    setExpandedSceneIds(visibleSceneIds)
  }

  const closeAllScenes = () => {
    setExpandedSceneIds([])
  }

  const statistics = getSceneStatistics(filteredScenes)

  if (loading) {
    return (
      <div style={pageStyle}>
        <h1>Film AI Breakdown</h1>
        <p>Loading...</p>
      </div>
    )
  }

  // A failed initial /scenes load blocks the whole page since there's
  // nothing useful to show yet. Parse/upload failures (actionError) are
  // shown inline instead, further down, so the user doesn't lose their
  // pasted text or selected file.
  if (fetchError) {
    return (
      <div style={pageStyle}>
        <h1>Film AI Breakdown</h1>
        <p style={{ color: "red" }}>{fetchError}</p>
        <button onClick={fetchScenes}>Retry</button>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <h1>Film AI Breakdown</h1>

      <ScriptInput
        scriptText={scriptText}
        onScriptTextChange={setScriptText}
        onParseScript={parseScript}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        onUploadFile={uploadScriptFile}
      />

      {actionError && <p style={actionErrorStyle}>{actionError}</p>}

      <SceneControl
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchScenes}
        onOpenAll={openAllScenes}
        onCloseAll={closeAllScenes}
      />

      <SceneTable
        scenes={filteredScenes}
        expandedSceneIds={expandedSceneIds}
        onToggleScene={toggleSceneDetails}
      />

      <SceneStatistics
        totalScenes={scenes.length}
        visibleScenes={filteredScenes.length}
        uniqueLocationsCount={statistics.uniqueLocationsCount}
        uniqueCharactersCount={statistics.uniqueCharactersCount}
        sortedCharacterAppearances={statistics.sortedCharacterAppearances}
      />
    </div>
  )
}

export default App
