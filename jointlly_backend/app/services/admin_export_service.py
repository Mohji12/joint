"""
Admin Excel export service for builder approval workflows.
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple
from uuid import UUID

from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.admin_builder_export import AdminBuilderExport
from app.models.form_submission import FormSubmission
from app.models.professional import ProfessionalProfile
from app.models.user import User


_BUILDER_FORM_TYPES = [
    "contract-construction",
    "joint-venture",
    "interior",
    "reconstruction",
]


class AdminExportService:
    """Generate and store single/bulk builder exports."""

    @staticmethod
    def _export_dir() -> Path:
        # Keep generated files inside backend folder.
        root = Path(__file__).resolve().parents[2]
        out = root / "generated_exports" / "builder"
        out.mkdir(parents=True, exist_ok=True)
        return out

    @staticmethod
    def _flatten(prefix: str, value: Any, out: Dict[str, Any]) -> None:
        if isinstance(value, dict):
            for k, v in value.items():
                key = f"{prefix}.{k}" if prefix else str(k)
                AdminExportService._flatten(key, v, out)
            return
        if isinstance(value, list):
            out[prefix] = ", ".join(str(x) for x in value)
            return
        out[prefix] = value

    @staticmethod
    async def _latest_forms_for_users(
        db: AsyncSession, user_hex_ids: List[str]
    ) -> Dict[Tuple[str, str], FormSubmission]:
        if not user_hex_ids:
            return {}
        result = await db.execute(
            select(FormSubmission)
            .where(
                FormSubmission.side == "builder",
                FormSubmission.user_id.in_(user_hex_ids),
                FormSubmission.form_type.in_(_BUILDER_FORM_TYPES),
            )
            .order_by(FormSubmission.created_at.desc())
        )
        latest: Dict[Tuple[str, str], FormSubmission] = {}
        for sub in result.scalars().all():
            key = (sub.user_id or "", sub.form_type)
            if key not in latest:
                latest[key] = sub
        return latest

    @staticmethod
    def _profile_row(profile: ProfessionalProfile, user: Optional[User]) -> Dict[str, Any]:
        return {
            "builder_id": str(profile.id),
            "user_id": str(profile.user_id),
            "email": user.email if user else None,
            "name": user.name if user else None,
            "company_name": profile.company_name,
            "phone": profile.phone,
            "city": profile.city,
            "experience_years": profile.experience_years,
            "rera_experience": profile.rera_experience,
            "approval_status": str(profile.approval_status.value if hasattr(profile.approval_status, "value") else profile.approval_status),
            "approval_note": profile.approval_note,
            "approved_by_admin_user_id": profile.approved_by_admin_user_id,
            "approved_at": profile.approved_at.isoformat() if profile.approved_at else None,
            "rejected_at": profile.rejected_at.isoformat() if profile.rejected_at else None,
            "profile_created_at": profile.created_at.isoformat() if profile.created_at else None,
        }

    @staticmethod
    def _rows_from_profiles(
        profiles: Iterable[ProfessionalProfile],
        users_by_id: Dict[UUID, User],
        latest_forms: Dict[Tuple[str, str], FormSubmission],
    ) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for profile in profiles:
            base = AdminExportService._profile_row(profile, users_by_id.get(profile.user_id))
            user_hex = profile.user_id.hex
            has_any_form = False
            for form_type in _BUILDER_FORM_TYPES:
                sub = latest_forms.get((user_hex, form_type))
                if sub is None:
                    continue
                has_any_form = True
                payload = sub.payload if isinstance(sub.payload, dict) else {}
                flattened: Dict[str, Any] = {}
                AdminExportService._flatten("", payload, flattened)
                for k, v in flattened.items():
                    base[f"{form_type}.{k}"] = v
                base[f"{form_type}.__submitted_at"] = sub.created_at.isoformat() if sub.created_at else None
            base["has_builder_submission"] = has_any_form
            rows.append(base)
        return rows

    @staticmethod
    def _write_xlsx(rows: List[Dict[str, Any]], target_path: Path) -> None:
        wb = Workbook()
        ws = wb.active
        ws.title = "builders"
        if not rows:
            ws.append(["message"])
            ws.append(["No builder rows found"])
            wb.save(target_path)
            return
        headers = sorted({k for row in rows for k in row.keys()})
        ws.append(headers)
        for row in rows:
            ws.append([row.get(h) for h in headers])
        wb.save(target_path)

    @staticmethod
    async def _save_record(
        db: AsyncSession,
        *,
        scope: str,
        generated_by: UUID,
        file_name: str,
        row_count: int,
        builder_id: Optional[UUID] = None,
    ) -> AdminBuilderExport:
        record = AdminBuilderExport(
            scope=scope,
            builder_id=str(builder_id) if builder_id else None,
            generated_by=generated_by.hex,
            file_url_or_path=file_name,
            row_count=row_count,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def generate_single_builder_export(
        db: AsyncSession,
        *,
        professional_id: UUID,
        generated_by: UUID,
    ) -> Tuple[Path, AdminBuilderExport]:
        result = await db.execute(
            select(ProfessionalProfile)
            .options(selectinload(ProfessionalProfile.user))
            .where(ProfessionalProfile.id == professional_id)
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            raise ValueError("Professional profile not found")
        users_by_id = {profile.user_id: profile.user}
        latest_forms = await AdminExportService._latest_forms_for_users(db, [profile.user_id.hex])
        rows = AdminExportService._rows_from_profiles([profile], users_by_id, latest_forms)
        stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_name = f"builder_{professional_id}_{stamp}.xlsx"
        file_path = AdminExportService._export_dir() / file_name
        AdminExportService._write_xlsx(rows, file_path)
        record = await AdminExportService._save_record(
            db,
            scope="single",
            builder_id=professional_id,
            generated_by=generated_by,
            file_name=file_name,
            row_count=len(rows),
        )
        return file_path, record

    @staticmethod
    async def generate_bulk_builder_export(
        db: AsyncSession,
        *,
        generated_by: UUID,
        skip: int = 0,
        limit: int = 500,
    ) -> Tuple[Path, AdminBuilderExport]:
        result = await db.execute(
            select(ProfessionalProfile)
            .options(selectinload(ProfessionalProfile.user))
            .order_by(ProfessionalProfile.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        profiles = list(result.scalars().all())
        users_by_id = {p.user_id: p.user for p in profiles if p.user is not None}
        latest_forms = await AdminExportService._latest_forms_for_users(
            db, [p.user_id.hex for p in profiles]
        )
        rows = AdminExportService._rows_from_profiles(profiles, users_by_id, latest_forms)
        stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_name = f"builders_bulk_{stamp}.xlsx"
        file_path = AdminExportService._export_dir() / file_name
        AdminExportService._write_xlsx(rows, file_path)
        record = await AdminExportService._save_record(
            db,
            scope="bulk",
            generated_by=generated_by,
            file_name=file_name,
            row_count=len(rows),
        )
        return file_path, record

    @staticmethod
    async def list_exports(
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AdminBuilderExport]:
        result = await db.execute(
            select(AdminBuilderExport)
            .order_by(AdminBuilderExport.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_export_file(
        db: AsyncSession,
        export_id: str,
    ) -> Tuple[Path, AdminBuilderExport]:
        result = await db.execute(
            select(AdminBuilderExport).where(AdminBuilderExport.id == export_id)
        )
        record = result.scalar_one_or_none()
        if record is None:
            raise ValueError("Export record not found")
        file_path = AdminExportService._export_dir() / record.file_url_or_path
        if not file_path.exists():
            raise ValueError("Stored export file is missing")
        return file_path, record
