import { useEffect, useState } from "react"

type Scene = {
  scene_number: string
  location: string
  time_of_day: string
  int_ext: string
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

  useEffect(() => {
    fetch("http://localhost:8000/scenes")
      .then((res) => res.json())
      .then((data) => setScenes(data))
  }, [])

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Film AI Breakdown</h1>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={cell}>Scene</th>
            <th style={cell}>INT/EXT</th>
            <th style={cell}>Location</th>
            <th style={cell}>Time</th>
            <th style={cell}>Cast</th>
            <th style={cell}>Background actors</th>
            <th style={cell}>Set dressing</th>
            <th style={cell}>Props</th>
            <th style={cell}>Wardrobe</th>
            <th style={cell}>Makeup/Hair</th>
            <th style={cell}>Vehicles</th>
            <th style={cell}>Stunts</th>
            <th style={cell}>SFX</th>
            <th style={cell}>VFX</th>
            <th style={cell}>Notes</th>
          </tr>
        </thead>

        <tbody>
          {scenes.map((scene) => (
            <tr key={scene.scene_number}>
              <td style={cell}>{scene.scene_number}</td>
              <td style={cell}>{scene.int_ext}</td>
              <td style={cell}>{scene.location}</td>
              <td style={cell}>{scene.time_of_day}</td>

              <td style={cell}>{scene.cast_members.join(", ")}</td>
              <td style={cell}>{scene.background_actors.join(", ")}</td>
              <td style={cell}>{scene.set_dressing.join(", ")}</td>
              <td style={cell}>{scene.props.join(", ")}</td>

              <td style={cell}>{scene.wardrobe.join(", ")}</td>
              <td style={cell}>{scene.makeup_hair.join(", ")}</td>

              <td style={cell}>{scene.vehicles.join(", ")}</td>
              <td style={cell}>{scene.stunts.join(", ")}</td>

              <td style={cell}>{scene.sfx.join(", ")}</td>
              <td style={cell}>{scene.vfx.join(", ")}</td>

              <td style={cell}>{scene.notes.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const cell = {
  border: "1px solid #ccc",
  padding: "8px",
  verticalAlign: "top" as const,
}

export default App