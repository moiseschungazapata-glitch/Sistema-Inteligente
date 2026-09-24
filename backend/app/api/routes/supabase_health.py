from fastapi import APIRouter
from app.database.supabase_client import supabase

router = APIRouter()


@router.get("/health/supabase")
def supabase_health():
    try:
        response = supabase.table("connection_test").select("*").execute()

        return {
            "status": "ok",
            "message": "Supabase conectado correctamente",
            "data": response.data
        }

    except Exception as e:
        return {
            "status": "error",
            "message": "No se pudo consultar Supabase",
            "detail": str(e)
        }