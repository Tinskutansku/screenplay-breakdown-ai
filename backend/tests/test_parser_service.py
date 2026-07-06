# -*- coding: utf-8 -*-
from services.parser_service import (
    parse_scene_heading,
    extract_character_names_from_text,
    is_character_cue_line,
    clean_character_cue,
    extract_scene_elements,
    parse_screenplay,
    parse_fdx,
)


# --- parse_scene_heading -------------------------------------------------

def test_heading_int_with_time():
    int_ext, location, time_of_day = parse_scene_heading("INT. KEITTIÖ - AAMU")
    assert int_ext == "INT"
    assert location == "KEITTIÖ"
    assert time_of_day == "AAMU"


def test_heading_ext_no_time():
    int_ext, location, time_of_day = parse_scene_heading("EXT. PIHA")
    assert int_ext == "EXT"
    assert location == "PIHA"
    assert time_of_day == ""


def test_heading_int_ext_combo():
    int_ext, location, time_of_day = parse_scene_heading("INT/EXT. AUTOTALLI - ILTA")
    assert int_ext == "INT/EXT"
    assert location == "AUTOTALLI"
    assert time_of_day == "ILTA"


def test_heading_en_dash_is_normalized():
    int_ext, location, time_of_day = parse_scene_heading("INT. KIRJASTO – YO")
    assert int_ext == "INT"
    assert location == "KIRJASTO"
    assert time_of_day == "YO"


# --- character cue detection ---------------------------------------------

def test_is_character_cue_line_accepts_all_caps_name():
    assert is_character_cue_line("ANNA") is True
    assert is_character_cue_line("JUHO (V.O.)") is True


def test_is_character_cue_line_rejects_mixed_case():
    assert is_character_cue_line("Anna kavelee sisaan.") is False


def test_is_character_cue_line_rejects_transitions():
    assert is_character_cue_line("CUT TO") is False
    assert is_character_cue_line("FADE OUT") is False


def test_is_character_cue_line_rejects_long_lines():
    assert is_character_cue_line("A" * 41) is False


def test_clean_character_cue_strips_extensions():
    assert clean_character_cue("ANNA (V.O.)") == "Anna"
    assert clean_character_cue("JUHO (CONT'D)") == "Juho"
    assert clean_character_cue("ANNA VIRTANEN") == "Anna Virtanen"


# --- extract_character_names_from_text ------------------------------------

def test_extract_character_names_ignores_common_finnish_words():
    text = "Sitten Puhelin soi. Joku huutaa. Anna vastaa."
    names = extract_character_names_from_text(text)
    assert "Anna" in names
    assert "Sitten" not in names
    assert "Puhelin" not in names
    assert "Joku" not in names


def test_extract_character_names_deduplicates():
    text = "Anna katsoo. Anna hymyilee."
    assert extract_character_names_from_text(text) == ["Anna"]


# --- extract_scene_elements ------------------------------------------------

def test_extract_scene_elements_sfx_vfx():
    description = "Ovi paukahtaa. (SFX: kovaa kolinaa) (VFX: rakennus rajahtaa)"
    elements = extract_scene_elements(description)
    assert elements["sfx"] == ["kovaa kolinaa"]
    assert elements["vfx"] == ["rakennus rajahtaa"]


def test_extract_scene_elements_vehicle_prefix_match_avoids_false_positive():
    # "pakenevan" ends in "van" but must NOT be picked up as a vehicle -
    # regression test for the word-boundary/prefix fix.
    description = "Mies hyppaa pakenevan auton kyytiin."
    elements = extract_scene_elements(description)
    assert "van" not in elements["vehicles"]
    assert "auto" in elements["vehicles"]


def test_extract_scene_elements_background_actors_finnish_spelling():
    description = "Taustalla on pari ekstraa ja vakijoukko."
    elements = extract_scene_elements(description)
    assert "ekstra" in elements["background_actors"]


def test_extract_scene_elements_empty_description_returns_empty_lists():
    elements = extract_scene_elements("")
    assert all(value == [] for value in elements.values())


# --- parse_screenplay (.txt) ------------------------------------------------

def test_parse_screenplay_empty_input_returns_no_scenes():
    assert parse_screenplay("") == []


def test_parse_screenplay_text_before_first_heading_is_ignored():
    text = "Tama rivi on ennen ensimmaista kohtausta.\nINT. HUONE - PAIVA\nAnna istuu."
    scenes = parse_screenplay(text)
    assert len(scenes) == 1
    assert "ennen" not in scenes[0].description


def test_parse_screenplay_splits_multiple_scenes():
    text = (
        "INT. KEITTIO - AAMU\n"
        "Anna juo kahvia.\n"
        "EXT. PIHA - PAIVA\n"
        "Juho kavelee.\n"
    )
    scenes = parse_screenplay(text)
    assert len(scenes) == 2
    assert scenes[0].location == "KEITTIO"
    assert scenes[1].location == "PIHA"


def test_parse_screenplay_dialogue_excluded_from_description():
    text = (
        "INT. KEITTIO - AAMU\n"
        "\n"
        "ANNA\n"
        "Huomenta! Onko kahvia jaljella?\n"
        "\n"
        "Anna kaataa kahvia.\n"
    )
    scenes = parse_screenplay(text)
    assert len(scenes) == 1
    assert "Huomenta" not in scenes[0].description
    assert "Anna kaataa kahvia." in scenes[0].description
    assert "Anna" in scenes[0].cast_members


def test_parse_screenplay_character_cue_detected_without_action_mention():
    text = (
        "INT. KEITTIO - AAMU\n"
        "\n"
        "JUHO\n"
        "Moi.\n"
    )
    scenes = parse_screenplay(text)
    assert scenes[0].cast_members == ["Juho"]


# --- parse_fdx --------------------------------------------------------------

FDX_SAMPLE = """<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft>
<Content>
<Paragraph Type="Scene Heading"><Text>INT. KEITTIO - AAMU</Text></Paragraph>
<Paragraph Type="Character"><Text>ANNA</Text></Paragraph>
<Paragraph Type="Dialogue"><Text>Huomenta!</Text></Paragraph>
<Paragraph Type="Action"><Text>Anna kaataa kahvia kuppiin.</Text></Paragraph>
<Paragraph Type="Character"><Text>JUHO (V.O.)</Text></Paragraph>
<Paragraph Type="Dialogue"><Text>Joo, tulossa.</Text></Paragraph>
<Paragraph Type="Scene Heading"><Text>EXT. PIHA - PAIVA</Text></Paragraph>
<Paragraph Type="Action"><Text>Juho kavelee pihalla.</Text></Paragraph>
</Content>
</FinalDraft>
"""


def test_parse_fdx_uses_character_paragraph_type():
    scenes = parse_fdx(FDX_SAMPLE.encode("utf-8"))
    assert len(scenes) == 2
    assert scenes[0].cast_members == ["Anna", "Juho"]
    assert scenes[1].cast_members == ["Juho"]


def test_parse_fdx_dialogue_excluded_from_description():
    scenes = parse_fdx(FDX_SAMPLE.encode("utf-8"))
    assert "Huomenta" not in scenes[0].description
    assert "Anna kaataa kahvia kuppiin." in scenes[0].description


def test_parse_fdx_malformed_xml_raises():
    import xml.etree.ElementTree as ET
    import pytest

    with pytest.raises(ET.ParseError):
        parse_fdx(b"<not-valid-xml")
