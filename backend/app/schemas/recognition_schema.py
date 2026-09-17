from pydantic import BaseModel, Field, ConfigDict, model_validator
from uuid import UUID


class ComparisonFeatures(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    similitud: float = Field(ge=-1, le=1)
    distancia: float = Field(ge=0, le=2)
    calidad_imagen: float = Field(ge=0, le=1)
    iluminacion: float = Field(ge=0, le=1)

    @model_validator(mode='after')
    def cosine_distance(self):
        if abs(self.distancia - (1 - self.similitud)) > 1e-6:
            raise ValueError('Para distancia coseno se requiere distancia = 1 - similitud')
        return self


class TrainingRecord(ComparisonFeatures):
    resultado_real: bool
    fuente_validacion: str = Field(min_length=3, max_length=300)
    # Group subjects / sessions to prevent leaking them across dataset splits.
    grupo_validacion: str = Field(min_length=1, max_length=100)
    recognition_log_id: UUID | None = None
