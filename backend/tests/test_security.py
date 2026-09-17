from fastapi.testclient import TestClient
from app.main import app
from app.core.security import current_user
from app.database.connection import db


def test_readonly_role_cannot_write_or_train():
    app.dependency_overrides[current_user] = lambda: {'id': 'test', 'rol': 'consulta'}
    try:
        client = TestClient(app)
        assert client.post('/api/modelos/entrenar').status_code == 403
        assert client.post('/api/personas', json={}).status_code == 403
        assert client.post('/api/mantenimiento/retencion').status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_operator_cannot_train_or_delete():
    app.dependency_overrides[current_user] = lambda: {'id': 'test', 'rol': 'operador'}
    try:
        client = TestClient(app)
        assert client.post('/api/modelos/entrenar').status_code == 403
        assert client.delete('/api/personas/00000000-0000-0000-0000-000000000001').status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_inactive_profile_cannot_access_data(monkeypatch):
    monkeypatch.setattr(db, 'request', lambda *a, **kw: {'id': 'some-user'})
    monkeypatch.setattr(db, 'select', lambda *a, **kw: [{'id': 'some-user', 'activo': False}])
    response = TestClient(app).get('/api/personas', headers={'Authorization': 'Bearer test'})
    assert response.status_code == 403
