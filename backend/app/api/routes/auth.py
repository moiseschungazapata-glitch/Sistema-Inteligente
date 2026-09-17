from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.core.security import current_user
from app.database.connection import db

router = APIRouter(prefix='/auth')


class Login(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


@router.post('/login')
def login(body: Login):
    result = db.request('POST', '/auth/v1/token', params={'grant_type': 'password'},
                        data=body.model_dump())
    return {'access_token': result['access_token'], 'expires_in': result['expires_in']}


@router.get('/me')
def me(user=Depends(current_user)):
    return user
