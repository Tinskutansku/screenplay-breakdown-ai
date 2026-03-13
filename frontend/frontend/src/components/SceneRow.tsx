import React from "react"
import type { Scene } from "../types/scene"
import { renderList } from "../utils/sceneHelpers"
import SceneDetail from "./SceneDetail"

type SceneRowProps = {
  scene: Scene
  isExpanded: boolean
  onToggle: (sceneNumber: string) => void
}

function SceneRow({ scene, isExpanded, onToggle }: SceneRowProps) {
  return (
    <React.Fragment>
      <tr
        onClick={() => onToggle(scene.scene_number)}
        style={{
          cursor: "pointer",
          backgroundColor: isExpanded ? "#f5f5f5" : "white"
        }}
      >
        <td style={cellStyle}>
          {isExpanded ? "▼" : "▶"} {scene.scene_number}
        </td>
        <td style={cellStyle}>{scene.int_ext}</td>
        <td style={cellStyle}>{scene.location}</td>
        <td style={cellStyle}>{scene.time_of_day}</td>
        <td style={cellStyle}>{scene.description}</td>
        <td style={cellStyle}>{renderList(scene.cast_members)}</td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} style={detailCellStyle}>
            <SceneDetail scene={scene} />
          </td>
        </tr>
      )}
    </React.Fragment>
  )
}

const cellStyle = {
  border: "1px solid #ccc",
  padding: "8px"
}

const detailCellStyle = {
  border: "1px solid #ccc",
  padding: "0"
}

export default SceneRow