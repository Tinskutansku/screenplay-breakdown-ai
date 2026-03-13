from pydantic import BaseModel
from typing import List


class Scene(BaseModel):
    scene_number: str
    int_ext: str
    location: str
    time_of_day: str
    description: str

    cast_members: List[str] = []
    background_actors: List[str] = []
    set_dressing: List[str] = []
    props: List[str] = []
    sound: List[str] = []
    wardrobe: List[str] = []
    makeup_hair: List[str] = []
    vehicles: List[str] = []
    stunts: List[str] = []
    sfx: List[str] = []
    vfx: List[str] = []
    notes: List[str] = []