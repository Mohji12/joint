"""
Password utilities for local development.

IMPORTANT: Stored passwords are ONE-WAY hashes (PBKDF2-SHA256).
You cannot decrypt or reverse a hash to get the original password.

This script helps with:
  - verify   Check if a plaintext password matches a stored hash
  - hash     Generate a new hash for a known password (for DB updates)
  - reset    Set a new password for a user by email
  - lookup   Show user role/email for a stored hash or email

Usage (from jointlly_backend):
  python scripts/password_tools.py verify --hash "sha256$100000$..." --password "MyGuess123"
  python scripts/password_tools.py hash --password "NewPassword123"
  python scripts/password_tools.py reset --email user@example.com --password "NewPassword123"
  python scripts/password_tools.py lookup --email user@example.com
  python scripts/password_tools.py lookup --hash "sha256$100000$..."
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
from app.utils.password import get_password_hash, verify_password


def cmd_verify(args: argparse.Namespace) -> None:
    ok = verify_password(args.password, args.hash)
    if ok:
        print("MATCH: The password is correct for this hash.")
    else:
        print("NO MATCH: This password does not match the hash.")


def cmd_hash(args: argparse.Namespace) -> None:
    print(get_password_hash(args.password))


async def cmd_reset(args: argparse.Namespace) -> None:
    if AsyncSessionLocal is None:
        print("DATABASE_URL is not set; cannot connect.", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == args.email))
        user = result.scalar_one_or_none()
        if user is None:
            print(f"User not found: {args.email}", file=sys.stderr)
            sys.exit(1)

        user.hashed_password = get_password_hash(args.password)
        await session.commit()
        role = user.role.value if hasattr(user.role, "value") else str(user.role)
        print(f"Password updated for {user.email} ({role})")


async def cmd_lookup(args: argparse.Namespace) -> None:
    if AsyncSessionLocal is None:
        print("DATABASE_URL is not set; cannot connect.", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        if args.email:
            result = await session.execute(select(User).where(User.email == args.email))
            user = result.scalar_one_or_none()
            if user is None:
                print(f"User not found: {args.email}", file=sys.stderr)
                sys.exit(1)
            _print_user(user)
            return

        if args.hash:
            result = await session.execute(select(User))
            users = result.scalars().all()
            matches = [u for u in users if u.hashed_password == args.hash]
            if not matches:
                print("No user found with this exact hash in the database.")
                sys.exit(1)
            for user in matches:
                _print_user(user)
            return

    print("Provide --email or --hash", file=sys.stderr)
    sys.exit(1)


def _print_user(user: User) -> None:
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    print(f"email:       {user.email}")
    print(f"name:        {user.name}")
    print(f"role:        {role}")
    print(f"is_active:   {user.is_active}")
    print(f"id:          {user.id}")
    print(f"hash:        {user.hashed_password}")
    print()
    print("The original password cannot be recovered from the hash.")
    print("Use: python scripts/password_tools.py reset --email ... --password ...")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Password tools (verify / hash / reset / lookup). Cannot decrypt hashes."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_verify = sub.add_parser("verify", help="Check if a password matches a hash")
    p_verify.add_argument("--hash", required=True, help="Stored hash from users.hashed_password")
    p_verify.add_argument("--password", required=True, help="Plaintext password to test")
    p_verify.set_defaults(func=cmd_verify)

    p_hash = sub.add_parser("hash", help="Generate a new hash for a known password")
    p_hash.add_argument("--password", required=True, help="Plaintext password to hash")
    p_hash.set_defaults(func=cmd_hash)

    p_reset = sub.add_parser("reset", help="Set a new password for a user by email")
    p_reset.add_argument("--email", required=True)
    p_reset.add_argument("--password", required=True)
    p_reset.set_defaults(func=lambda a: asyncio.run(cmd_reset(a)))

    p_lookup = sub.add_parser("lookup", help="Find user by email or hash")
    p_lookup.add_argument("--email", default=None)
    p_lookup.add_argument("--hash", default=None)
    p_lookup.set_defaults(func=lambda a: asyncio.run(cmd_lookup(a)))

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
