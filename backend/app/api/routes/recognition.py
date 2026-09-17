from datetime import datetime, timezone, timedelta
from time import perf_counter
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, Query
from starlette.concurrency import run_in_threadpool
from app.core.config import settings
from app.core.security import current_user, writer, admin
from app.database.connection import db
from app.models.recognition_model import RecognitionResult
from app.services.face_service import read_upload, extract
from app.services.embedding_service import compare
from app.services.probability_service import predict

router = APIRouter()


def recognize(content, origin, actor):
    if settings.threshold is None:
        raise HTTPException(503, 'Configura FACE_THRESHOLD después de evaluar el modelo')
    start = perf_counter()
    now = datetime.now(timezone.utc)
    # Log access before fetching biometric representations.
    db.audit(actor, 'comparar', 'face_embeddings')
    face = extract(content)
    result = {'estado': face['estado'], 'origen': origin, 'ejecutado_por': actor,
              'modelo_facial': settings.face_model, 'version_modelo_facial': settings.face_version,
              'calidad_imagen': face.get('calidad_imagen'), 'iluminacion': face.get('iluminacion'),
              'eliminar_despues_de': (now + timedelta(days=settings.retention_days)).isoformat()}
    name = None
    if face['estado'] == 'comparado':
        candidates = db.all('face_embeddings', select='*,personas!inner(nombre,activo),consentimientos!inner(revocado_at,vence_at)',
                            activo='eq.true', modelo=f'eq.{settings.face_model}',
                            version_modelo=f'eq.{settings.face_version}',
                            eliminar_despues_de=f'gt.{now.isoformat()}',
                            **{'personas.activo': 'eq.true', 'consentimientos.revocado_at': 'is.null'},
                            order='id')
        best = None
        for candidate in candidates:
            expiry = candidate['consentimientos']['vence_at']
            if expiry and datetime.fromisoformat(expiry.replace('Z', '+00:00')) <= now:
                continue
            try:
                similarity, distance = compare(face['embedding'], candidate['embedding'])
            except ValueError:
                continue
            if best is None or similarity > best[0]:
                best = (similarity, distance, candidate)
        if best is None:
            result['estado'] = 'sin_registros'
        else:
            similarity, distance, candidate = best
            name = candidate['personas']['nombre']
            result.update(persona_id=candidate['persona_id'], similitud=similarity, distancia=distance,
                          metrica_distancia='coseno', umbral=settings.threshold,
                          coincide=similarity >= settings.threshold)
            probability, model_id = predict(result)
            result.update(probabilidad_calibrada=probability, ml_model_id=model_id)
    result['duracion_ms'] = round((perf_counter() - start) * 1000)
    stored = db.insert('recognition_logs', result)
    db.audit(actor, 'reconocer', 'recognition_logs', stored['id'])
    return {**stored, 'nombre': name}


@router.post('/reconocimiento', response_model=RecognitionResult)
async def recognition(file: UploadFile, origen: Literal['camara', 'archivo'] = Form('archivo'),
                      user=Depends(writer)):
    content = await read_upload(file)
    return await run_in_threadpool(recognize, content, origen, user['id'])


@router.get('/reconocimiento/historial')
def history(offset: int = Query(0, ge=0), limit: int = Query(30, ge=1, le=100),
            estado: Literal['comparado', 'sin_rostro', 'baja_calidad', 'sin_registros', 'error'] | None = None,
            user=Depends(current_user)):
    params = {'estado': f'eq.{estado}'} if estado else {}
    db.audit(user['id'], 'consultar', 'recognition_logs')
    return db.select('recognition_logs', select='*,personas(nombre)', order='created_at.desc',
                     offset=str(offset), limit=str(limit), **params)


@router.get('/dashboard')
def dashboard(user=Depends(current_user)):
    db.audit(user['id'], 'consultar', 'dashboard')
    return db.rpc('resumen_dashboard', {})


@router.post('/mantenimiento/retencion')
def retention(user=Depends(admin)):
    return db.rpc('aplicar_retencion', {'p_actor': user['id']})


@router.get('/auditoria')
def audit_history(offset: int = Query(0, ge=0), user=Depends(admin)):
    db.audit(user['id'], 'consultar', 'audit_logs')
    return db.select('audit_logs', select='id,actor_id,accion,entidad,registro_id,resultado,created_at',
                     order='created_at.desc', offset=str(offset), limit='30')
