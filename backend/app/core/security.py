from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.database.connection import db

bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if credentials is None:
        raise HTTPException(401, 'Inicia sesión para continuar')
    user = db.request('GET', '/auth/v1/user', token=credentials.credentials)
    profiles = db.select('perfiles', id=f'eq.{user["id"]}', select='id,nombre,rol,activo')
    if not profiles or not profiles[0]['activo']:
        raise HTTPException(403, 'Tu cuenta no tiene un perfil activo; contacta al administrador')
    return profiles[0]


def writer(user=Depends(current_user)):
    if user['rol'] not in ('administrador', 'operador'):
        raise HTTPException(403, 'Esta operación requiere rol de operador o administrador')
    return user


def admin(user=Depends(current_user)):
    if user['rol'] != 'administrador':
        raise HTTPException(403, 'Esta operación requiere rol de administrador')
    return user
