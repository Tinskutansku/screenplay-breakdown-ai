from fastapi import APIRouter

router = APIRouter()


@router.get("/scenes")
def get_scenes():
    return [
        {
            "scene_number": "1",
            "int_ext": "INT",
            "location": "Keittiö",
            "time_of_day": "Aamu",
            "description": "Anna juo aamukahvia keittiössä ja vastaa soivaan puhelimeen.",
            "cast_members": ["Anna"],
            "background_actors": [],
            "set_dressing": ["Kuva Annasta ja Juhosta"],
            "props": ["kahvikuppi", "puhelin"],
            "sound": [],
            "wardrobe": ["aamutakki"],
            "makeup_hair": ["kevyt arkimeikki"],
            "vehicles": [],
            "stunts": [],
            "sfx": [],
            "vfx": [],
            "notes": []
        }
    ]