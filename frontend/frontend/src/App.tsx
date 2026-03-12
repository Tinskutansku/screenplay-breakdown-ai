import React, { useEffect, useState } from "react"

type Scene = {
  scene_number: string
  location: string
  time_of_day: string
  int_ext: string
  description: string
  cast_members: string[]
  background_actors: string[]
  set_dressing: string[]
  props: string[]
  sound: string[]
  wardrobe: string[]
  makeup_hair: string[]
  vehicles: string[]
  stunts: string[]
  sfx: string[]
  vfx: string[]
  notes: string[]
}

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
    setError("Please choose a .txt file first.")
    return
  }

  try {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", selectedFile)

    const response = await fetch("http://localhost:8000/upload-script", {
      method: "POST",
      body: formData,
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

  const openAllScenes = () => {
    const ids = filteredScenes.map((s) => s.scene_number)
    setExpandedSceneIds(ids)
  }

  const closeAllScenes = () => {
    setExpandedSceneIds([])
  }

  const renderList = (items: string[]) => {
    if (!items || items.length === 0) return "—"
    return items.join(", ")
  }

  const filteredScenes = scenes.filter((scene) => {
    const text = JSON.stringify(scene).toLowerCase()
    return text.includes(searchTerm.toLowerCase())
  })

  const uniqueLocations = new Set(
  scenes
    .map((scene) => scene.location.trim())
    .filter((location) => location !== "")
)

const uniqueCharacters = new Set(
  scenes.flatMap((scene) => scene.cast_members)
)

const characterAppearances: Record<string, number> = {}

scenes.forEach((scene) => {
  scene.cast_members.forEach((character) => {
    characterAppearances[character] = (characterAppearances[character] || 0) + 1
  })
})

const sortedCharacterAppearances = Object.entries(characterAppearances).sort(
  (a, b) => b[1] - a[1]
)

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

      <div style={{ marginBottom: 30 }}>
        <h3>Paste screenplay text</h3>

        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          rows={10}
          style={{ width: "100%", marginBottom: 10 }}
          placeholder="Paste screenplay here..."
        />

        <button onClick={parseScript}>
          Parse screenplay
        </button>
<div style={{ marginTop: 20 }}>
  <h3>Or upload a screenplay file (.txt or .fdx)</h3>

  <input
    type="file"
    accept=".txt, .fdx"
    onChange={(event) => {
      const file = event.target.files?.[0] || null
      setSelectedFile(file)
    }}
  />

  {selectedFile && (
  <p>Selected file: {selectedFile.name}</p>
) }

  <div style={{ marginTop: 10 }}>
    <button onClick={uploadScriptFile}>
      Upload file
    </button>
  </div>
</div>

      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search scenes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <button onClick={fetchScenes}>Refresh</button>
        <button onClick={openAllScenes}>Open all</button>
        <button onClick={closeAllScenes}>Close all</button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cell}>Scene</th>
            <th style={cell}>INT/EXT</th>
            <th style={cell}>Location</th>
            <th style={cell}>Time</th>
            <th style={cell}>Description</th>
            <th style={cell}>Cast</th>
          </tr>
        </thead>

        <tbody>
          {filteredScenes.map((scene) => {
            const isExpanded = expandedSceneIds.includes(scene.scene_number)

            return (
              <React.Fragment key={scene.scene_number}>
                <tr
                  onClick={() => toggleSceneDetails(scene.scene_number)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isExpanded ? "#f5f5f5" : "white"
                  }}
                >
                  <td style={cell}>
                    {isExpanded ? "▼" : "▶"} {scene.scene_number}
                  </td>
                  <td style={cell}>{scene.int_ext}</td>
                  <td style={cell}>{scene.location}</td>
                  <td style={cell}>{scene.time_of_day}</td>
                  <td style={cell}>{scene.description}</td>
                  <td style={cell}>{renderList(scene.cast_members)}</td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={6} style={detailCell}>
                      <div style={detailBox}>
                        <p><strong>Background actors:</strong> {renderList(scene.background_actors)}</p>
                        <p><strong>Set dressing:</strong> {renderList(scene.set_dressing)}</p>
                        <p><strong>Props:</strong> {renderList(scene.props)}</p>
                        <p><strong>Wardrobe:</strong> {renderList(scene.wardrobe)}</p>
                        <p><strong>Makeup/Hair:</strong> {renderList(scene.makeup_hair)}</p>
                        <p><strong>Vehicles:</strong> {renderList(scene.vehicles)}</p>
                        <p><strong>Stunts:</strong> {renderList(scene.stunts)}</p>
                        <p><strong>SFX:</strong> {renderList(scene.sfx)}</p>
                        <p><strong>VFX:</strong> {renderList(scene.vfx)}</p>
                        <p><strong>Notes:</strong> {renderList(scene.notes)}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>

    <div style={statsBoxStyle}>
  <h3>Scene Statistics</h3>

  <p><strong>Total scenes:</strong> {scenes.length}</p>
  <p><strong>Visible scenes:</strong> {filteredScenes.length}</p>
  <p><strong>Unique locations:</strong> {uniqueLocations.size}</p>
  <p><strong>Unique characters:</strong> {uniqueCharacters.size}</p>

  <h4>Character appearances</h4>

  {sortedCharacterAppearances.length === 0 ? (
    <p>—</p>
  ) : (
    <ul style={statsListStyle}>
      {sortedCharacterAppearances.map(([character, count]) => (
        <li key={character}>
          {character}: {count} scene{count !== 1 ? "s" : ""}
        </li>
      ))}
    </ul>
  )}
</div>

    </div>
  )
}

const pageStyle = {
  padding: "40px",
  fontFamily: "Arial"
}

const tableStyle = {
  borderCollapse: "collapse" as const,
  width: "100%"
}

const cell = {
  border: "1px solid #ccc",
  padding: "8px"
}

const detailCell = {
  border: "1px solid #ccc",
  padding: "0"
}

const detailBox = {
  padding: "16px",
  backgroundColor: "#fafafa"
}

const statsBoxStyle = {
  marginTop: "30px",
  padding: "16px",
  border: "1px solid #ccc",
  backgroundColor: "#fafafa",
}

const statsListStyle = {
  marginTop: "8px",
  paddingLeft: "20px",
}

export default App