from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.supabase_client import supabase

router = APIRouter()


class PersonaCreate(BaseModel):
    nombre_completo: str
    documento: str | None = None


def _normalizar_persona(persona: dict) -> dict:
    """Expone el nombre que usa el frontend sin cambiar el esquema de Supabase."""
    return {
        **persona,
        "nombre_completo": persona.get("nombre", ""),
    }


@router.post("/personas")
def crear_persona(persona: PersonaCreate):
    try:
        response = (
            supabase
            .table("personas")
            .insert({
                "nombre": persona.nombre_completo,
                "documento": persona.documento
            })
            .execute()
        )

        return {
            "status": "ok",
            "message": "Persona registrada correctamente",
            "data": [_normalizar_persona(item) for item in response.data]
        }

    except Exception as e:
        print("ERROR SUPABASE:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/personas/test-insert")
def test_insert():
    try:
        response = (
            supabase
            .table("personas")
            .insert({
                "nombre": "Prueba Python",
                "documento": "88888888"
            })
            .execute()
        )

        return {
            "status": "ok",
            "data": response.data
        }

    except Exception as e:
        print("ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/personas")
def listar_personas():
    try:
        response = (
            supabase
            .table("personas")
            .select("id, nombre, documento, activo")
            .execute()
        )

        return {
            "status": "ok",
            "data": [_normalizar_persona(item) for item in response.data]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    
