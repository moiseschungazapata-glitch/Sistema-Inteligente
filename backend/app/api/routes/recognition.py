from fastapi import APIRouter, UploadFile, File, HTTPException

from app.database.supabase_client import supabase
from app.services.face_service import face_service
from app.services.recognition_service import recognition_service


router = APIRouter(
    prefix="/api/reconocimiento",
    tags=["Reconocimiento"]
)


@router.get("/historial")
def obtener_historial():
    try:
        response = (
            supabase
            .table("recognition_logs")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return [
            {
                **registro,
                "similarity": registro.get("similarity", registro.get("similitud")),
                "distance": registro.get("distance", registro.get("distancia")),
                "resultado": registro.get(
                    "resultado",
                    registro.get("estado")
                    or ("coincide" if registro.get("coincide") else "no_coincide"),
                ),
            }
            for registro in (response.data or [])
        ]
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo obtener el historial: {error}",
        )


# Umbral temporal.
# Más adelante será ajustado mediante pruebas reales.
UMBRAL_SIMILITUD = 0.50


@router.post("")
async def reconocer_rostro(
    file: UploadFile = File(...)
):
    try:

        # =====================================================
        # 1. Leer imagen
        # =====================================================

        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="El archivo está vacío"
            )


        # =====================================================
        # 2. Generar embedding
        # =====================================================

        new_face = face_service.generate_embedding(
            image_bytes
        )

        new_embedding = new_face["embedding"]


        # =====================================================
        # 3. Obtener embeddings registrados
        # =====================================================

        stored_embeddings = (
            supabase
            .table("face_embeddings")
            .select(
                "id, persona_id, embedding, modelo, dimension"
            )
            .execute()
        )


        if not stored_embeddings.data:
            raise HTTPException(
                status_code=404,
                detail="No existen rostros registrados"
            )


        # =====================================================
        # 4. Buscar la mejor coincidencia
        # =====================================================

        best_match = None


        for stored in stored_embeddings.data:

            similarity = (
                recognition_service.cosine_similarity(
                    new_embedding,
                    stored["embedding"]
                )
            )


            if (
                best_match is None
                or similarity > best_match["similarity"]
            ):

                best_match = {
                    "embedding_id": stored["id"],
                    "persona_id": stored["persona_id"],
                    "similarity": similarity,
                    "modelo": stored["modelo"]
                }


        # =====================================================
        # 5. Calcular distancia
        # =====================================================

        distance = 1 - best_match["similarity"]


        # =====================================================
        # 6. Aplicar umbral
        # =====================================================

        coincide = (
            best_match["similarity"]
            >= UMBRAL_SIMILITUD
        )


        resultado = (
            "coincide"
            if coincide
            else "no_coincide"
        )


        # =====================================================
        # 7. Obtener datos de la persona
        # =====================================================

        persona = None


        if coincide:

            persona_response = (
                supabase
                .table("personas")
                .select(
                    "id, nombre, documento, activo"
                )
                .eq(
                    "id",
                    best_match["persona_id"]
                )
                .execute()
            )


            if persona_response.data:
                persona_row = persona_response.data[0]
                persona = {
                    **persona_row,
                    "nombre_completo": persona_row.get("nombre", ""),
                }


        # =====================================================
        # 8. Guardar historial
        # =====================================================

        log_data = {
            "persona_id": (
                best_match["persona_id"]
                if coincide
                else None
            ),
            "similitud": best_match["similarity"],
            "distancia": distance,
            "umbral": UMBRAL_SIMILITUD,
            "coincide": coincide,
            "estado": resultado,
            "confianza": None,
            "modelo": best_match["modelo"],
            "probabilidad_calibrada": None
        }


        log_response = (
            supabase
            .table("recognition_logs")
            .insert(log_data)
            .execute()
        )


        # =====================================================
        # 9. Respuesta
        # =====================================================

        return {
            "status": "ok",
            "message": "Reconocimiento realizado correctamente",
            "data": {
                "resultado": resultado,
                "coincide": coincide,
                "persona": persona,
                "similitud": round(
                    best_match["similarity"],
                    5
                ),
                "distancia": round(
                    distance,
                    5
                ),
                "umbral": UMBRAL_SIMILITUD,
                "modelo": best_match["modelo"],
                "embedding_id": (
                    best_match["embedding_id"]
                ),
                "recognition_log_id": (
                    log_response.data[0]["id"]
                    if log_response.data
                    else None
                )
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
            detail=(
                "Error durante el reconocimiento: "
                f"{str(e)}"
            )
        )
