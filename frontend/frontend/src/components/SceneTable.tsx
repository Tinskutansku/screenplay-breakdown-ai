import type { Scene } from "../types/scene"
import SceneRow from "./SceneRow"

type SceneTableProps = {
  scenes: Scene[]
  expandedSceneIds: string[]
  onToggleScene: (sceneNumber: string) => void
}

function SceneTable({
  scenes,
  expandedSceneIds,
  onToggleScene
}: SceneTableProps) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={cellStyle}>Scene</th>
          <th style={cellStyle}>INT/EXT</th>
          <th style={cellStyle}>Location</th>
          <th style={cellStyle}>Time</th>
          <th style={cellStyle}>Description</th>
          <th style={cellStyle}>Cast</th>
        </tr>
      </thead>

      <tbody>
        {scenes.length === 0 ? (
          <tr>
            <td colSpan={6} style={emptyCellStyle}>
              No scenes found.
            </td>
          </tr>
        ) : (
          scenes.map((scene) => (
            <SceneRow
              key={scene.scene_number}
              scene={scene}
              isExpanded={expandedSceneIds.includes(scene.scene_number)}
              onToggle={onToggleScene}
            />
          ))
        )}
      </tbody>
    </table>
  )
}

const tableStyle = {
  borderCollapse: "collapse" as const,
  width: "100%"
}

const cellStyle = {
  border: "1px solid #ccc",
  padding: "8px"
}

const emptyCellStyle = {
  border: "1px solid #ccc",
  padding: "16px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa"
}

export default SceneTable