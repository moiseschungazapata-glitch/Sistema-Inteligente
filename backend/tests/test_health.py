from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_is_public():
    assert client.get('/api/health').json() == {'status': 'ok'}


def test_personal_data_requires_authentication():
    for path in ('/api/personas', '/api/dashboard', '/api/reconocimiento/historial', '/api/modelos/metricas'):
        assert client.get(path).status_code == 401


def test_validation_does_not_echo_password():
    secret = 'x' * 300
    response = client.post('/api/auth/login', json={'email': 'a@b.co', 'password': secret})
    assert response.status_code == 422
    assert secret not in response.text


def test_openapi_contract():
    paths = client.get('/openapi.json').json()['paths']
    assert '/api/personas/{person_id}/rostro' in paths
    assert '/api/modelos/entrenar' in paths
