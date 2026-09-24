import numpy as np


class RecognitionService:

    def cosine_similarity(
        self,
        embedding_a: list[float],
        embedding_b: list[float]
    ) -> float:

        vector_a = np.array(
            embedding_a,
            dtype=np.float32
        )

        vector_b = np.array(
            embedding_b,
            dtype=np.float32
        )

        norm_a = np.linalg.norm(vector_a)
        norm_b = np.linalg.norm(vector_b)

        if norm_a == 0 or norm_b == 0:
            raise ValueError(
                "No se puede calcular la similitud con un vector de norma cero"
            )

        similarity = (
            np.dot(vector_a, vector_b)
            / (norm_a * norm_b)
        )

        return float(similarity)


recognition_service = RecognitionService()