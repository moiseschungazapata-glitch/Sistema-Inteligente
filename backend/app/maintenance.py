"""Run from a trusted server scheduler using its environment, not a public cron URL."""
from app.database.connection import db

if __name__ == '__main__':
    print(db.rpc('aplicar_retencion', {'p_actor': None}))
