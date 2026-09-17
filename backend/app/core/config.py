"""Configuration is read only from server environment / backend/.env."""
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / '.env')


@dataclass(frozen=True)
class Settings:
    supabase_url: str = os.getenv('SUPABASE_URL', '').rstrip('/')
    secret_key: str = os.getenv('SUPABASE_SECRET_KEY', '')
    cors_origins: tuple[str, ...] = tuple(
        x.strip() for x in os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
        if x.strip()
    )
    face_model: str = os.getenv('FACE_MODEL', 'buffalo_l')
    face_version: str = os.getenv('FACE_MODEL_VERSION', '1')
    threshold: float | None = (
        float(os.environ['FACE_THRESHOLD']) if os.getenv('FACE_THRESHOLD') else None
    )
    retention_days: int = int(os.getenv('RETENTION_DAYS', '90'))
    min_sharpness: float = float(os.getenv('MIN_FACE_SHARPNESS', '50'))
    min_face_pixels: int = int(os.getenv('MIN_FACE_PIXELS', '80'))
    max_upload_bytes: int = 8 * 1024 * 1024
    max_image_pixels: int = 16_000_000
    model_dir: Path = BASE_DIR / 'models'

    def __post_init__(self):
        if self.threshold is not None and not -1 <= self.threshold <= 1:
            raise ValueError('FACE_THRESHOLD debe estar entre -1 y 1')
        if self.retention_days <= 0:
            raise ValueError('RETENTION_DAYS debe ser positivo')
        if self.supabase_url and not self.supabase_url.startswith('https://'):
            raise ValueError('SUPABASE_URL debe usar HTTPS')


settings = Settings()
