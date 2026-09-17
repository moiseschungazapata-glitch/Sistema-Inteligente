from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.config import settings
from app.core.security import current_user, admin
from app.database.connection import db
from app.schemas.recognition_schema import ComparisonFeatures, TrainingRecord
from app.services.probability_service import train_model, predict

router = APIRouter()


@router.post('/probabilidades/prediccion')
def prediction(body: ComparisonFeatures, user=Depends(current_user)):
    probability, model = predict(body.model_dump())
    if probability is None:
        raise HTTPException(409, 'Todavía no hay un modelo ML calibrado')
    db.audit(user['id'], 'predecir', 'ml_models', model)
    return {'probabilidad_calibrada': probability, 'ml_model_id': model}


@router.post('/modelos/datos', status_code=201)
def add_records(body: list[TrainingRecord], user=Depends(admin)):
    if not 1 <= len(body) <= 500:
        raise HTTPException(422, 'Envía entre 1 y 500 ejemplos por carga')
    rows = [{**r.model_dump(mode='json'), 'modelo_facial': settings.face_model,
             'version_modelo_facial': settings.face_version, 'metrica_distancia': 'coseno',
             'validado_por': user['id'], 'validado_at': datetime.now(timezone.utc).isoformat()}
            for r in body]
    # One PostgREST bulk insert is transactional.
    stored = db.request('POST', '/rest/v1/ml_training_records', data=rows)
    db.audit(user['id'], 'cargar_dataset', 'ml_training_records', detail={'ejemplos': len(stored)})
    return {'insertados': len(stored)}


@router.post('/modelos/entrenar')
def train(user=Depends(admin)):
    return train_model(user['id'])


@router.get('/modelos/metricas')
def metrics(user=Depends(current_user)):
    db.audit(user['id'], 'consultar', 'ml_models')
    return db.select('ml_models', select='id,nombre,version,created_at,precision_score,recall_score,f1_score,tasa_falsos_positivos,tasa_falsos_negativos,matriz_confusion',
                     order='created_at.desc', limit='20')
