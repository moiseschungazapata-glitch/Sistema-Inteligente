"""Explicit model download, never triggered by an HTTP request."""
from app.core.config import settings

if __name__ == '__main__':
    from insightface.app import FaceAnalysis
    print('Descargando modelo InsightFace. Consulta su licencia antes de usarlo comercialmente.')
    model = FaceAnalysis(name=settings.face_model, root=str(settings.model_dir),
                         allowed_modules=['detection', 'recognition'],
                         providers=['CPUExecutionProvider'])
    model.prepare(ctx_id=-1, det_size=(640, 640))
    print('Modelo listo.')
