import { useEffect, useState } from "react"
import type { Scene } from "./types/scene"

import ScriptInput from "./components/ScriptInput"
import SceneControl from "./components/SceneControl"
import SceneTable from "./components/SceneTable"
import SceneStatistics from "./components/SceneStatistics"

import { filterScenes, getSceneStatistics } from "./utils/sceneHelpers"
import { pageStyle } from "./styles/sceneStyles"

function App() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [expandedSceneIds, setExpandedSceneIds] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [scriptText, setScriptText] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchScenes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("http://localhost:8000/scenes")

      if (!response.ok) {
        throw new Error("Failed to fetch scenes")
      }

      const data = await response.json()
      setScenes(data)
    } catch {
      setError("Failed to load scenes")
    } finally {
      setLoading(false)
    }
  }

  const parseScript = async () => {
    try {
      setLoading(true)
      setError(null)

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
        throw new Error("Parsing failed")
      }

      const parsedScenes = await response.json()

      setScenes(parsedScenes)
      setExpandedSceneIds([])
    } catch {
      setError("Failed to parse screenplay")
    } finally {
      setLoading(false)
    }
  }

  const uploadScriptFile = async () => {
    if (!selectedFile) {
      setError("Please choose a .txt or .fdx file first.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("http://localhost:8000/upload-script", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("File upload failed")
      }

      const parsedScenes = await response.json()

      setScenes(parsedScenes)
      setExpandedSceneIds([])
    } catch {
      setError("Failed to upload and parse file.")
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

  if (error) {
    return (
      <div style={pageStyle}>
        <h1>Film AI Breakdown</h1>
        <p style={{ color: "red" }}>{error}</p>
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