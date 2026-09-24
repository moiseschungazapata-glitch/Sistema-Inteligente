from app.api.routes.faces import router as faces_router
from app.api.routes.personas import router as personas_router
from fastapi import FastAPI
from app.core.config import settings
from app.api.routes.supabase_health import router as supabase_health_router
from app.api.routes.recognition import router as recognition_router


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backend funcionando correctamente",
        "environment": settings.environment
    }

app.include_router(
    faces_router
    )

app.include_router(
    recognition_router
    )

app.include_router(
    supabase_health_router,
    prefix="/api"
)
app.include_router(
    personas_router,
    prefix="/api"
)