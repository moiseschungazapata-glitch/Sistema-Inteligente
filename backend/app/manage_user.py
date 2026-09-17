"""Provision profiles for existing Supabase Auth users from a trusted terminal."""
import argparse
from uuid import UUID
from app.database.connection import db


def main():
    parser = argparse.ArgumentParser(description='Asignar un perfil a un usuario existente de Supabase Auth')
    parser.add_argument('--user-id', type=UUID, required=True)
    parser.add_argument('--nombre', required=True)
    parser.add_argument('--rol', choices=['administrador', 'operador', 'consulta'], required=True)
    args = parser.parse_args()
    identity = str(args.user_id)
    data = {'nombre': args.nombre.strip(), 'rol': args.rol, 'activo': True}
    if not data['nombre']:
        parser.error('El nombre no puede estar vacío')
    if db.select('perfiles', id=f'eq.{identity}'):
        db.update('perfiles', data, id=f'eq.{identity}')
    else:
        db.insert('perfiles', {'id': identity, **data})
    db.audit(None, 'asignar_perfil_desde_terminal', 'perfiles', identity, {'rol': args.rol})
    print('Perfil guardado.')


if __name__ == '__main__':
    main()
