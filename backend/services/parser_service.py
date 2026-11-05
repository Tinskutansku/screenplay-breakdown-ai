import re
import xml.etree.ElementTree as ET
from typing import List

from models.scene import Scene


# --- Character name handling -------------------------------------------------

IGNORED_WORDS = {
    # English filler words (screenplay text isn't always Finnish)
    "The", "A", "An", "In", "On", "At", "He", "She", "They", "It",
    "His", "Her", "Their", "Morning", "Night", "Day", "Evening",
    "Interior", "Exterior", "Suddenly", "Meanwhile", "Later",
    "Then", "Outside", "Inside",

    # Finnish pronouns, conjunctions and common adverbs - these get
    # capitalized whenever they open a sentence, which is extremely common
    # in Finnish action lines, so without this list nearly every scene would
    # pick up several bogus "characters" like "Sitten" or "Han".
    "Hän", "Se", "Ne", "Tämä", "Tuo", "Nämä", "Nuo", "Minä", "Sinä", "Me", "Te", "He",
    "Joku", "Jokin", "Kukaan", "Mikään", "Kaikki", "Moni", "Muutama",
    "Sitten", "Silloin", "Nyt", "Yhtäkkiä", "Äkkiä", "Vihdoin", "Lopulta", "Taas", "Uudestaan",
    "Siellä", "Täällä", "Tuolla", "Ulkona", "Sisällä", "Ylhäällä", "Alhaalla",
    "Taustalla", "Edessä", "Vieressä", "Keskellä", "Kaukana", "Lähellä",
    "Mutta", "Ja", "Tai", "Koska", "Kun", "Jos", "Vaikka", "Sillä",
    "Ei", "Kyllä", "Ehkä",

    # Common generic nouns that otherwise show up as false positives when
    # they happen to start a sentence (e.g. "Puhelin soi." -> "phone rings")
    "Ovi", "Ikkuna", "Puhelin", "Pöytä", "Tuoli", "Sänky", "Kello", "Auto",
}

# Lines that look like ALL-CAPS character cues but are actually scene
# transitions. Kept conservative and case-insensitive.
TRANSITION_CUES = {
    "CUT TO", "FADE IN", "FADE OUT", "FADE TO BLACK", "DISSOLVE TO",
    "SMASH CUT TO", "MATCH CUT TO", "TIME CUT", "INTERCUT", "TITLE CARD",
    "END OF SCENE", "CONTINUOUS", "BACK TO SCENE",
    "LEIKKAUS", "HAIVYTYS", "MUSTAAN", "JATKUU",
}


_SENTENCE_BOUNDARY_CHARS = ".!?:;)\"'”-"


def _is_sentence_initial(text: str, start: int) -> bool:
    """True if the word starting at `start` opens a sentence (or the whole
    text). Finnish capitalizes every sentence-initial word, so a capital
    letter there says nothing about whether the word is a name."""

    preceding = text[:start].rstrip()
    return not preceding or preceding[-1] in _SENTENCE_BOUNDARY_CHARS


def extract_character_names_from_text(
    text: str, known_names: set[str] | None = None
) -> List[str]:
    """Fallback heuristic: pick up Title-Case words from prose. Only catches
    names mentioned in action/description text, not names that only ever
    appear as a dialogue cue (those are handled separately via
    combine_cast_members / character_cues).

    When `known_names` (every dialogue cue in the whole script) is given, a
    capitalized word at the start of a sentence only counts if it is one of
    those known names. Mid-sentence capitals are still accepted as-is, since
    there they are almost always proper nouns. This removes the most common
    false positive in Finnish action lines ("Kolahdus kuuluu." -> "Kolahdus"
    as a character), at the cost of missing a non-speaking character who is
    only ever mentioned at the start of a sentence."""

    pattern = re.compile(r"\b[A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)?\b")

    unique_names = []
    seen = set()

    for match in pattern.finditer(text):
        name = match.group(0)

        if name in IGNORED_WORDS or name in seen:
            continue

        if (
            known_names is not None
            and name not in known_names
            and _is_sentence_initial(text, match.start())
        ):
            continue

        seen.add(name)
        unique_names.append(name)

    return unique_names


