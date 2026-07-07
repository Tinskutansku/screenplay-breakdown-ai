from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers.auth import router as auth_router
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

app.include_router(auth_router)
app.include_router(scenes_router)
app.include_router(scripts_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for genuinely unexpected errors (bugs, not user-input
    mistakes - those are already raised as HTTPException with a clear
    message in the routers). Keeps the error response shape consistent
    (always a {"detail": ...} JSON body) so the frontend's error handling
    doesn't need a special case for "the server broke in some new way"."""

    return JSONResponse(
        status_code=500,
        content={"detail": "Odottamaton virhe palvelimessa. Yritä myöhemmin uudelleen."}
    )
