from uuid import uuid4
from dataclasses import replace
from app.services import probability_service as ml


def test_training_calibration_evaluation_and_prediction(tmp_path, monkeypatch):
    # Synthetic data is used ONLY in this isolated test; never inserted in Supabase.
    rows = [{'id': str(uuid4()), 'grupo_validacion': str(i // 10),
             'resultado_real': bool(i % 2), 'similitud': .85 if i % 2 else .1,
             'distancia': .15 if i % 2 else .9, 'calidad_imagen': .8, 'iluminacion': .5}
            for i in range(200)]
    monkeypatch.setattr(ml, 'settings', replace(ml.settings, model_dir=tmp_path))
    monkeypatch.setattr(ml.db, 'all', lambda *a, **kw: rows)
    saved = []
    monkeypatch.setattr(ml.db, 'insert', lambda table, data: saved.append(data) or data)
    monkeypatch.setattr(ml.db, 'audit', lambda *a, **kw: None)
    result = ml.train_model(str(uuid4()))
    assert result['calibrado'] is True
    assert 0 <= result['f1_score'] <= 1
    assert sum(result['matriz_confusion'].values()) == 40
    monkeypatch.setattr(ml.db, 'select', lambda *a, **kw: saved)
    probability, model = ml.predict(rows[1])
    assert 0 < probability < 1
    assert model == result['id']
    assert probability != rows[1]['similitud']


def test_no_model_is_not_a_fake_probability(monkeypatch):
    monkeypatch.setattr(ml.db, 'select', lambda *a, **kw: [])
    assert ml.predict({}) == (None, None)
