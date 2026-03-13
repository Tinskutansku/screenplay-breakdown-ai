import re
import xml.etree.ElementTree as ET
from typing import List

from models.scene import Scene


def create_empty_scene(scene_number: int, int_ext: str, location: str, time_of_day: str) -> Scene:
    return Scene(
        scene_number=str(scene_number),
        int_ext=int_ext,
        location=location,
        time_of_day=time_of_day,
        description="",
        cast_members=[],
        background_actors=[],
        set_dressing=[],
        props=[],
        sound=[],
        wardrobe=[],
        makeup_hair=[],
        vehicles=[],
        stunts=[],
        sfx=[],
        vfx=[],
        notes=[]
    )


def extract_character_names_from_text(text: str) -> List[str]:
    ignored_words = {
        "The", "A", "An", "In", "On", "At", "He", "She", "They", "It",
        "His", "Her", "Their", "Morning", "Night", "Day", "Evening",
        "Interior", "Exterior", "Suddenly", "Meanwhile", "Later",
        "Then", "Outside", "Inside"
    }

    matches = re.findall(
        r"\b[A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)?\b",
        text
    )

    unique_names = []
    seen = set()

    for match in matches:
        if match in ignored_words:
            continue

        if match not in seen:
            seen.add(match)
            unique_names.append(match)

    return unique_names


def finalize_scene(scene: Scene) -> Scene:
    scene.description = scene.description.strip()
    scene.cast_members = extract_character_names_from_text(scene.description)
    return scene


def parse_screenplay(text: str) -> List[Scene]:
    lines = text.split("\n")

    scenes: List[Scene] = []
    current_scene: Scene | None = None
    scene_counter = 1

    scene_heading_pattern = re.compile(
        r"^(INT\.?|EXT\.?|INT/EXT\.?|INT\.\/EXT\.?)",
        re.IGNORECASE
    )

    for raw_line in lines:
        line = raw_line.strip()

        if not line:
            continue

        line = line.replace("–", "-").replace("—", "-")

        if scene_heading_pattern.match(line):
            if current_scene:
                scenes.append(finalize_scene(current_scene))

            heading = line.replace(".", "")
            parts = heading.split(" - ")

            location_part = parts[0].strip().upper()
            time_part = parts[1].strip() if len(parts) > 1 else ""

            if "INT/EXT" in location_part:
                int_ext = "INT/EXT"
                location = location_part.replace("INT/EXT", "").strip()
            elif "INT" in location_part:
                int_ext = "INT"
                location = location_part.replace("INT", "").strip()
            elif "EXT" in location_part:
                int_ext = "EXT"
                location = location_part.replace("EXT", "").strip()
            else:
                int_ext = ""
                location = location_part.strip()

            current_scene = create_empty_scene(
                scene_number=scene_counter,
                int_ext=int_ext,
                location=location,
                time_of_day=time_part
            )

            scene_counter += 1

        else:
            if current_scene:
                if current_scene.description:
                    current_scene.description += " "
                current_scene.description += line

    if current_scene:
        scenes.append(finalize_scene(current_scene))

    return scenes


def parse_fdx(content: bytes) -> List[Scene]:
    root = ET.fromstring(content)

    scenes: List[Scene] = []
    current_scene: Scene | None = None
    scene_counter = 1

    paragraphs = root.findall(".//Paragraph")

    for paragraph in paragraphs:
        paragraph_type = paragraph.attrib.get("Type", "")
        text_parts = []

        for text_node in paragraph.findall(".//Text"):
            if text_node.text:
                text_parts.append(text_node.text)

        paragraph_text = "".join(text_parts).strip()

        if not paragraph_text:
            continue

        if paragraph_type == "Scene Heading":
            if current_scene:
                scenes.append(finalize_scene(current_scene))

            normalized_heading = (
                paragraph_text.replace("–", "-")
                .replace("—", "-")
                .replace(".", "")
            )

            parts = normalized_heading.split(" - ")

            location_part = parts[0].strip().upper()
            time_part = parts[1].strip() if len(parts) > 1 else ""

            if "INT/EXT" in location_part:
                int_ext = "INT/EXT"
                location = location_part.replace("INT/EXT", "").strip()
            elif "INT" in location_part:
                int_ext = "INT"
                location = location_part.replace("INT", "").strip()
            elif "EXT" in location_part:
                int_ext = "EXT"
                location = location_part.replace("EXT", "").strip()
            else:
                int_ext = ""
                location = location_part.strip()

            current_scene = create_empty_scene(
                scene_number=scene_counter,
                int_ext=int_ext,
                location=location,
                time_of_day=time_part
            )

            scene_counter += 1

        elif paragraph_type == "Action":
            if current_scene:
                if current_scene.description:
                    current_scene.description += " "
                current_scene.description += paragraph_text

    if current_scene:
        scenes.append(finalize_scene(current_scene))

    return scenes