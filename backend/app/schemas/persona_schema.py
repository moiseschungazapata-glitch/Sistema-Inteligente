from pydantic import BaseModel, Field, ConfigDict, field_validator


class PersonaCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    nombre: str = Field(min_length=2, max_length=150)
    email: str | None = Field(default=None, max_length=254)
    consentimiento: bool
    version_aviso: str = Field(min_length=1, max_length=80)
    evidencia_referencia: str = Field(min_length=3, max_length=300)

    @field_validator('consentimiento')
    @classmethod
    def accepted(cls, value):
        if not value:
            raise ValueError('Se necesita consentimiento informado')
        return value

    @field_validator('email')
    @classmethod
    def valid_email(cls, value):
        if not value:
            return None
        if '@' not in value or ' ' in value:
            raise ValueError('Correo inválido')
        return value


class PersonaUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    nombre: str = Field(min_length=2, max_length=150)
    activo: bool
