from app.api.routes.faces import router as faces_router
from app.api.routes.personas import router as personas_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.supabase_health import router as supabase_health_router
from app.api.routes.recognition import router as recognition_router


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version
)

# Permite que el frontend de Vite se comunique con la API durante el desarrollo local.
# Se incluyen localhost y 127.0.0.1 porque el navegador los considera orígenes distintos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
