from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.face_service import face_service
from app.database.supabase_client import supabase


router = APIRouter(
    prefix="/api/personas",
    tags=["Rostros"]
)


@router.post("/{persona_id}/rostro")
async def registrar_rostro(
    persona_id: int,
    file: UploadFile = File(...)
):
    try:
        # 1. Verificar que la persona exista
        persona = (
            supabase
            .table("personas")
            .select("id, nombre_completo, activo")
            .eq("id", persona_id)
            .execute()
        )

        if not persona.data:
            raise HTTPException(
                status_code=404,
                detail="La persona no existe"
            )

        if not persona.data[0]["activo"]:
            raise HTTPException(
                status_code=400,
                detail="La persona está inactiva"
            )

        # 2. Leer la imagen
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="El archivo está vacío"
            )

        # 3. Generar embedding facial
        result = face_service.generate_embedding(image_bytes)

        # 4. Guardar embedding en Supabase
        embedding_data = {
            "persona_id": persona_id,
            "embedding": result["embedding"],
            "modelo": result["modelo"],
            "dimension": result["dimension"]
        }

        response = (
            supabase
            .table("face_embeddings")
            .insert(embedding_data)
            .execute()
        )

        return {
            "status": "ok",
            "message": "Rostro registrado correctamente",
            "data": {
                "persona_id": persona_id,
                "modelo": result["modelo"],
                "dimension": result["dimension"],
                "embedding_id": response.data[0]["id"]
            }
        }

    except HTTPException:
        raise

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al registrar el rostro: {str(e)}"
        )