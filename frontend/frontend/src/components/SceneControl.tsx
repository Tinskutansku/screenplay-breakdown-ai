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

const controlsWrapperStyle = {
  marginBottom: "20px",
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  alignItems: "center"
}

const searchInputStyle = {
  minWidth: "240px",
  padding: "8px"
}

export default SceneControl