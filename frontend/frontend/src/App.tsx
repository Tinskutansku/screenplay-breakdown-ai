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

  const fetchScenes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("http://localhost:8000/scenes")

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setScenes(data)
    } catch (err) {
      console.error("Error fetching scenes:", err)
      setError("Failed to load scenes. Please check that the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScenes()
  }, [])

  const toggleSceneDetails = (sceneNumber: string) => {
    setExpandedSceneIds((currentExpandedSceneIds) => {
      const isAlreadyExpanded = currentExpandedSceneIds.includes(sceneNumber)

      if (isAlreadyExpanded) {
        return currentExpandedSceneIds.filter((id) => id !== sceneNumber)
      }

      return [...currentExpandedSceneIds, sceneNumber]
    })
  }

  const openAllScenes = () => {
    const visibleSceneIds = filteredScenes.map((scene) => scene.scene_number)
    setExpandedSceneIds((currentExpandedSceneIds) => {
      const mergedIds = new Set([...currentExpandedSceneIds, ...visibleSceneIds])
      return Array.from(mergedIds)
    })
  }

  const closeAllScenes = () => {
    const visibleSceneIds = filteredScenes.map((scene) => scene.scene_number)
    setExpandedSceneIds((currentExpandedSceneIds) =>
      currentExpandedSceneIds.filter((id) => !visibleSceneIds.includes(id))
    )
  }

  const renderList = (items: string[]) => {
    if (!items || items.length === 0) {
      return "—"
    }

    return items.join(", ")
  }

  const sceneMatchesSearch = (scene: Scene, normalizedSearchTerm: string) => {
    if (normalizedSearchTerm === "") {
      return true
    }

    const searchableValues = [
      scene.scene_number,
      scene.int_ext,
      scene.location,
      scene.time_of_day,
      scene.description,
      ...scene.cast_members,
      ...scene.background_actors,
      ...scene.set_dressing,
      ...scene.props,
      ...scene.sound,
      ...scene.wardrobe,
      ...scene.makeup_hair,
      ...scene.vehicles,
      ...scene.stunts,
      ...scene.sfx,
      ...scene.vfx,
      ...scene.notes,
    ]

    return searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedSearchTerm)
    )
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredScenes = scenes.filter((scene) =>
    sceneMatchesSearch(scene, normalizedSearchTerm)
  )

  if (loading) {
    return (
      <div style={pageStyle}>
        <h1>Film AI Breakdown</h1>
        <p>Loading scenes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <h1>Film AI Breakdown</h1>

        <div style={topBarStyle}>
          <button style={buttonStyle} onClick={fetchScenes}>
            Retry
          </button>
        </div>

        <p style={errorTextStyle}>{error}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <h1>Film AI Breakdown</h1>

      <div style={topBarStyle}>
        <input
          type="text"
          placeholder="Search scenes..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={searchInputStyle}
        />

        <button style={buttonStyle} onClick={fetchScenes}>
          Refresh
        </button>

        <button style={buttonStyle} onClick={openAllScenes}>
          Open all
        </button>

        <button style={buttonStyle} onClick={closeAllScenes}>
          Close all
        </button>
      </div>

      <p style={resultCountStyle}>
        Showing {filteredScenes.length} of {scenes.length} scenes
      </p>

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
                    backgroundColor: isExpanded ? "#f5f5f5" : "white",
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
                    <td style={detailCell} colSpan={6}>
                      <div style={detailBox}>
                        <h3 style={{ marginTop: 0 }}>
                          Scene {scene.scene_number} Details
                        </h3>

                        <p>
                          <strong>Background actors:</strong>{" "}
                          {renderList(scene.background_actors)}
                        </p>
                        <p>
                          <strong>Set dressing:</strong>{" "}
                          {renderList(scene.set_dressing)}
                        </p>
                        <p>
                          <strong>Props:</strong> {renderList(scene.props)}
                        </p>
                        <p>
                          <strong>Wardrobe:</strong>{" "}
                          {renderList(scene.wardrobe)}
                        </p>
                        <p>
                          <strong>Makeup/Hair:</strong>{" "}
                          {renderList(scene.makeup_hair)}
                        </p>
                        <p>
                          <strong>Vehicles:</strong>{" "}
                          {renderList(scene.vehicles)}
                        </p>
                        <p>
                          <strong>Stunts:</strong> {renderList(scene.stunts)}
                        </p>
                        <p>
                          <strong>SFX:</strong> {renderList(scene.sfx)}
                        </p>
                        <p>
                          <strong>VFX:</strong> {renderList(scene.vfx)}
                        </p>
                        <p>
                          <strong>Notes:</strong> {renderList(scene.notes)}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const pageStyle = {
  padding: "40px",
  fontFamily: "Arial, sans-serif",
}

const topBarStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap" as const,
}

const buttonStyle = {
  padding: "10px 16px",
  border: "1px solid #ccc",
  backgroundColor: "#f5f5f5",
  cursor: "pointer",
  borderRadius: "6px",
  fontSize: "14px",
}

const searchInputStyle = {
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
  minWidth: "240px",
}

const resultCountStyle = {
  marginBottom: "12px",
}

const tableStyle = {
  borderCollapse: "collapse" as const,
  width: "100%",
}

const cell = {
  border: "1px solid #ccc",
  padding: "8px",
  verticalAlign: "top" as const,
  textAlign: "left" as const,
}

const detailCell = {
  border: "1px solid #ccc",
  padding: "0",
}

const detailBox = {
  padding: "16px",
  backgroundColor: "#fafafa",
}

const errorTextStyle = {
  color: "#b00020",
  fontWeight: "bold" as const,
}

export default App