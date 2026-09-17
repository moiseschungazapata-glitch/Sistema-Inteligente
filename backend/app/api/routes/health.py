from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import current_user
from app.database.connection import db

router = APIRouter()


@router.get('/health')
def health():
    return {'status': 'ok'}


@router.get('/estado')
def readiness(user=Depends(current_user)):
    db.select('personas', select='id', limit='1')
    return {'base_datos': True, 'modelo_facial': bool(list(
        (settings.model_dir / 'models' / settings.face_model).glob('*.onnx'))),
        'umbral_configurado': settings.threshold is not None}
