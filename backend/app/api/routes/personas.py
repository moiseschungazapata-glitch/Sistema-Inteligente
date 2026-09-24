from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.supabase_client import supabase

router = APIRouter()


class PersonaCreate(BaseModel):
    nombre_completo: str
    documento: str | None = None


@router.post("/personas")
def crear_persona(persona: PersonaCreate):
    try:
        response = (
            supabase
            .table("personas")
            .insert({
                "nombre_completo": persona.nombre_completo,
                "documento": persona.documento
            })
            .execute()
        )

        return {
            "status": "ok",
            "message": "Persona registrada correctamente",
            "data": response.data
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
                "nombre_completo": "Prueba Python",
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
            .select("*")
            .execute()
        )

        return {
            "status": "ok",
            "data": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    