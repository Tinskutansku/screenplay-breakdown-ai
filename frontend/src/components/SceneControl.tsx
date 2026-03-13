import { controlsWrapperStyle, searchInputStyle } from "../styles/sceneStyles"

type SceneControlProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  onOpenAll: () => void
  onCloseAll: () => void
}

function SceneControl({
  searchTerm,
  onSearchChange,
  onRefresh,
  onOpenAll,
  onCloseAll
}: SceneControlProps) {
  return (
    <div style={controlsWrapperStyle}>
      <input
        type="text"
        placeholder="Search scenes..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        style={searchInputStyle}
      />

      <button onClick={onRefresh}>Refresh</button>
      <button onClick={onOpenAll}>Open all</button>
      <button onClick={onCloseAll}>Close all</button>
    </div>
  )
}

export default SceneControl