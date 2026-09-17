import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, auth, personas, recognition, probabilities

app = FastAPI(title='Sistema Inteligente de Reconocimiento Facial', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins),
                   allow_methods=['GET', 'POST', 'PATCH', 'DELETE'],
                   allow_headers=['Authorization', 'Content-Type'])
for route in (health, auth, personas, recognition, probabilities):
    app.include_router(route.router, prefix='/api')


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    # Do not echo input: it may include a password or biometric payload.
    return JSONResponse(status_code=422, content={'detail': [
        {'loc': list(e['loc']), 'msg': e['msg']} for e in exc.errors()
    ]})


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    logging.getLogger(__name__).error('Error interno: %s', type(exc).__name__)
    return JSONResponse(status_code=500, content={'detail': 'Error interno del servidor'})
