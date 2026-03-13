import type { Scene } from "../types/scene"

export const renderList = (items: string[]): string => {
  if (!items || items.length === 0) {
    return "—"
  }

  return items.join(", ")
}

export const filterScenes = (scenes: Scene[], searchTerm: string): Scene[] => {
  const normalizedSearchTerm = searchTerm.toLowerCase().trim()

  if (normalizedSearchTerm === "") {
    return scenes
  }

  return scenes.filter((scene) => {
    const sceneText = JSON.stringify(scene).toLowerCase()
    return sceneText.includes(normalizedSearchTerm)
  })
}

export const getSceneStatistics = (scenes: Scene[]) => {
  const uniqueLocations = new Set(
    scenes
      .map((scene) => scene.location.trim())
      .filter((location) => location !== "")
  )

  const uniqueCharacters = new Set(
    scenes.flatMap((scene) => scene.cast_members)
  )

  const characterAppearances: Record<string, number> = {}

  scenes.forEach((scene) => {
    scene.cast_members.forEach((character) => {
      characterAppearances[character] = (characterAppearances[character] || 0) + 1
    })
  })

  const sortedCharacterAppearances = Object.entries(characterAppearances).sort(
    (a, b) => b[1] - a[1]
  )

  return {
    uniqueLocationsCount: uniqueLocations.size,
    uniqueCharactersCount: uniqueCharacters.size,
    sortedCharacterAppearances
  }
}