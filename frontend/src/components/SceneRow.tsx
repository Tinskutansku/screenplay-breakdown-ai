import { Fragment } from "react"
import type { Scene } from "../types/scene"
import { renderList, stripClassName } from "../utils/sceneHelpers"
import SceneDetail from "./SceneDetail"

type SceneRowProps = {
  scene: Scene
  isExpanded: boolean
  onToggle: (sceneNumber: string) => void
}

function SceneRow({ scene, isExpanded, onToggle }: SceneRowProps) {
  const toggle = () => onToggle(scene.scene_number)

  return (
    <Fragment>
      <tr
        className={`scene-row ${stripClassName(scene)} ${isExpanded ? "is-expanded" : ""}`}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            toggle()
          }
        }}
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <td className="scene-number">
          <span className="chevron" aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
          {scene.scene_number}
        </td>
        <td>{scene.int_ext || "—"}</td>
        <td className="location">{scene.location || "—"}</td>
        <td>{scene.time_of_day || "—"}</td>
        <td className="col-description">
          <div className="clamp">{scene.description || "—"}</div>
        </td>
        <td>{renderList(scene.cast_members)}</td>
      </tr>

      {isExpanded && (
        <tr className="detail-row">
          <td colSpan={6}>
            <SceneDetail scene={scene} />
          </td>
        </tr>
      )}
    </Fragment>
  )
}

export default SceneRow