def clean_character_cue(raw_cue: str) -> str:
    """Turn a raw dialogue cue like "ANNA (V.O.)" or "JUHO (CONT'D)" into a
    normalized display name, e.g. "Anna" / "Juho"."""

    name = re.sub(r"\([^)]*\)", "", raw_cue)
    name = name.strip().strip(":").strip()
    name = re.sub(r"\s+", " ", name)

    return " ".join(word.capitalize() for word in name.split(" ") if word)


def is_character_cue_line(line: str) -> bool:
    """Heuristic for plain-text screenplays: a standalone ALL-CAPS line
    (no lowercase letters at all) that isn't a scene transition is almost
    always a character cue introducing a line of dialogue."""

    if not line or len(line) > 40:
        return False

    if not re.match(r"^[A-ZÅÄÖ0-9][A-ZÅÄÖ0-9\s.,()'\-]*$", line):
        return False

    if not re.search(r"[A-ZÅÄÖ]", line):
        return False

    bare = re.sub(r"\([^)]*\)", "", line).strip().rstrip(":").strip()

    if bare in TRANSITION_CUES:
        return False

    return True


def combine_cast_members(
    character_cues: List[str], description: str, known_names: set[str] | None = None
) -> List[str]:
    """Merge reliably-identified dialogue cues with the weaker prose-based
    heuristic, cues first since they're the more trustworthy signal."""

    heuristic_names = extract_character_names_from_text(description, known_names)

    combined = []
    seen = set()

    for name in [*character_cues, *heuristic_names]:
        if name and name not in seen:
            seen.add(name)
            combined.append(name)

    return combined


# --- Lightweight scene-element extraction ------------------------------------
#
# Best-effort keyword matching over the scene's action/description text.
# Coverage is intentionally limited: props, set dressing and general notes
# don't have a reliable textual signal to key off without real NLP/AI
# extraction, so those are left for manual entry or a future AI pass. Sound,
# vehicles, stunts, wardrobe, makeup/hair and background actors have a small
# but usable keyword vocabulary (English + Finnish), so those get a best
# guess.

SOUND_KEYWORDS = [
    "bang", "crash", "thud", "knock", "ring", "scream", "gunshot",
    "explosion", "siren", "honk", "slam", "beep",
    "pamaus", "paukku", "kolahdus", "huuto", "soi", "räjähdys", "koputus",
]

VEHICLE_KEYWORDS = [
    "car", "van", "truck", "motorcycle", "bicycle", "bus", "train", "plane",
    "boat", "helicopter", "taxi",
    "auto", "pakettiauto", "kuorma-auto", "moottoripyör", "polkupyör", "pyöräl",
    "bussi", "juna", "lentokone", "vene", "helikopter", "taksi",
]

# Kept intentionally narrow: everyday verbs like "jump" or "fall" are far
# too common in ordinary action lines to reliably signal an actual stunt,
# so only fairly specific stunt-related words are included here.
STUNT_KEYWORDS = [
    "stunt", "chase", "fight",
    "kaskadöör", "stuntt", "takaa-ajo", "tappel", "taistel",
]

BACKGROUND_ACTOR_KEYWORDS = [
    "extra", "ekstra", "crowd", "bystander", "passerby", "audience",
    "taustanäyttelij", "väkijoukk", "ohikulkij", "yleisö",
]

WARDROBE_KEYWORDS = [
    "suit", "dress", "coat", "uniform", "skirt",
    "puku", "mekko", "takki", "univormu", "hame", "aamutakki",
]

MAKEUP_HAIR_KEYWORDS = [
    "makeup", "wig",
    "meikki", "hiukse", "parta", "peruukk",
]

SFX_VFX_PATTERN = re.compile(
    r"\(?\s*(SFX|VFX)\s*[:\-]?\s*([^)\n]*)\)?",
    re.IGNORECASE
)


