from io import BytesIO
from unittest.mock import Mock
import numpy as np
import pytest
from fastapi import HTTPException
from PIL import Image
from app.services.embedding_service import compare, normalize
from app.services import face_service
from app.services.probability_service import split_groups
from app.schemas.persona_schema import PersonaCreate


def test_cosine_is_not_probability():
    assert compare([1, 0], [1, 0]) == (1, 0)
    assert compare([1, 0], [-1, 0]) == (-1, 2)
    assert compare([1, 0], [0, 1]) == (0, 1)


@pytest.mark.parametrize('vector', [[0, 0], [float('nan'), 1], [float('inf'), 1], [], [[1, 2]]])
def test_invalid_embeddings_rejected(vector):
    with pytest.raises(ValueError):
        normalize(vector)


def test_incompatible_dimensions_rejected():
    with pytest.raises(ValueError):
        compare([1, 0], [1, 0, 0])


def test_consent_required():
    with pytest.raises(ValueError):
        PersonaCreate(nombre='Persona', consentimiento=False, version_aviso='1', evidencia_referencia='acta')


def test_non_image_rejected():
    with pytest.raises(HTTPException) as exc:
        face_service.extract(b'not an image')
    assert exc.value.status_code == 422


def test_no_face_and_multiple_faces(monkeypatch):
    image = BytesIO()
    Image.new('RGB', (100, 100)).save(image, format='PNG')
    model = Mock()
    monkeypatch.setattr(face_service, 'engine', lambda: model)
    model.get.return_value = []
    assert face_service.extract(image.getvalue())['estado'] == 'sin_rostro'
    model.get.return_value = [Mock(), Mock()]
    with pytest.raises(HTTPException) as exc:
        face_service.extract(image.getvalue())
    assert exc.value.status_code == 422


def test_ml_partitions_never_share_groups():
    rows = [{'grupo_validacion': str(i // 10), 'resultado_real': bool(i % 2)} for i in range(200)]
    train, cal, test = split_groups(rows)
    groups = [{rows[i]['grupo_validacion'] for i in part} for part in (train, cal, test)]
    assert not groups[0] & groups[1]
    assert not groups[0] & groups[2]
    assert not groups[1] & groups[2]
    assert sorted(np.concatenate((train, cal, test)).tolist()) == list(range(200))


def test_insufficient_data_cannot_produce_probabilities():
    with pytest.raises(HTTPException):
        split_groups([])
