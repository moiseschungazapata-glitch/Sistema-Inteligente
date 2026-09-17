import numpy as np


def normalize(vector):
    vector = np.asarray(vector, dtype=np.float64)
    if vector.ndim != 1 or not vector.size or not np.isfinite(vector).all():
        raise ValueError('Embedding inválido')
    norm = np.linalg.norm(vector)
    if norm <= 1e-12:
        raise ValueError('Embedding de norma cero')
    return vector / norm


def compare(a, b):
    a, b = normalize(a), normalize(b)
    if a.shape != b.shape:
        raise ValueError('Las dimensiones de los embeddings no coinciden')
    similarity = float(np.clip(np.dot(a, b), -1, 1))
    return similarity, 1.0 - similarity
