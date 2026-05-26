"""
Create or update a dummy ADMIN user for local dashboard access.

Usage (from jointlly_backend):
  python scripts/seed_admin_dummy.py

Optional overrides:
  python scripts/seed_admin_dummy.py --email admin@jointlly.local --password "Admin@12345" --name "Dummy Admin"
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.constants import Role
from app.utils.password import get_password_hash

DEFAULT_EMAIL = "admin@jointlly.local"
DEFAULT_PASSWORD = "Admin@12345"
DEFAULT_NAME = "Dummy Admin"


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed a dummy ADMIN account.")
    parser.add_argument("--email", default=DEFAULT_EMAIL, help="Admin email")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Admin password")
    parser.add_argument("--name", default=DEFAULT_NAME, help="Admin display name")
    args = parser.parse_args()

    if AsyncSessionLocal is None:
        print("DATABASE_URL is not set; cannot connect.", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == args.email))
        user = result.scalar_one_or_none()

        if user:
            user.name = args.name
            user.role = Role.ADMIN
            user.is_active = "true"
            user.hashed_password = get_password_hash(args.password)
            await session.commit()
            print(f"Updated existing admin user: {args.email}")
        else:
            session.add(
                User(
                    email=args.email,
                    name=args.name,
                    hashed_password=get_password_hash(args.password),
                    role=Role.ADMIN,
                    is_active="true",
                )
            )
            await session.commit()
            print(f"Created dummy admin user: {args.email}")

    print("Dummy admin login is ready.")


if __name__ == "__main__":
    asyncio.run(main())
