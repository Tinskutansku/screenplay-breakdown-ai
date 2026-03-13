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
  return (
    <div style={statsBoxStyle}>
      <h3>Scene Statistics</h3>

      <p><strong>Total scenes:</strong> {totalScenes}</p>
      <p><strong>Visible scenes:</strong> {visibleScenes}</p>
      <p><strong>Unique locations:</strong> {uniqueLocationsCount}</p>
      <p><strong>Unique characters:</strong> {uniqueCharactersCount}</p>

      <h4>Character appearances</h4>

      {sortedCharacterAppearances.length === 0 ? (
        <p>—</p>
      ) : (
        <ul style={statsListStyle}>
          {sortedCharacterAppearances.map(([character, count]) => (
            <li key={character}>
              {character}: {count} scene{count !== 1 ? "s" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const statsBoxStyle = {
  marginTop: "30px",
  padding: "16px",
  border: "1px solid #ccc",
  backgroundColor: "#fafafa"
}

const statsListStyle = {
  marginTop: "8px",
  paddingLeft: "20px"
}

export default SceneStatistics