# Several Finnish keywords are deliberately stems so that prefix matching
# catches every inflected form ("väkijoukk" -> "väkijoukko", "väkijoukossa").
# Stems are fine for matching but look like typos in the UI, so each one
# maps to the base form shown to the user.
KEYWORD_DISPLAY_FORMS = {
    "moottoripyör": "moottoripyörä",
    "polkupyör": "polkupyörä",
    "pyöräl": "polkupyörä",
    "helikopter": "helikopteri",
    "kaskadöör": "kaskadööri",
    "stuntt": "stuntti",
    "tappel": "tappelu",
    "taistel": "taistelu",
    "taustanäyttelij": "taustanäyttelijät",
    "väkijoukk": "väkijoukko",
    "ohikulkij": "ohikulkijat",
    "hiukse": "hiukset",
    "peruukk": "peruukki",
}


def _find_keyword_matches(text: str, keywords: List[str]) -> List[str]:
    """Match each keyword as a word *prefix* (word boundary before it, no
    boundary required after). This still catches Finnish inflected forms,
    since suffixes attach to the end of a stem (e.g. "auto" -> "autolla"),
    but avoids false hits where a short keyword happens to land at the end
    of an unrelated Finnish word - e.g. "van" inside "pakenevan" (genitive
    of the participle "pakeneva"), which plain substring matching flagged
    as a vehicle."""

    lowered = text.lower()
    found = []

    for keyword in keywords:
        pattern = r"\b" + re.escape(keyword)
        label = KEYWORD_DISPLAY_FORMS.get(keyword, keyword)
        if label not in found and re.search(pattern, lowered):
            found.append(label)

    return found


def extract_scene_elements(description: str) -> dict:
    """Best-effort keyword extraction for the Scene fields the parser
    otherwise leaves empty. See module docstring above for coverage/limits."""

    sfx: List[str] = []
    vfx: List[str] = []

    for match in SFX_VFX_PATTERN.finditer(description):
        tag = match.group(1).upper()
        detail = match.group(2).strip()
        entry = detail if detail else tag

        target = sfx if tag == "SFX" else vfx
        if entry not in target:
            target.append(entry)

    return {
        "sound": _find_keyword_matches(description, SOUND_KEYWORDS),
        "vehicles": _find_keyword_matches(description, VEHICLE_KEYWORDS),
        "stunts": _find_keyword_matches(description, STUNT_KEYWORDS),
        "background_actors": _find_keyword_matches(description, BACKGROUND_ACTOR_KEYWORDS),
        "wardrobe": _find_keyword_matches(description, WARDROBE_KEYWORDS),
        "makeup_hair": _find_keyword_matches(description, MAKEUP_HAIR_KEYWORDS),
        "sfx": sfx,
        "vfx": vfx,
    }


# --- Scene building -----------------------------------------------------------

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


def finalize_scene(
    scene: Scene,
    character_cues: List[str] | None = None,
    known_names: set[str] | None = None,
) -> Scene:
    scene.description = scene.description.strip()
    scene.cast_members = combine_cast_members(
        character_cues or [], scene.description, known_names
    )

    elements = extract_scene_elements(scene.description)
    scene.sound = elements["sound"]
    scene.vehicles = elements["vehicles"]
    scene.stunts = elements["stunts"]
    scene.background_actors = elements["background_actors"]
    scene.wardrobe = elements["wardrobe"]
    scene.makeup_hair = elements["makeup_hair"]
    scene.sfx = elements["sfx"]
    scene.vfx = elements["vfx"]

    return scene


def parse_scene_heading(raw_heading: str) -> tuple[str, str, str]:
    """Normalize a raw scene heading (e.g. "INT. KITCHEN - MORNING") into
    (int_ext, location, time_of_day). Shared by both the .txt and .fdx parsers."""

    normalized_heading = (
        raw_heading.replace("–", "-").replace("—", "-").replace(".", "")
    )

    parts = [part.strip() for part in normalized_heading.split(" - ")]

    # "INT. KITCHEN - MORNING" has two parts; "INT. ANNA'S HOUSE - KITCHEN -
    # MORNING" has a sub-location in the middle. The time of day is always
    # the last part, everything before it is the location.
    if len(parts) > 1:
        location_part = " - ".join(parts[:-1]).upper()
        time_part = parts[-1]
    else:
        location_part = parts[0].upper()
        time_part = ""

    # Only strip the INT/EXT marker from the *start* of the heading - a plain
    # str.replace("INT", "") also removed it from inside location names
    # ("ASEMARAVINTOLA" -> "ASEMARAVOLA").
    prefix_match = re.match(r"^(INT\s*/\s*EXT|I\s*/\s*E|INT|EXT)\b\s*", location_part)

    if prefix_match:
        marker = re.sub(r"\s", "", prefix_match.group(1))
        int_ext = "INT/EXT" if "/" in marker else marker
        location = location_part[prefix_match.end():].strip()
    else:
        int_ext = ""
        location = location_part.strip()

    return int_ext, location, time_part


