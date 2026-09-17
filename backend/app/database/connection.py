"""Server-side PostgREST access. Never return credentials or upstream errors."""
import httpx
from fastapi import HTTPException
from app.core.config import settings


class Database:
    def request(self, method, path, *, params=None, data=None, token=None):
        if not settings.supabase_url or not settings.secret_key:
            raise HTTPException(503, 'Configura SUPABASE_URL y SUPABASE_SECRET_KEY en backend/.env')
        headers = {'apikey': settings.secret_key, 'Prefer': 'return=representation'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        elif settings.secret_key.startswith('eyJ'):
            headers['Authorization'] = f'Bearer {settings.secret_key}'
        try:
            with httpx.Client(timeout=30) as client:
                response = client.request(method, settings.supabase_url + path,
                                          headers=headers, params=params, json=data)
        except httpx.HTTPError:
            raise HTTPException(503, 'No se pudo conectar con Supabase') from None
        if response.status_code >= 400:
            if path.startswith('/auth/') and response.status_code in (400, 401, 403):
                raise HTTPException(401, 'Credenciales incorrectas o sesión vencida')
            if response.status_code == 409:
                raise HTTPException(409, 'El registro tiene dependencias o ya existe')
            raise HTTPException(502, 'Supabase rechazó la operación; comprueba el esquema y la configuración')
        return response.json() if response.content else None

    def select(self, table, **params):
        return self.request('GET', f'/rest/v1/{table}', params=params) or []

    def all(self, table, **params):
        # Page explicitly: Supabase limits each response by default.
        rows = []
        offset = 0
        while True:
            page = self.select(table, **{**params, 'limit': '500', 'offset': str(offset)})
            if not page:
                return rows
            rows.extend(page)
            offset += len(page)

    def insert(self, table, data):
        return self.request('POST', f'/rest/v1/{table}', data=data)[0]

    def update(self, table, data, **params):
        return self.request('PATCH', f'/rest/v1/{table}', data=data, params=params)

    def delete(self, table, **params):
        return self.request('DELETE', f'/rest/v1/{table}', params=params)

    def rpc(self, function, data):
        return self.request('POST', f'/rest/v1/rpc/{function}', data=data)

    def audit(self, actor, action, entity, record=None, detail=None):
        self.insert('audit_logs', {'actor_id': actor, 'accion': action, 'entidad': entity,
                                  'registro_id': record, 'resultado': 'exito',
                                  'detalle': detail or {}})


db = Database()
