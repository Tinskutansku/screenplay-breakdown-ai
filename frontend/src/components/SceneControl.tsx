type SceneControlProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  onOpenAll: () => void
  onCloseAll: () => void
}

function SceneControl({ searchTerm, onSearchChange, onOpenAll, onCloseAll }: SceneControlProps) {
  return (
    <div className="controls">
      <label htmlFor="scene-search" className="visually-hidden">
        Hae kohtauksista
      </label>
      <input
        id="scene-search"
        type="search"
        placeholder="Hae paikkaa, hahmoa tai elementtiä…"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        className="search-input"
      />
      <button className="btn" onClick={onOpenAll}>Avaa kaikki</button>
      <button className="btn" onClick={onCloseAll}>Sulje kaikki</button>
    </div>
  )
}

export default SceneControl
