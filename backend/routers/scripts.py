from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

from services.parser_service import parse_screenplay, parse_fdx

router = APIRouter()


class ScriptInput(BaseModel):
    script_text: str


@router.post("/parse-script")
def parse_script(input_data: ScriptInput):
    scenes = parse_screenplay(input_data.script_text)
    return scenes


@router.post("/upload-script")
async def upload_script(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".txt"):
        text = contents.decode("utf-8")
        scenes = parse_screenplay(text)
        return scenes

    if filename.endswith(".fdx"):
        scenes = parse_fdx(contents)
        return scenes

    return {"error": "Unsupported file type. Please upload a .txt or .fdx file."}