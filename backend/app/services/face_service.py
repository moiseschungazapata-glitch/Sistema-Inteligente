from io import BytesIO
from threading import Lock
import warnings

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError
from fastapi import HTTPException, UploadFile
from app.core.config import settings
from app.services.embedding_service import normalize

_engine = None
_lock = Lock()


def engine():
    global _engine
    if _engine is None:
        model_path = settings.model_dir / 'models' / settings.face_model
        if not list(model_path.glob('*.onnx')):
            raise HTTPException(503, 'Falta el modelo facial. Ejecuta python -m app.setup_model')
        try:
            from insightface.app import FaceAnalysis
            _engine = FaceAnalysis(name=settings.face_model, root=str(settings.model_dir),
                                   allowed_modules=['detection', 'recognition'],
                                   providers=['CPUExecutionProvider'])
            _engine.prepare(ctx_id=-1, det_size=(640, 640))
        except Exception:
            _engine = None
            raise HTTPException(503, 'No se pudo cargar InsightFace. Revisa requirements-face.txt y los modelos') from None
    return _engine


async def read_upload(file: UploadFile):
    if file.content_type not in ('image/jpeg', 'image/png', 'image/webp'):
        raise HTTPException(415, 'Solo se aceptan imágenes JPEG, PNG o WebP')
    content = await file.read(settings.max_upload_bytes + 1)
    await file.close()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(413, 'La imagen supera 8 MB')
    return content


def extract(content):
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as source:
                if source.width * source.height > settings.max_image_pixels:
                    raise HTTPException(413, 'La imagen supera 16 megapíxeles')
                source.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(422, 'El archivo no es una imagen válida') from None
    image = cv2.imdecode(np.frombuffer(content, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(422, 'No se pudo decodificar la imagen')
    with _lock:
        faces = engine().get(image)
    if not faces:
        return {'estado': 'sin_rostro'}
    if len(faces) != 1:
        raise HTTPException(422, 'La captura debe contener exactamente un rostro')
    face = faces[0]
    x1, y1, x2, y2 = face.bbox.astype(int)
    crop = image[max(0, y1):min(image.shape[0], y2), max(0, x1):min(image.shape[1], x2)]
    if not crop.size or min(crop.shape[:2]) < settings.min_face_pixels:
        return {'estado': 'baja_calidad'}
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    illumination = float(gray.mean() / 255)
    if sharpness < settings.min_sharpness or not .12 <= illumination <= .92:
        return {'estado': 'baja_calidad'}
    return {'estado': 'comparado', 'embedding': normalize(face.embedding).tolist(),
            'calidad_imagen': min(sharpness / 500, 1), 'iluminacion': illumination}
