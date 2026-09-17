from pydantic import BaseModel
from uuid import UUID


class RecognitionResult(BaseModel):
    id: UUID
    estado: str
    persona_id: UUID | None = None
    nombre: str | None = None
    similitud: float | None = None
    distancia: float | None = None
    umbral: float | None = None
    coincide: bool | None = None
    probabilidad_calibrada: float | None = None
