from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.scenes import router as scenes_router
from routers.scripts import router as scripts_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenes_router)
app.include_router(scripts_router)