"""
Insert demo portfolio rows for a builder (PROFESSIONAL) user so the Projects page shows cards.

Prerequisites:
  - DATABASE_URL set (e.g. in .env)
  - User exists with role PROFESSIONAL and a professional_profiles row

Usage (from jointlly_backend with venv activated):

  python scripts/seed_builder_portfolio_dummy.py builder@example.com

Idempotent: skips if any portfolio item with project_name starting with "JP Demo:" already exists.
Use --force to insert another set (may duplicate cards if run twice with --force).
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.professional import ProfessionalProfile, Portfolio
from app.models.user import User
from app.utils.constants import ProjectType, Role

DEMO_PREFIX = "JP Demo:"

DUMMY_PROJECTS: list[dict] = [
    {
        "project_name": f"{DEMO_PREFIX} Skyline Residence",
        "project_type": ProjectType.CONTRACT_CONSTRUCTION,
        "location": "Whitefield, Bengaluru",
        "area_sqft": 4200.0,
        "completion_date": date(2024, 3, 15),
        "description": "G+4 premium residence with basement parking and rooftop utilities.",
        "images": None,
    },
    {
        "project_name": f"{DEMO_PREFIX} Tech Park Annex",
        "project_type": ProjectType.JV_JD,
        "location": "Electronic City Phase 2",
        "area_sqft": 185000.0,
        "completion_date": date(2023, 11, 1),
        "description": "JV development: two towers with shared amenities and retail podium.",
        "images": None,
    },
    {
        "project_name": f"{DEMO_PREFIX} Indiranagar Loft",
        "project_type": ProjectType.INTERIOR,
        "location": "Indiranagar, Bengaluru",
        "area_sqft": 2800.0,
        "completion_date": date(2025, 1, 10),
        "description": "Full interior fit-out: modular kitchen, lighting design, and bespoke joinery.",
        "images": None,
    },
    {
        "project_name": f"{DEMO_PREFIX} Koramangala Facelift",
        "project_type": ProjectType.RECONSTRUCTION,
        "location": "Koramangala 5th Block",
        "area_sqft": 1950.0,
        "completion_date": date(2024, 8, 20),
        "description": "Structural strengthening, facade upgrade, and waterproofing package.",
        "images": None,
    },
]


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo builder portfolio projects.")
    parser.add_argument("email", help="Builder user email (PROFESSIONAL role)")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Insert demo rows even if JP Demo items already exist",
    )
    args = parser.parse_args()

    if AsyncSessionLocal is None:
        print("DATABASE_URL is not set; cannot connect.", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == args.email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"No user with email {args.email!r}", file=sys.stderr)
            sys.exit(1)
        if user.role != Role.PROFESSIONAL:
            print(f"User {args.email!r} has role {user.role}; expected PROFESSIONAL.", file=sys.stderr)
            sys.exit(1)

        pr = await session.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.user_id == user.id)
        )
        profile = pr.scalar_one_or_none()
        if not profile:
            print(
                "No professional_profiles row for this user. Create a builder profile first.",
                file=sys.stderr,
            )
            sys.exit(1)

        existing = await session.execute(
            select(Portfolio).where(Portfolio.professional_id == profile.id)
        )
        rows = list(existing.scalars().all())
        if not args.force and any(
            (p.project_name or "").startswith(DEMO_PREFIX) for p in rows
        ):
            print(
                f"Demo portfolio already present for {args.email} (names starting with {DEMO_PREFIX!r}). "
                "Use --force to insert again."
            )
            return

        for item in DUMMY_PROJECTS:
            session.add(
                Portfolio(
                    professional_id=profile.id,
                    project_name=item["project_name"],
                    project_type=item["project_type"],
                    location=item.get("location"),
                    area_sqft=item.get("area_sqft"),
                    completion_date=item.get("completion_date"),
                    images=item.get("images"),
                    description=item.get("description"),
                )
            )
        await session.commit()
        print(f"Inserted {len(DUMMY_PROJECTS)} demo portfolio project(s) for {args.email!r}.")


if __name__ == "__main__":
    asyncio.run(main())
