from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class Persona(BaseModel):
    id: UUID
    nombre: str
    email: str | None = None
    activo: bool
    created_at: datetime
