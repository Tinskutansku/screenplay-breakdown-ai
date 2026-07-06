import xml.etree.ElementTree as ET

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from services.parser_service import parse_screenplay, parse_fdx

router = APIRouter()

SUPPORTED_EXTENSIONS = (".txt", ".fdx")


class ScriptInput(BaseModel):
    script_text: str


@router.post("/parse-script")
def parse_script(input_data: ScriptInput):
    if not input_data.script_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Käsikirjoitusteksti on tyhjä. Liitä käsikirjoitusteksti ennen jäsentämistä."
        )

    return parse_screenplay(input_data.script_text)


@router.post("/upload-script")
async def upload_script(file: UploadFile = File(...)):
    filename = (file.filename or "").lower()

    if not filename.endswith(SUPPORTED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Tiedostomuotoa ei tueta. Lataa .txt- tai .fdx-tiedosto."
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Ladattu tiedosto on tyhjä.")

    if filename.endswith(".txt"):
        try:
            text = contents.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Tiedostoa ei voitu lukea UTF-8-koodattuna. Tallenna tiedosto UTF-8-muodossa ja yritä uudelleen."
            )

        return parse_screenplay(text)

    try:
        return parse_fdx(contents)
    except ET.ParseError:
        raise HTTPException(
            status_code=400,
            detail="Tiedosto ei ole kelvollinen .fdx-tiedosto (XML ei jäsentynyt)."
        )