def _finalize_all(pending: List[tuple[Scene, List[str]]]) -> List[Scene]:
    """Finalize scenes only once the whole script has been read, so that the
    cast heuristic can check prose names against every dialogue cue in the
    script, not just the ones seen so far."""

    known_names = {cue for _, cues in pending for cue in cues}
    return [finalize_scene(scene, cues, known_names) for scene, cues in pending]


def parse_screenplay(text: str) -> List[Scene]:
    lines = text.split("\n")

    scenes: List[tuple[Scene, List[str]]] = []
    current_scene: Scene | None = None
    current_scene_character_cues: List[str] = []
    scene_counter = 1

    # Plain .txt screenplays have no machine-readable paragraph types (unlike
    # .fdx), so dialogue lines are tracked with a small state machine: a
    # character cue opens a dialogue block, a blank line closes it. Dialogue
    # text is intentionally excluded from `description` - same as the .fdx
    # parser, which only ever feeds "Action" paragraphs into it - otherwise
    # ordinary sentence-initial capitalization in spoken lines floods the
    # character-name heuristic with false positives.
    in_dialogue = False

    scene_heading_pattern = re.compile(
        r"^(INT\.?|EXT\.?|INT/EXT\.?|INT\.\/EXT\.?)",
        re.IGNORECASE
    )

    for raw_line in lines:
        line = raw_line.strip()

        if not line:
            in_dialogue = False
            continue

        line = line.replace("–", "-").replace("—", "-")

        if scene_heading_pattern.match(line):
            if current_scene:
                scenes.append((current_scene, current_scene_character_cues))

            int_ext, location, time_part = parse_scene_heading(line)

            current_scene = create_empty_scene(
                scene_number=scene_counter,
                int_ext=int_ext,
                location=location,
                time_of_day=time_part
            )
            current_scene_character_cues = []
            in_dialogue = False

            scene_counter += 1

        elif current_scene and is_character_cue_line(line):
            cue_name = clean_character_cue(line)
            if cue_name and cue_name not in current_scene_character_cues:
                current_scene_character_cues.append(cue_name)
            in_dialogue = True

        elif in_dialogue:
            continue

        else:
            if current_scene:
                if current_scene.description:
                    current_scene.description += " "
                current_scene.description += line

    if current_scene:
        scenes.append((current_scene, current_scene_character_cues))

    return _finalize_all(scenes)


def parse_fdx(content: bytes) -> List[Scene]:
    root = ET.fromstring(content)

    scenes: List[tuple[Scene, List[str]]] = []
    current_scene: Scene | None = None
    current_scene_character_cues: List[str] = []
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
                scenes.append((current_scene, current_scene_character_cues))

            int_ext, location, time_part = parse_scene_heading(paragraph_text)

            current_scene = create_empty_scene(
                scene_number=scene_counter,
                int_ext=int_ext,
                location=location,
                time_of_day=time_part
            )
            current_scene_character_cues = []

            scene_counter += 1

        elif paragraph_type == "Character":
            if current_scene:
                cue_name = clean_character_cue(paragraph_text)
                if cue_name and cue_name not in current_scene_character_cues:
                    current_scene_character_cues.append(cue_name)

        elif paragraph_type == "Action":
            if current_scene:
                if current_scene.description:
                    current_scene.description += " "
                current_scene.description += paragraph_text

    if current_scene:
        scenes.append((current_scene, current_scene_character_cues))

    return _finalize_all(scenes)
