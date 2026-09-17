from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Query
from starlette.concurrency import run_in_threadpool
from app.core.config import settings
from app.core.security import current_user, writer, admin
from app.database.connection import db
from app.models.persona_model import Persona
from app.schemas.persona_schema import PersonaCreate, PersonaUpdate
from app.services.face_service import read_upload, extract

router = APIRouter(prefix='/personas')


@router.get('', response_model=list[Persona])
def list_people(offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
                user=Depends(current_user)):
    db.audit(user['id'], 'consultar', 'personas')
    return db.select('personas', select='id,nombre,email,activo,created_at',
                     order='created_at.desc', offset=str(offset), limit=str(limit))


@router.post('', response_model=Persona, status_code=201)
def create_person(body: PersonaCreate, user=Depends(writer)):
    return db.rpc('registrar_persona', {'p_nombre': body.nombre, 'p_email': body.email,
                  'p_actor': user['id'], 'p_version': body.version_aviso,
                  'p_evidencia': body.evidencia_referencia})


@router.patch('/{person_id}', response_model=Persona)
def edit_person(person_id: UUID, body: PersonaUpdate, user=Depends(writer)):
    rows = db.update('personas', body.model_dump(), id=f'eq.{person_id}')
    if not rows:
        raise HTTPException(404, 'Persona no encontrada')
    db.audit(user['id'], 'editar', 'personas', str(person_id))
    return rows[0]


@router.post('/{person_id}/rostro', status_code=201)
async def register_face(person_id: UUID, file: UploadFile, user=Depends(writer)):
    content = await read_upload(file)
    result = await run_in_threadpool(extract, content)
    if result['estado'] != 'comparado':
        raise HTTPException(422, 'No se detectó un rostro de calidad suficiente')
    # RPC revalidates active person/consent under a lock at write time.
    return await run_in_threadpool(db.rpc, 'registrar_embedding', {
        'p_persona': str(person_id), 'p_actor': user['id'],
        'p_embedding': result['embedding'], 'p_modelo': settings.face_model,
        'p_version': settings.face_version, 'p_calidad': result['calidad_imagen'],
        'p_expira': (datetime.now(timezone.utc) + timedelta(days=settings.retention_days)).isoformat(),
    })


@router.post('/{person_id}/revocar')
def revoke(person_id: UUID, user=Depends(writer)):
    return db.rpc('revocar_persona', {'p_persona': str(person_id), 'p_actor': user['id']})


@router.delete('/{person_id}')
def remove(person_id: UUID, user=Depends(admin)):
    return db.rpc('eliminar_persona', {'p_persona': str(person_id), 'p_actor': user['id']})
