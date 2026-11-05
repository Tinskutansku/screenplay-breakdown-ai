import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from routers.scripts import router as scripts_router

app = FastAPI(title="Screenplay Breakdown AI")

# Local development runs the Vite dev server on its own port, so the browser
# needs CORS. In the deployed demo the frontend is served from this same app
# (see below), so no cross-origin requests happen at all.
_dev_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _dev_origins.split(",") if origin.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(scripts_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


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


# Serve the built React app when it exists (Docker image / deployed demo).
# Mounted last so the API routes above always take precedence.
_frontend_dist = Path(os.getenv("FRONTEND_DIST", Path(__file__).parent.parent / "frontend" / "dist"))

if _frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="frontend")
