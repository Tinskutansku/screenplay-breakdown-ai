from typing import Dict, List

from models.scene import Scene


def calculate_scene_statistics(scenes: List[Scene]) -> dict:
    unique_locations = set()
    unique_characters = set()
    character_appearances: Dict[str, int] = {}

    for scene in scenes:
        if scene.location.strip():
            unique_locations.add(scene.location.strip())

        for character in scene.cast_members:
            unique_characters.add(character)
            character_appearances[character] = character_appearances.get(character, 0) + 1

    sorted_character_appearances = dict(
        sorted(character_appearances.items(), key=lambda item: item[1], reverse=True)
    )

    return {
        "total_scenes": len(scenes),
        "unique_locations": len(unique_locations),
        "unique_characters": len(unique_characters),
        "character_appearances": sorted_character_appearances
    }