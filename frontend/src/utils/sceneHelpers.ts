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
type ListKey = {
  [K in keyof Scene]: Scene[K] extends string[] ? K : never
}[keyof Scene]

// Breakdown categories shown in a scene's detail view, in the order a
// breakdown sheet usually lists them. Cast is already in the table row.
// Props, set dressing and notes stay empty from the rule-based parser (see
// STATUS.md) but are kept here so they show up if they're ever filled.
export const ELEMENT_CATEGORIES: { key: ListKey; label: string }[] = [
  { key: "background_actors", label: "Taustanäyttelijät" },
  { key: "wardrobe", label: "Puvustus" },
  { key: "makeup_hair", label: "Maski" },
  { key: "props", label: "Rekvisiitta" },
  { key: "set_dressing", label: "Lavastus" },
  { key: "vehicles", label: "Ajoneuvot" },
  { key: "stunts", label: "Stuntit" },
  { key: "sound", label: "Ääni" },
  { key: "sfx", label: "SFX" },
  { key: "vfx", label: "VFX" },
  { key: "notes", label: "Huomiot" }
]

const NIGHT_WORDS = ["YÖ", "YO", "ILTA", "NIGHT", "EVENING", "DUSK"]

// Classic stripboard colour coding: white = INT day, yellow = EXT day,
// blue = INT night, green = EXT night.
export const stripClassName = (scene: Scene): string => {
  const time = scene.time_of_day.toUpperCase()
  const isNight = NIGHT_WORDS.some((word) => time.includes(word))
  const isExterior = scene.int_ext.startsWith("EXT") || scene.int_ext === "INT/EXT"
  return `strip-${isExterior ? "ext" : "int"}-${isNight ? "night" : "day"}`
}
