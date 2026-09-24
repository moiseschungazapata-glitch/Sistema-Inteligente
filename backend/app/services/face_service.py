import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceService:
    def __init__(self):
        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )

        self.app.prepare(
            ctx_id=0,
            det_size=(640, 640)
        )

    def generate_embedding(self, image_bytes: bytes):
        # Convertir los bytes de la imagen a una matriz de OpenCV
        image_array = np.frombuffer(image_bytes, np.uint8)

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        if image is None:
            raise ValueError("No se pudo leer la imagen")

        # Detectar rostros
        faces = self.app.get(image)

        if len(faces) == 0:
            raise ValueError("No se detectó ningún rostro")

        if len(faces) > 1:
            raise ValueError("Se detectaron varios rostros. Debe haber uno solo")

        face = faces[0]

        # Obtener embedding facial
        embedding = face.embedding

        if embedding is None:
            raise ValueError("No se pudo generar el embedding facial")

        return {
            "embedding": embedding.tolist(),
            "dimension": len(embedding),
            "modelo": "buffalo_l"
        }


face_service = FaceService()