import type { Scene } from "../types/scene"
import { ELEMENT_CATEGORIES } from "../utils/sceneHelpers"

type SceneDetailProps = {
  scene: Scene
}

function SceneDetail({ scene }: SceneDetailProps) {
  const found = ELEMENT_CATEGORIES.filter(({ key }) => scene[key].length > 0)

  return (
    <div className="detail-box">
      <p className="detail-description">{scene.description || "Ei toimintatekstiä."}</p>

      {found.length === 0 ? (
        <p className="muted">Tästä kohtauksesta ei tunnistettu tuotantoelementtejä.</p>
      ) : (
        <dl className="element-grid">
          {found.map(({ key, label }) => (
            <div key={key} className="element-group">
              <dt>{label}</dt>
              <dd>
                {scene[key].map((item) => (
                  <span key={item} className="chip">{item}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export default SceneDetail
