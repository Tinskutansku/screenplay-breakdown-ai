import type { Scene } from "../types/scene"
import SceneRow from "./SceneRow"

type SceneTableProps = {
  scenes: Scene[]
  expandedSceneIds: string[]
  onToggleScene: (sceneNumber: string) => void
}

function SceneTable({ scenes, expandedSceneIds, onToggleScene }: SceneTableProps) {
  return (
    <div className="table-wrap">
      <table className="scene-table">
        <thead>
          <tr>
            <th scope="col">Nro</th>
            <th scope="col">INT/EXT</th>
            <th scope="col">Paikka</th>
            <th scope="col">Aika</th>
            <th scope="col" className="col-description">Kuvaus</th>
            <th scope="col">Hahmot</th>
          </tr>
        </thead>

        <tbody>
          {scenes.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">
                Ei kohtauksia. Tarkista, että kohtausotsikot alkavat INT- tai EXT-merkinnällä.
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
    </div>
  )
}

export default SceneTable
