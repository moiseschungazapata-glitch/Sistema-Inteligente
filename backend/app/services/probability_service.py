"""Independent train/calibration/test groups; no synthetic probabilities."""
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4
import joblib
import numpy as np
from fastapi import HTTPException
from sklearn.calibration import CalibratedClassifierCV
from sklearn.frozen import FrozenEstimator
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, brier_score_loss
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from app.core.config import settings
from app.database.connection import db

FEATURES = ('similitud', 'distancia', 'calidad_imagen', 'iluminacion')


def split_groups(rows):
    if len(rows) < 60:
        raise HTTPException(422, 'Se necesitan al menos 60 comparaciones verificadas')
    groups = np.array([r['grupo_validacion'] for r in rows])
    y = np.array([int(r['resultado_real']) for r in rows])
    if len(set(groups)) < 10:
        raise HTTPException(422, 'Se necesitan al menos 10 grupos independientes de personas/sesiones')
    indices = np.arange(len(rows))
    for seed in range(42, 62):
        train_cal, test = next(GroupShuffleSplit(n_splits=1, test_size=.2, random_state=seed)
                               .split(indices, y, groups))
        train_rel, cal_rel = next(GroupShuffleSplit(n_splits=1, test_size=.25, random_state=seed)
                                  .split(train_cal, y[train_cal], groups[train_cal]))
        train, cal = train_cal[train_rel], train_cal[cal_rel]
        if all(np.bincount(y[part], minlength=2).min() >= 3 for part in (train, cal, test)):
            return train, cal, test
    raise HTTPException(422, 'Faltan ejemplos positivos/negativos independientes en cada partición')


def train_model(actor):
    rows = db.all('ml_training_records', modelo_facial=f'eq.{settings.face_model}',
                  version_modelo_facial=f'eq.{settings.face_version}', order='id')
    if any(not r.get('grupo_validacion') for r in rows):
        raise HTTPException(422, 'Asigna grupo_validacion a todos los ejemplos antes de entrenar')
    train, cal, test = split_groups(rows)
    x = np.array([[r[k] for k in FEATURES] for r in rows], dtype=float)
    y = np.array([int(r['resultado_real']) for r in rows])
    if not np.isfinite(x).all():
        raise HTTPException(422, 'El dataset contiene valores incompletos o no finitos')
    estimator = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, random_state=42))
    estimator.fit(x[train], y[train])
    calibrated = CalibratedClassifierCV(FrozenEstimator(estimator), method='sigmoid')
    calibrated.fit(x[cal], y[cal])
    probabilities = calibrated.predict_proba(x[test])[:, 1]
    predicted = probabilities >= .5
    tn, fp, fn, tp = confusion_matrix(y[test], predicted, labels=[0, 1]).ravel().tolist()
    identity = str(uuid4())
    directory = settings.model_dir / 'ml'
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / f'{identity}.joblib'
    joblib.dump({'features': FEATURES, 'model': calibrated}, target)
    payload = {
        'id': identity, 'nombre': 'LogisticRegression', 'version': identity,
        'algoritmo': 'regresion_logistica', 'modelo_facial': settings.face_model,
        'version_modelo_facial': settings.face_version, 'calibrado': True,
        'metodo_calibracion': 'sigmoid_holdout_groups',
        'artefacto_referencia': target.name,
        'dataset_referencia': datetime.now(timezone.utc).isoformat(),
        'parametros': {'features': list(FEATURES), 'train_ids': [rows[i]['id'] for i in train],
                       'calibration_ids': [rows[i]['id'] for i in cal],
                       'test_ids': [rows[i]['id'] for i in test],
                       'brier_score': float(brier_score_loss(y[test], probabilities))},
        'precision_score': float(precision_score(y[test], predicted, zero_division=0)),
        'recall_score': float(recall_score(y[test], predicted, zero_division=0)),
        'f1_score': float(f1_score(y[test], predicted, zero_division=0)),
        'tasa_falsos_positivos': fp / (fp + tn),
        'tasa_falsos_negativos': fn / (fn + tp),
        'matriz_confusion': {'tn': tn, 'fp': fp, 'fn': fn, 'tp': tp},
    }
    try:
        model = db.insert('ml_models', payload)
    except Exception:
        target.unlink(missing_ok=True)
        raise
    db.audit(actor, 'entrenar', 'ml_models', identity, {'ejemplos': len(rows)})
    return {k: v for k, v in model.items() if k not in ('parametros', 'artefacto_referencia')}


def predict(features):
    models = db.select('ml_models', modelo_facial=f'eq.{settings.face_model}',
                       version_modelo_facial=f'eq.{settings.face_version}', calibrado='eq.true',
                       order='created_at.desc', limit='1')
    if not models:
        return None, None
    model = models[0]
    target: Path = settings.model_dir / 'ml' / f'{UUID(model["id"])}.joblib'
    if not target.is_file():
        raise HTTPException(503, 'El modelo ML registrado no está disponible en este servidor')
    # Only locally generated artifacts, never user-supplied pickle paths.
    artifact = joblib.load(target)
    x = np.array([[features[k] for k in artifact['features']]], dtype=float)
    return float(artifact['model'].predict_proba(x)[0, 1]), model['id']
