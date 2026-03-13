import type { Scene } from "../types/scene"
import { renderList } from "../utils/sceneHelpers"

type SceneDetailProps = {
  scene: Scene
}

function SceneDetail({ scene }: SceneDetailProps) {
  return (
    <div style={detailBoxStyle}>
      <p><strong>Background actors:</strong> {renderList(scene.background_actors)}</p>
      <p><strong>Set dressing:</strong> {renderList(scene.set_dressing)}</p>
      <p><strong>Props:</strong> {renderList(scene.props)}</p>
      <p><strong>Sound:</strong> {renderList(scene.sound)}</p>
      <p><strong>Wardrobe:</strong> {renderList(scene.wardrobe)}</p>
      <p><strong>Makeup/Hair:</strong> {renderList(scene.makeup_hair)}</p>
      <p><strong>Vehicles:</strong> {renderList(scene.vehicles)}</p>
      <p><strong>Stunts:</strong> {renderList(scene.stunts)}</p>
      <p><strong>SFX:</strong> {renderList(scene.sfx)}</p>
      <p><strong>VFX:</strong> {renderList(scene.vfx)}</p>
      <p><strong>Notes:</strong> {renderList(scene.notes)}</p>
    </div>
  )
}

const detailBoxStyle = {
  padding: "16px",
  backgroundColor: "#fafafa"
}

export default SceneDetail