type CharacterAppearance = [string, number]

type SceneStatisticsProps = {
  totalScenes: number
  visibleScenes: number
  uniqueLocationsCount: number
  uniqueCharactersCount: number
  sortedCharacterAppearances: CharacterAppearance[]
}

function SceneStatistics({
  totalScenes,
  visibleScenes,
  uniqueLocationsCount,
  uniqueCharactersCount,
  sortedCharacterAppearances
}: SceneStatisticsProps) {
  const filtered = visibleScenes !== totalScenes

  return (
    <div className="stats">
      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-value">{filtered ? `${visibleScenes}/${totalScenes}` : totalScenes}</span>
          <span className="stat-label">Kohtausta</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{uniqueLocationsCount}</span>
          <span className="stat-label">Paikkaa</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{uniqueCharactersCount}</span>
          <span className="stat-label">Hahmoa</span>
        </div>
      </div>

      <div className="card cast-card">
        <h2>Hahmot kohtausmäärän mukaan</h2>
        {sortedCharacterAppearances.length === 0 ? (
          <p className="muted">Hahmoja ei tunnistettu.</p>
        ) : (
          <ol className="cast-list">
            {sortedCharacterAppearances.map(([character, count]) => (
              <li key={character}>
                <span>{character}</span>
                <span className="muted">{count} {count === 1 ? "kohtaus" : "kohtausta"}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

export default SceneStatistics
