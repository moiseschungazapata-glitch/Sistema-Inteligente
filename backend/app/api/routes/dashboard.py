from fastapi import APIRouter, HTTPException

from app.database.supabase_client import supabase


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def obtener_resumen():
    """Devuelve las métricas que utiliza el dashboard principal."""
    try:
        personas = supabase.table("personas").select("id").execute().data or []
        reconocimientos = (
            supabase
            .table("recognition_logs")
            .select("*")
            .execute()
            .data
            or []
        )

        coincidencias = sum(
            1
            for registro in reconocimientos
            if registro.get("coincide") is True
            or registro.get("resultado") == "coincide"
            or registro.get("estado") == "coincide"
        )
        total = len(reconocimientos)

        return {
            "personas": len(personas),
            "reconocimientos": total,
            "coincidencias": coincidencias,
            "precision": round((coincidencias / total) * 100, 2)
            if total
            else None,
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo obtener el resumen: {error}",
        )
